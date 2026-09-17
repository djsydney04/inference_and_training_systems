import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { allLessonVisuals } from "../src/lesson-visual-catalog.ts";

test("visual catalog targets real lessons and supplies inspection content for every node", () => {
  const sources = readdirSync(new URL("../src", import.meta.url)).filter(name => name.endsWith("content.ts"))
    .map(name => readFileSync(new URL(`../src/${name}`, import.meta.url), "utf8")).join("\n");
  const seen = new Set<string>();
  for (const topic of allLessonVisuals) {
    assert.ok(!seen.has(topic.id), `duplicate visual target ${topic.id}`);
    seen.add(topic.id);
    assert.ok(sources.includes(`"${topic.id}"`), `${topic.id}: missing lesson target`);
    assert.ok(topic.steps.length >= 3 && topic.steps.length <= 4, topic.id);
    if (topic.kind === "fork") assert.equal(topic.steps.length, 4, `${topic.id}: a fork needs two branches and a join`);
    assert.ok(topic.invariant && topic.example && topic.relationship, topic.id);
    for (const step of topic.steps) assert.ok(step.label && step.detail && step.note, `${topic.id}: incomplete inspection content`);
  }
  assert.equal(seen.size, 101);
});
