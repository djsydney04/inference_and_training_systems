import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  buildChapterOutline,
  figureCaptionLabel,
  itemLabel,
  itemNumber,
  sectionCaptionLabel,
} from "../src/reader-labels.ts";
import { chapters } from "../src/curriculum.ts";
import { chipExplorers } from "../src/chip-anatomy-data.ts";

test("numbers use explicit one-based ordinals and reject impossible positions", () => {
  assert.equal(itemNumber(29, 110), "29.110");
  assert.equal(itemLabel("code", 16, 3), "Code 16.3");
  assert.equal(itemLabel("check", 2, 1), "Check 2.1");
  for (const invalid of [0, -1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => itemNumber(invalid, 1), RangeError);
    assert.throws(() => itemNumber(1, invalid), RangeError);
  }
});

test("legacy section and lab numbers are replaced without discarding topics", () => {
  assert.equal(
    sectionCaptionLabel(11, 1, "4.4 / From an objective to tensors"),
    "Section 11.1 · From an objective to tensors",
  );
  assert.equal(sectionCaptionLabel(5, 2, "Lab 3.B / Online softmax"),
    "Section 5.2 · Lab · Online softmax");
  assert.equal(sectionCaptionLabel(6, 4, "Tensor metadata becomes address arithmetic"),
    "Section 6.4 · Tensor metadata becomes address arithmetic");
  assert.equal(sectionCaptionLabel(3, 1, "Section"), "Section 3.1");
  assert.equal(sectionCaptionLabel(3, 1, "Lesson 2.1"), "Section 3.1");
  // A topic mentioning a number is not a legacy display label.
  assert.equal(sectionCaptionLabel(16, 2, "32 lanes, one instruction"),
    "Section 16.2 · 32 lanes, one instruction");
  assert.equal(sectionCaptionLabel(6, 1, "C / memory ownership"),
    "Section 6.1 · C / memory ownership");
});

test("all figure kinds share the chapter sequence and preserve evidence wording", () => {
  const cases = [
    ["Figure 4.E", "Figure 12.1"],
    ["Interactive K.2", "Figure 12.1 · Interactive"],
    ["Figure K.6 · implementation bridge", "Figure 12.1 · implementation bridge"],
    ["Lab 3.B", "Figure 12.1 · Lab"],
    ["Timing workbench", "Figure 12.1 · Timing workbench"],
    ["Original schematic · execution contracts", "Figure 12.1 · Original schematic · execution contracts"],
    ["Interactive training schedule", "Figure 12.1 · Interactive training schedule"],
    ["Source image · NVIDIA", "Figure 12.1 · Source image · NVIDIA"],
    ["Figure · Original schematic", "Figure 12.1 · Original schematic"],
    ["", "Figure 12.1"],
  ];
  for (const [original, expected] of cases)
    assert.equal(figureCaptionLabel(12, 1, original), expected);
  const illustrative = figureCaptionLabel(12, 1, "Illustrative circuit");
  assert.equal(illustrative, "Figure 12.1 · Illustrative circuit");
  assert.ok(!illustrative.toLowerCase().includes("verified"));
});

test("relabeling is idempotent and moving a chapter preserves its descriptor", () => {
  for (const original of ["Interactive K.2", "Lab 3.B", "Original schematic · logical cycle model", ""]) {
    const first = figureCaptionLabel(12, 3, original);
    assert.equal(figureCaptionLabel(12, 3, first), first);
    assert.equal(figureCaptionLabel(15, 1, first), figureCaptionLabel(15, 1, original));
  }
  const section = sectionCaptionLabel(11, 1, "4.4 / From an objective to tensors");
  assert.equal(sectionCaptionLabel(11, 1, section), section);
  assert.equal(sectionCaptionLabel(13, 3, section),
    "Section 13.3 · From an objective to tensors");
});

test("outlines retain stable links when inserted or moved and reject ambiguous IDs", () => {
  const original = [{ id: "softmax", title: "Online softmax" }, { id: "backward", title: "Its gradient" }];
  const first = buildChapterOutline(5, original);
  assert.equal(first[1].number, "5.2");
  const expanded = buildChapterOutline(7, [{ id: "scores", title: "Scores" }, ...original]);
  assert.deepEqual(expanded[2], { id: "backward", title: "Its gradient", number: "7.3", label: "Section 7.3" });
  assert.deepEqual(original[1], { id: "backward", title: "Its gradient" });
  assert.throws(() => buildChapterOutline(1, [...original, original[0]]), /Duplicate section/);
  assert.throws(() => buildChapterOutline(1, [{ id: "", title: "Lost link" }]), /stable fragment/);
  assert.throws(() => buildChapterOutline(1, [{ id: "with space", title: "Lost link" }]), /stable fragment/);
  assert.throws(() => buildChapterOutline(1, [{ id: "untitled", title: " " }]), /no title/);
});

const sourceDir = new URL("../src/", import.meta.url);
const contentSources = readdirSync(sourceDir)
  .filter((name) => name.endsWith("content.ts"))
  .map((name) => ({ name, source: readFileSync(new URL(name, sourceDir), "utf8") }));

test("every curriculum chapter has exactly one authored content declaration", () => {
  const declared: string[] = [];
  for (const { source } of contentSources) {
    for (const match of source.matchAll(/<(?:section|div)\b[^>]*class="chapter(?:\s[^"]*)?"[^>]*\bid="([\w-]+)"/g))
      declared.push(match[1]);
    for (const match of source.matchAll(/\b(?:chapterMarkup|chapter)\(\s*"([\w-]+)"/g))
      declared.push(match[1]);
  }
  const canonical = chapters.map((chapter) => chapter.id);
  assert.deepEqual([...declared].sort(), [...canonical].sort());
  for (const chapter of chapters) {
    assert.ok(chapter.title.trim(), `${chapter.id}: missing canonical title`);
    assert.ok(chapter.part.trim(), `${chapter.id}: missing curriculum part`);
    assert.ok(chapter.outcome.trim(), `${chapter.id}: missing learning outcome`);
  }
});

test("authored section declarations and helper calls have unique, nonempty links and titles", () => {
  const items: { id: string; title: string }[] = [];
  const locations = new Map<string, string>();
  const chapterIDs = new Set(chapters.map((chapter) => chapter.id));
  const add = (id: string, title: string, name: string) => {
    assert.ok(!chapterIDs.has(id), `${name}: section ${id} collides with a chapter`);
    assert.ok(!locations.has(id), `${name}: duplicate ${id}, first declared in ${locations.get(id)}`);
    locations.set(id, name);
    items.push({ id, title });
  };
  for (const { name, source } of contentSources) {
    for (const match of source.matchAll(/<[^>]+\bdata-lesson="([^"]*)"[^>]*>/g)) {
      const title = match[1];
      const id = match[0].match(/\bid="([^"]*)"/)?.[1];
      // These dynamic declarations are covered through their literal helper calls.
      if (id?.includes("${") || title.includes("${")) continue;
      assert.ok(id, `${name}: data-lesson needs an explicit stable ID`);
      add(id, title, name);
    }
    for (const match of source.matchAll(/\b(?:lesson|project)\("([^"]*)",\s*"([^"]*)"/g))
      add(match[1], match[2], name);
  }
  for (const explorer of chipExplorers)
    add(explorer.id, explorer.title, "chip-anatomy-data.ts");
  assert.ok(items.length > 100, "Expected the complete authored lesson inventory");
  assert.equal(buildChapterOutline(1, items).length, items.length);
});
