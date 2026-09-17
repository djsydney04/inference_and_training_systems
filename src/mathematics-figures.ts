import { arrow, figure, ink, label } from "./notebook-figures";

/** Original worked pages: pen-style guides, with exact, selectable SVG text. */
const rule = (y: number) => `<path class="notebook-rule" d="M24 ${y} H656"/>`;
const answer = (x: number, y: number, text: string, width: number) =>
  label(x, y, text) + ink(`M${x - 2} ${y + 9} Q${x + width / 2} ${y + 12} ${x + width} ${y + 7}`, true);
const matrix = (x: number, y: number, rows: number[][], cell = 62) => {
  const width = rows[0].length * cell, height = rows.length * 38;
  return ink(`M${x + 10} ${y} L${x} ${y + 1} L${x + 1} ${y + height} L${x + 11} ${y + height + 1}`) +
    ink(`M${x + width - 10} ${y} L${x + width} ${y + 1} L${x + width - 1} ${y + height} L${x + width - 11} ${y + height + 1}`) +
    rows.map((row, i) => row.map((value, j) =>
      `<text x="${x + (j + .5) * cell}" y="${y + 26 + i * 38}" text-anchor="middle">${String(value).replaceAll("-", "−")}</text>`,
    ).join("")).join("");
};

export const vectorPage = figure(
  "Read [3, 4] as two separate coordinates",
  "The vector [3,4] goes three units right and four up. Its length is five. Adding [−1,2] gives [2,6]; multiplying [3,4] by two gives [6,8].",
  345,
  arrow(52, 258, 287, 258) + arrow(52, 258, 52, 40) +
  [1, 2, 3, 4].map(i => ink(`M${52 + i * 44} 254 v8`) + label(46 + i * 44, 282, String(i), true)).join("") +
  [1, 2, 3, 4].map(i => ink(`M48 ${258 - i * 44} h8`) + label(29, 264 - i * 44, String(i), true)).join("") +
  label(34, 280, "0", true) + label(257, 305, "first", true) + label(65, 42, "second", true) +
  ink("M52 258 L184 258 L184 82", true) + arrow(52, 258, 184, 82, true) +
  label(192, 79, "[3, 4]") + label(94, 142, "5") +
  label(333, 76, "Add matching coordinates", true) +
  label(333, 114, "[3, 4] + [−1, 2]") + answer(333, 151, "= [3 − 1, 4 + 2] = [2, 6]", 283) +
  label(333, 220, "Scale every coordinate", true) +
  label(333, 256, "2 × [3, 4] = [6, 8]") +
  label(30, 331, "Length: √(3² + 4²) = √(9 + 16) = 5"),
  "The coordinate axes use the same scale: 44 drawing units per coordinate unit. The blue diagonal is the vector; the horizontal and vertical legs show its components. All operations are also written in the lesson.",
);

export const dotProductPage = figure(
  "Pair, multiply, then add",
  "Pair [2,−1,3] with [4,5,−2]. The products are 8, −5 and −6. Their sum is −3. Keeping the three products instead would be elementwise multiplication.",
  320,
  label(28, 41, "Coordinate", true) + label(254, 41, "first", true) + label(386, 41, "second", true) + label(532, 41, "third", true) +
  rule(57) + label(28, 95, "x") + label(266, 95, "2") + label(410, 95, "−1") + label(550, 95, "3") +
  label(28, 144, "w") + label(266, 144, "4") + label(410, 144, "5") + label(550, 144, "−2") +
  arrow(273, 156, 273, 189, true) + arrow(419, 156, 419, 189, true) + arrow(559, 156, 559, 189, true) +
  label(28, 220, "Multiply each pair") + label(266, 220, "8") + label(410, 220, "−5") + label(550, 220, "−6") +
  rule(241) + answer(28, 282, "Add: x · w = 8 + (−5) + (−6) = −3", 414),
  "Three coordinates become one scalar. The negative sign in a coordinate belongs to that number: (−1) × 5 = −5 and 3 × (−2) = −6.",
);

