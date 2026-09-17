import test from "node:test";
import assert from "node:assert/strict";
import { chapters, learningPaths, prerequisiteRoute } from "../src/curriculum.ts";
import { adjacentInPath, learningPathForId, readingSequence } from "../src/learning-path.ts";

test("missing and stale stored path IDs resolve to the full curriculum", () => {
  for (const id of [undefined, null, "", "retired-path", "toString"]) {
    assert.equal(learningPathForId(id).id, "complete");
  }
  for (const path of learningPaths) {
    assert.equal(learningPathForId(path.id), path);
  }
});

test("focused navigation follows its prerequisite route rather than book order", () => {
  const sequence = readingSequence("fpga-asic", "circuits");
  assert.equal(sequence.inPath, true);
  assert.equal(sequence.previous?.id, "digital-logic");
  assert.equal(sequence.next?.id, "machine");
  const other = readingSequence("tensors", "circuits");
  assert.equal(other.next?.id, "programming");
  assert.equal(readingSequence("tensors", "complete").next?.id, "transformer");
  assert.deepEqual(adjacentInPath("tensors", "circuits"), other);
});

test("every route step has correct neighbors and one-based progress, without wrapping", () => {
  for (const path of learningPaths) {
    path.route.forEach((id, index) => {
      const sequence = readingSequence(id, path.id);
      assert.equal(sequence.path, path);
      assert.equal(sequence.inPath, true);
      assert.equal(sequence.position, index + 1);
      assert.equal(sequence.total, path.route.length);
      assert.equal(sequence.previous?.id, path.route[index - 1]);
      assert.equal(sequence.next?.id, path.route[index + 1]);
    });
  }
});

test("references and off-path chapters use book neighbors without reporting path progress", () => {
  for (const [id, previous, next] of [
    ["glossary", "projects", "sources"],
    ["sources", "glossary", undefined],
    ["cuda-kernels", "accelerator-atlas", "performance"],
  ]) {
    const sequence = readingSequence(id!, "circuits");
    assert.equal(sequence.inPath, false);
    assert.equal(sequence.position, 0);
    assert.equal(sequence.total, learningPathForId("circuits").route.length);
    assert.equal(sequence.previous?.id, previous);
    assert.equal(sequence.next?.id, next);
  }
  const missing = readingSequence("unknown-chapter", "circuits");
  assert.equal(missing.inPath, false);
  assert.equal(missing.previous, undefined);
  assert.equal(missing.next, undefined);
});

test("all published learning paths contain each prerequisite once and before its dependent chapter", () => {
  assert.equal(new Set(chapters.map((chapter) => chapter.id)).size, chapters.length);
  assert.equal(new Set(learningPaths.map((path) => path.id)).size, learningPaths.length);
  for (const path of learningPaths) {
    assert.equal(new Set(path.route).size, path.route.length, `${path.id}: duplicate chapter`);
    path.route.forEach((id, index) => {
      const chapter = chapters.find((candidate) => candidate.id === id);
      assert.ok(chapter, `${path.id}: unknown chapter ${id}`);
      for (const prerequisite of chapter.requires) {
        const prerequisiteIndex = path.route.indexOf(prerequisite);
        assert.ok(prerequisiteIndex >= 0 && prerequisiteIndex < index,
          `${path.id}: ${prerequisite} must precede ${id}`);
      }
    });
    // Re-expanding the route also exercises cycle detection on the actual graph.
    assert.deepEqual(prerequisiteRoute(path.route), path.route);
  }
});

test("canonical book order satisfies prerequisites and the full path covers every teaching chapter", () => {
  chapters.forEach((chapter, index) => {
    for (const prerequisite of chapter.requires) {
      const prerequisiteIndex = chapters.findIndex((candidate) => candidate.id === prerequisite);
      assert.ok(prerequisiteIndex >= 0 && prerequisiteIndex < index,
        `${prerequisite} must precede ${chapter.id} in the book`);
    }
  });
  assert.deepEqual(learningPathForId("complete").route,
    chapters.filter((chapter) => chapter.part !== "Reference").map((chapter) => chapter.id));
  assert.throws(() => prerequisiteRoute(["missing-chapter"]), /Unknown chapter/);
});
