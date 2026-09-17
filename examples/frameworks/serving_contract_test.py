"""Run: python3 -m unittest discover -s examples/frameworks -p 'serving*_test.py'."""
import unittest
from serving_contract import TextStopFilter


def partitions(text):
    if not text:
        yield []
        return
    for mask in range(1 << (len(text) - 1)):
        chunks, start = [], 0
        for index in range(len(text) - 1):
            if mask & (1 << index):
                chunks.append(text[start:index + 1])
                start = index + 1
        yield chunks + [text[start:]]


class ServingContractTest(unittest.TestCase):
    def test_all_partitions_match_independent_full_string_reference(self):
        for text, stop in [("a<END>x", "<END>"), ("a<EN", "<END>"), ("a🙂!b", "🙂!")]:
            expected = text.split(stop, 1)[0]
            for chunks in partitions(text):
                matcher = TextStopFilter([stop])
                actual = "".join(matcher.push(c) for c in chunks) + matcher.finish()
                self.assertEqual(actual, expected)

    def test_no_partial_delimiter_leaks(self):
        matcher = TextStopFilter(["<END>"])
        self.assertEqual(matcher.push("ok<EN"), "ok")
        self.assertEqual(matcher.pending, "<EN")
        self.assertEqual(matcher.push("D>ignored"), "")
        self.assertTrue(matcher.done)
        self.assertEqual(matcher.push("later"), "")

    def test_end_of_input_is_terminal_and_flushes_once(self):
        matcher = TextStopFilter(["<END>"])
        self.assertEqual(matcher.push("<E"), "")
        self.assertEqual(matcher.finish(), "<E")
        self.assertEqual(matcher.finish(), "")
        self.assertEqual(matcher.push("ND>"), "")

    def test_overlapping_stops_finish_in_character_order(self):
        for chunks in partitions("zabcd"):
            matcher = TextStopFilter(["abcd", "bc"])
            self.assertEqual("".join(matcher.push(c) for c in chunks), "za")
            self.assertEqual(matcher.matched, "bc")
        matcher = TextStopFilter(["abc", "bc"])
        self.assertEqual(matcher.push("zabc"), "z")
        self.assertEqual(matcher.matched, "abc")

    def test_passthrough_and_empty_stop_rejection(self):
        self.assertEqual(TextStopFilter([]).push("all text"), "all text")
        with self.assertRaises(ValueError):
            TextStopFilter([""])


if __name__ == "__main__":
    unittest.main()