export const matrixProductPage = figure(
  "Work out all four entries of a matrix product",
  "A has rows [2,−1,3] and [0,4,1]. B has rows [4,1], [5,2] and [−2,3]. Row-by-column multiplication gives C with rows [−3,9] and [18,11].",
  465,
  label(30, 30, "A · 2 rows × 3 columns", true) + label(288, 30, "B · 3 × 2", true) + label(496, 30, "C · 2 × 2", true) +
  matrix(30, 72, [[2, -1, 3], [0, 4, 1]], 62) + label(249, 117, "×") +
  matrix(289, 53, [[4, 1], [5, 2], [-2, 3]], 62) + label(451, 117, "=") +
  matrix(495, 72, [[-3, 9], [18, 11]], 69) +
  ink("M41 107 Q123 110 204 106", true) + ink("M344 56 Q348 108 344 165", true) +
  rule(195) + label(30, 226, "Choose one row of A and one column of B.", true) +
  label(30, 265, "C[0,0] = 2×4 + (−1)×5 + 3×(−2) = −3") +
  label(30, 309, "C[0,1] = 2×1 + (−1)×2 + 3×3 = 9") +
  label(30, 353, "C[1,0] = 0×4 + 4×5 + 1×(−2) = 18") +
  label(30, 397, "C[1,1] = 0×1 + 4×2 + 1×3 = 11") +
  label(30, 443, "The shared length is 3. Each answer adds three products.", true),
  "All displayed entries are exact. Indices start at zero: C[0,1] is the first row and second column. The blue marks identify the row and column used for C[0,0].",
);

export const transposePage = figure(
  "A row becomes a column; the values stay the same",
  "A has rows [2,−1,3] and [0,4,1]. Its transpose has rows [2,0], [−1,4] and [3,1]. A[0,2] and A transpose[2,0] both equal 3.",
  300,
  label(32, 36, "A · shape [2,3]", true) + matrix(32, 77, [[2, -1, 3], [0, 4, 1]]) +
  arrow(270, 118, 405, 118, true) + label(275, 89, "transpose", true) +
  label(454, 36, "Aᵀ · shape [3,2]", true) + matrix(454, 59, [[2, 0], [-1, 4], [3, 1]]) +
  rule(197) + label(32, 235, "Entry A[0,2] = 3  →  entry Aᵀ[2,0] = 3") +
  label(32, 275, "Swap the two indices. Do not take reciprocals.", true),
  "The superscript T means transpose. It is neither a power nor an instruction to invert the matrix. Transposing twice restores A.",
);

export const reductionPage = figure(
  "The direction of a sum changes its meaning",
  "X has rows [1,3,5] and [2,4,6]. Feature means are [3,4], one per row; token means are [1.5,3.5,5.5], one per column. Adding bias [10,20,30] instead preserves both rows and all three columns.",
  410,
  label(30, 30, "Two tokens; three features each", true) + matrix(30, 63, [[1, 3, 5], [2, 4, 6]]) +
  arrow(244, 104, 325, 104, true) + label(347, 89, "(1 + 3 + 5) / 3 = 3") + label(347, 131, "(2 + 4 + 6) / 3 = 4") +
  arrow(122, 159, 122, 193, true) + label(30, 228, "[(1+2)/2, (3+4)/2, (5+6)/2] = [1.5, 3.5, 5.5]") +
  rule(254) + label(30, 289, "Broadcasting a bias is a different operation:", true) +
  label(30, 332, "[1, 3, 5] + [10, 20, 30] = [11, 23, 35]") +
  label(30, 375, "[2, 4, 6] + [10, 20, 30] = [12, 24, 36]"),
  "A reduction removes an axis, or keeps its length as one for broadcasting. Broadcasting reuses values; it does not sum them. Each row here is a token, not a separate learned parameter.",
);

export const basisPage = figure(
  "Two input coordinates choose a mixture of two rows",
  "With W rows [1,2] and [−1,1], x=[3,4] gives 3[1,2]+4[−1,1]=[−1,10]. With both W rows [1,2], every output lies along [1,2], so the rank is one.",
  360,
  label(30, 39, "W has rows [1,2] and [−1,1].", true) +
  label(30, 84, "[3,4] = 3[1,0] + 4[0,1]") +
  arrow(100, 99, 100, 134, true) + label(127, 126, "Each basis vector selects its row of W.", true) +
  label(30, 171, "[3,4]W = 3[1,2] + 4[−1,1]") + answer(30, 214, "= [3,6] + [−4,4] = [−1,10]", 363) +
  rule(243) + label(30, 281, "If both rows were [1,2], the output would be:", true) +
  label(30, 326, "[a,b]W = (a+b)[1,2]   →   only one direction"),
  "Row-vector convention: xW combines W’s rows with the coordinates of x as coefficients. The first W has two independent rows; the repeated-row W has rank one.",
);

