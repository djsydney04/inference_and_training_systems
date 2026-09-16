import { test } from "node:test";
import assert from "node:assert/strict";
import { currentLessonIndex } from "../src/reading-position.ts";
test("reader highlights the last passed section without inventing one in the introduction", () => {
  assert.equal(currentLessonIndex([400, 900]), -1);
  assert.equal(currentLessonIndex([80, 900]), 0);
  assert.equal(currentLessonIndex([-500, 149, 800]), 1);
  assert.equal(currentLessonIndex([]), -1);
  assert.equal(currentLessonIndex([Infinity, 100, NaN]), 1);
  assert.equal(currentLessonIndex([150, 500]), 0);
});
