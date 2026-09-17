"""CPU text-stop reference; no model, tokenizer, server or network required."""


class TextStopFilter:
    """First completed stop wins; simultaneous completions prefer longest.

    Inputs are already decoded text, not UTF-8 byte packets or token IDs.
    The delimiter is excluded. After a stop, later input is ignored.
    """

    def __init__(self, stops):
        if any(not stop for stop in stops):
            raise ValueError("Stop strings must be nonempty")
        self.stops = sorted(set(stops), key=len, reverse=True)
        self.pending = ""
        self.done = False
        self.matched = None

    def push(self, chunk):
        emitted = ""
        if self.done:
            return emitted
        for character in chunk:
            self.pending += character
            match = next((s for s in self.stops if self.pending.endswith(s)), None)
            if match is not None:
                emitted += self.pending[:-len(match)]
                self.pending = ""
                self.done = True
                self.matched = match
                break
            hold = max((
                length for stop in self.stops
                for length in range(1, min(len(stop), len(self.pending) + 1))
                if self.pending.endswith(stop[:length])
            ), default=0)
            split = len(self.pending) - hold
            emitted += self.pending[:split]
            self.pending = self.pending[split:]
        return emitted

    def finish(self):
        """Normal EOF releases an incomplete stop; cancellation need not do so."""
        emitted = "" if self.done else self.pending
        self.pending = ""
        self.done = True
        return emitted


def main():
    chunks = ["Hel", "lo ", "<EN", "D>ignored"]
    matcher = TextStopFilter(["<END>"])
    visible = ""
    for chunk in chunks:
        emitted = matcher.push(chunk)
        visible += emitted
        print(f"input={chunk!r:14} emit={emitted!r:8} hold={matcher.pending!r:6}")
    visible += matcher.finish()
    print(f"visible={visible!r}; stop={matcher.matched!r}")
    assert visible == "Hello "


if __name__ == "__main__":
    main()
