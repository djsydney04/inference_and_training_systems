"""CPU numerical reference. Python float arithmetic; no model or GPU dependency."""
from math import exp, isfinite


def quantize(value, scale, zero_point=0, qmin=-7, qmax=7):
    """Round scaled value to nearest/even, THEN add zero point and saturate."""
    if not all(isfinite(v) for v in (value, scale)) or scale <= 0:
        raise ValueError("finite value and positive scale required")
    if any(type(v) is not int for v in (zero_point, qmin, qmax)) or not qmin <= zero_point <= qmax or qmin >= qmax:
        raise ValueError("invalid integer code range or zero point")
    low, high = scale * (qmin - zero_point), scale * (qmax - zero_point)
    if not all(isfinite(v) for v in (low, high)):
        raise ValueError("representable endpoints must be finite")
    code = qmin if value < low else qmax if value > high else max(qmin, min(qmax, round(value / scale) + zero_point))
    return code, scale * (code - zero_point)


def grouped_weights(weights, bits=4, group_size=4, channel_scales=None):
    """W[out,in]; symmetric narrow-range codes; groups run across input columns."""
    if not weights or not weights[0] or any(len(row) != len(weights[0]) for row in weights):
        raise ValueError("nonempty rectangular weights required")
    width = len(weights[0])
    if type(bits) is not int or not 2 <= bits <= 8 or type(group_size) is not int or not 1 <= group_size <= width:
        raise ValueError("invalid bits or group size")
    channel_scales = [1.0] * width if channel_scales is None else channel_scales
    if len(channel_scales) != width or any(not isfinite(s) or s <= 0 for s in channel_scales):
        raise ValueError("positive finite channel scales required")
    limit = 2 ** (bits - 1) - 1
    codes, scales, reconstructed = [], [], []
    for row in weights:
        transformed = [w * s for w, s in zip(row, channel_scales)]
        if any(not isfinite(v) for v in transformed):
            raise ValueError("nonfinite transformed weight")
        row_codes, row_scales, row_reconstructed = [], [], []
        for start in range(0, width, group_size):
            group = transformed[start:start + group_size]
            maximum = max(map(abs, group))
            scale = maximum / limit if maximum else 1.0
            row_scales.append(scale)
            for offset, value in enumerate(group):
                code, decoded = quantize(value, scale, qmin=-limit, qmax=limit)
                row_codes.append(code)
                row_reconstructed.append(decoded / channel_scales[start + offset])
        codes.append(row_codes)
        scales.append(row_scales)
        reconstructed.append(row_reconstructed)
    return codes, scales, reconstructed


def matvec(weights, x):
    if not weights or not x or any(len(row) != len(x) for row in weights):
        raise ValueError("matrix/vector shape mismatch")
    if any(not isfinite(v) for row in weights for v in row) or any(not isfinite(v) for v in x):
        raise ValueError("finite matrix/vector values required")
    return [sum(w * value for w, value in zip(row, x)) for row in weights]


def mse(reference, candidate):
    if not reference or len(reference) != len(candidate):
        raise ValueError("nonempty equal-length vectors required")
    if any(not isfinite(v) for v in [*reference, *candidate]):
        raise ValueError("finite MSE inputs required")
    return sum((a - b) ** 2 for a, b in zip(reference, candidate)) / len(reference)


def pack_int4(codes):
    """Two signed narrow-range codes per byte; earlier code in low nibble."""
    if any(type(q) is not int or not -7 <= q <= 7 for q in codes):
        raise ValueError("only codes -7 through 7 are emitted by this format")
    payload = bytearray((len(codes) + 1) // 2)
    for i, q in enumerate(codes):
        payload[i // 2] |= (q & 15) << (4 * (i % 2))
    return bytes(payload)


def unpack_int4(payload, count):
    if type(count) is not int or count < 0 or len(payload) != (count + 1) // 2:
        raise ValueError("payload length does not match logical count")
    result = []
    for i in range(count):
        q = (payload[i // 2] >> (4 * (i % 2))) & 15
        if q == 8:
            raise ValueError("reserved -8 code in narrow-range format")
        result.append(q - 16 if q >= 8 else q)
    if count % 2 and payload[-1] >> 4:
        raise ValueError("unused high nibble must be zero")
    return result


def scalar_attention(query, keys, values):
    if not keys or len(keys) != len(values):
        raise ValueError("nonempty matched keys/values required")
    if not isfinite(query) or any(not isfinite(v) for v in [*keys, *values]):
        raise ValueError("finite attention inputs required")
    scores = [query * key for key in keys]
    if any(not isfinite(v) for v in scores):
        raise ValueError("attention scores overflowed")
    unnormalized = [exp(s - max(scores)) for s in scores]
    probabilities = [v / sum(unnormalized) for v in unnormalized]
    return probabilities, sum(p * v for p, v in zip(probabilities, values))


def main():
    weights = [[0.49, 1.04, 0.11, 4.2], [-0.31, 0.77, -0.52, -3.6]]
    x = [8, 0.1, 0.1, 0.1]
    for factor in (1, 8):
        codes, scales, decoded = grouped_weights(weights, 3, 4, [factor, 1, 1, 1])
        print(f"channel-1 factor {factor}: codes={codes}; scales={scales}")
        print(f"  y={matvec(weights, x)}; reconstructed y={matvec(decoded, x)}")
        print(f"  output MSE={mse(matvec(weights, x), matvec(decoded, x)):.8f}")
    codes, _, _ = grouped_weights(weights, 4, 4)
    flat_codes = sum(codes, [])
    payload = pack_int4(flat_codes)
    assert unpack_int4(payload, len(flat_codes)) == flat_codes
    print(f"actual INT4 payload: {payload.hex()} ({len(payload)} bytes; scales separate)")
    w = [0.49, 1.04]
    for scale in (0.5, 0.52):
        decoded = [quantize(v, scale)[1] for v in w]
        print(f"scale {scale}: weight MSE={mse(w, decoded):.5f}; output squared error={(decoded[0] - w[0]) ** 2:.5f}")
    for label, keys, values in (("full", [0, 1], [0, 10]), ("K changed", [0, 0], [0, 10]), ("V changed", [0, 1], [0, 8])):
        print(label, scalar_attention(1, keys, values))


if __name__ == "__main__":
    main()