export const attentionPage = figure(
  "From two scores to one weighted output",
  "For one query q=[1,0], keys [0,1] and [2,0] give scores 0 and square root of 2 after division by square root of 2. Softmax gives approximately [0.1956,0.8044]. Mixing values [2,0] and [0,4] gives [0.3911,3.2177].",
  432,
  label(30, 37, "q = [1,0];   k₀ = [0,1];   k₁ = [2,0]") +
  rule(59) + label(30, 97, "1. Dot products:  q·k₀ = 0;   q·k₁ = 2") +
  label(30, 145, "2. Divide by √2:   s = [0, 1.4142…]") +
  label(30, 193, "3. Subtract max:  [−1.4142…, 0]") +
  label(30, 241, "4. Exponentiate:  [0.2431…, 1]") +
  label(30, 289, "5. Divide by sum:  p ≈ [0.1956, 0.8044]") +
  rule(314) + label(30, 354, "6. Mix:  0.19557…[2,0] + 0.80443…[0,4]") +
  answer(30, 399, "Output ≈ [0.3911, 3.2177]", 305),
  "One query, two allowed keys, key width 2, value width 2. Rounded labels are for reading; calculate with unrounded values. This isolates scaled dot-product attention before its output projection, with no dropout. Masking is explained in the lesson.",
);

export const logLossPage = figure(
  "A product of probabilities becomes a sum of losses",
  "Recorded target probabilities 0.8, 0.5 and 0.25 multiply to 0.1. Their negative natural logs add to 2.302585, the mean is 0.767528, and perplexity is 2.154435.",
  330,
  label(30, 40, "Target probability", true) + label(299, 40, "Negative natural log", true) + rule(60) +
  label(30, 99, "0.8") + arrow(138, 93, 264, 93, true) + label(299, 99, "−ln(0.8) ≈ 0.223144") +
  label(30, 141, "0.5") + arrow(138, 135, 264, 135, true) + label(299, 141, "−ln(0.5) ≈ 0.693147") +
  label(30, 183, "0.25") + arrow(138, 177, 264, 177, true) + label(299, 183, "−ln(0.25) ≈ 1.386294") +
  rule(205) + label(30, 242, "Product = 0.1") + label(299, 242, "Sum ≈ 2.302585") +
  label(30, 289, "Mean loss ≈ 0.767528; exp(mean loss) ≈ 2.154435"),
  "Natural logarithms measure loss in nats. The sum and mean use full-precision values; rounding every displayed addend first can change the final decimal.",
);

export const derivativePage = figure(
  "Build a derivative from an ordinary difference",
  "For f(w)=w squared, the change from w=2 to w=2+h is 4h+h squared. Dividing by h gives 4+h, which tends to 4 as h tends to zero.",
  380,
  label(30, 38, "Start at w = 2. Change it by a small amount h.", true) +
  label(30, 83, "f(2) = 4") + label(30, 127, "f(2+h) = (2+h)(2+h) = 4 + 4h + h²") +
  label(30, 175, "Change in output = 4h + h²") +
  label(30, 223, "Change per unit input = (4h + h²) / h = 4 + h") +
  rule(248) + label(30, 284, "h = 0.1 → 4.1;   h = 0.01 → 4.01", true) +
  label(30, 315, "h = −0.01 → 3.99.   Both sides approach 4.", true) +
  answer(30, 355, "f′(2) = 4", 108),
  "Divide only when h is nonzero, then take the limit as h approaches zero. The derivative is a local rate; a finite step still includes the h squared term.",
);

export const matrixGradientPage = figure(
  "Trace the loss back to every input and weight",
  "X=[2,−1], W rows [1,3] and [4,−2], and zero bias give Y=[−2,8]. For L=Y[0]+2Y[1], L=14 and the upstream gradient is [1,2]. Input gradients are [7,0], weight gradient rows are [2,4] and [−1,−2], and bias gradient is [1,2].",
  445,
  label(30, 37, "Forward: Y = [2,−1]W = [−2,8];  L = −2 + 2×8 = 14", true) +
  rule(60) + label(30, 98, "Upstream: G = [1,2]  (one derivative per output)", true) +
  label(30, 149, "dW = XᵀG =") + matrix(227, 111, [[2], [-1]]) + label(312, 156, "×") +
  matrix(352, 130, [[1, 2]]) + label(498, 156, "=") + matrix(539, 111, [[2, 4], [-1, -2]], 54) +
  label(30, 224, "dX[0] = 1×1 + 2×3 = 7") +
  label(30, 268, "dX[1] = 1×4 + 2×(−2) = 0") +
  label(30, 312, "db = [1,2]  (each bias enters its output once)") +
  rule(336) + label(30, 376, "Check W[1,0]: add ε to 4 → Y[0] changes by −ε.", true) +
  answer(30, 418, "So ∂L/∂W[1,0] = −1, matching dW.", 415),
  "Here dX, dW and db mean derivatives of the scalar loss, not proposed parameter changes. A training update still multiplies the weight gradient by a learning rate and subtracts it.",
);
