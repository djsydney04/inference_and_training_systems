import assert from "node:assert/strict";
import test from "node:test";
import { assertReleaseVersions, escapeReleaseText, readReleaseMetadata } from "../src/release-metadata.ts";

test("release notes track the newest generated version and date, not an older edition", () => {
  const notes = `# Changelog
## [0.3.0](https://github.com/example/compare/v0.2.0...v0.3.0) (2026-09-17)
### Features
* **diagrams:** explain \`TMA\` ([abc1234](https://github.com/example/commit/abc1234))
* Support [network routes](https://example.com/routes)
  with guided steps.
## 0.2.0 (2026-09-16)
* Old notes
`;
  assert.deepEqual(readReleaseMetadata("0.3.0", notes), {
    version: "0.3.0", date: "2026-09-17", changes: ["diagrams: explain TMA", "Support network routes with guided steps."],
  });
  assert.throws(() => readReleaseMetadata("0.2.0", notes), /does not match/);
});

test("plain, patch and prerelease headings accept both bullet styles", () => {
  for (const version of ["0.2.0", "0.2.1", "1.0.0-beta.1"])
    assert.deepEqual(readReleaseMetadata(version, `# ${version} (2028-02-29)\n\n- Fix a label\n* Add an example\n`).changes, ["Fix a label", "Add an example"]);
});

test("invalid dates and missing notes fail before publishing", () => {
  for (const date of ["2026-02-30", "2026-13-01"])
    assert.throws(() => readReleaseMetadata("0.3.0", `## 0.3.0 (${date})\n* A change`), /Invalid release date/);
  assert.throws(() => readReleaseMetadata("0.3.0", "# Changelog"), /no dated release/);
  assert.throws(() => readReleaseMetadata("0.3.0", "## 0.3.0 (2026-09-17)\n## 0.2.0 (2026-09-16)\n* Old notes"), /no changelog entries/);
});

test("version checks reject stale or missing lockfile and manifest versions", () => {
  assert.doesNotThrow(() => assertReleaseVersions("0.3.0", { lock: "0.3.0", manifest: "0.3.0" }));
  for (const value of ["0.2.0", undefined])
    assert.throws(() => assertReleaseVersions("0.3.0", { lock: value }), /lock version .* does not match/);
});

test("release note text cannot inject HTML into the publication footer", () => {
  assert.equal(escapeReleaseText('<img src="x" onerror=\'alert(1)\'> & notes'), "&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt; &amp; notes");
});
