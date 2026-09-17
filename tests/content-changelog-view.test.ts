import assert from "node:assert/strict";
import test from "node:test";
import { renderEducationalChangelog } from "../src/content-changelog-view.ts";

const published = "## 0.3.0 (2026-09-17)\n\n### Added\n\n- Read the [attention lesson](#attention).\n";

test("educational updates link into the reader and distinguish recent material from editions", () => {
  const html = renderEducationalChangelog("# Content changes\n\n## Unreleased\n\n### Expanded\n\n- Follow [tensor storage](https://inference-and-training-systems.vercel.app/#tensor-strides).\n\n" + published, "0.3.0");
  assert.match(html, /id="content-recent" open/);
  assert.match(html, /Recent additions/);
  assert.match(html, /Since v0\.3\.0/);
  assert.match(html, /href="#tensor-strides"/);
  assert.match(html, /id="content-v0\.3\.0" >/);
  assert.match(html, /datetime="2026-09-17"/);
  assert.doesNotMatch(html, /target="_blank"|\/commit\//);
});

test("an empty pending section leaves the latest educational edition expanded", () => {
  const html = renderEducationalChangelog("# Content changes\n\n## Unreleased\n\nNo content changes queued.\n\n" + published, "0.3.0");
  assert.match(html, /id="content-v0\.3\.0" open/);
  assert.doesNotMatch(html, /content-recent|Recent additions/);
});
