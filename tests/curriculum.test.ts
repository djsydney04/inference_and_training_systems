import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chapters,
  learningPaths,
  adjacentChapters,
  chapterForTarget,
} from "../src/curriculum.ts";
import { trainingTrace } from "../src/trace-math.ts";

test("curriculum IDs, prerequisites and learning paths are internally consistent", () => {
  const ids = chapters.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const chapter of chapters)
    for (const id of chapter.requires) assert.ok(ids.includes(id));
  for (const path of learningPaths) {
    const seen = new Set<string>();
    for (const id of path.route) {
      assert.ok(ids.includes(id));
      for (const prerequisite of chapters.find((c) => c.id === id)!.requires) {
        assert.ok(
          seen.has(prerequisite),
          `${path.id}: ${prerequisite} must precede ${id}`,
        );
      }
      seen.add(id);
    }
  }
  for (const chapter of chapters) {
    const visited = new Set<string>();
    const visit = (id: string) => {
      assert.ok(!visited.has(id), "prerequisite cycle");
      visited.add(id);
      for (const r of chapters.find((c) => c.id === id)!.requires) visit(r);
      visited.delete(id);
    };
    visit(chapter.id);
  }
});
test("chapter routing resolves a known lesson and respects sequence boundaries", () => {
  assert.equal(
    chapterForTarget("warp-memory", { "warp-memory": "machine" })?.id,
    "machine",
  );
  assert.equal(chapterForTarget("missing"), undefined);
  assert.equal(adjacentChapters(chapters[0].id).previous, undefined);
  assert.equal(adjacentChapters(chapters.at(-1)!.id).next, undefined);
  assert.equal(adjacentChapters("data").next?.id, "training");
});
test("training trace counts exposed communication, not the sum of busy times", () => {
  assert.equal(trainingTrace(4, 0).step, 14);
  assert.equal(trainingTrace(4, 3).step, 11);
  assert.equal(trainingTrace(4, 8).step, 10);
  assert.equal(trainingTrace(12, 8).step, 14);
  assert.throws(() => trainingTrace(-1, 3));
  assert.throws(() => trainingTrace(NaN, 3));
});
