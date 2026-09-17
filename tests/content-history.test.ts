import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { archiveContentChanges, assertContentVersion, parseContentHistory, renderContentHistory, renderContentText } from "../src/content-history.ts";
import { finalizeContentRelease } from "../scripts/content-release.ts";

const pending = `# Content changes

## Unreleased

### Expanded

- Explain [SM storage](https://inference-and-training-systems.vercel.app/#gpu-chip-anatomy)
  with a worked example.

## 0.2.0 (2026-09-16)

### References

- Read the [systolic lesson](https://inference-and-training-systems.vercel.app/#systolic-array-cycles).
`;

test("a release freezes only pending material, preserving earlier notes and making retries idempotent", () => {
  const archived = archiveContentChanges(pending, "0.3.0", "2026-09-17");
  const editions = parseContentHistory(archived);
  assert.deepEqual(editions.map(item => item.version), ["Unreleased", "0.3.0", "0.2.0"]);
  assert.equal(editions[0].groups.length, 0);
  assert.equal(editions[1].date, "2026-09-17");
  assert.equal(editions[1].groups[0].changes[0], parseContentHistory(pending)[0].groups[0].changes[0]);
  assert.deepEqual(editions[2], parseContentHistory(pending)[1]);
  assert.equal(archiveContentChanges(archived, "0.3.0", "2026-09-17"), archived);
  assert.equal(archiveContentChanges(archived, "0.3.1", "2026-09-18"), archived, "software-only releases do not invent material changes");
  assert.equal(archiveContentChanges(pending.replace("## Unreleased", "## Unreleased\n\nNo content changes queued."), "0.3.0", "2026-09-17"), archived);
});

test("content history rejects invalid dates, future editions, duplicate versions and unsupported categories", () => {
  assert.throws(() => archiveContentChanges(pending, "0.2.0", "2026-09-17"), /already archived/);
  assert.throws(() => archiveContentChanges(pending, "0.3.0", "2026-02-30"), /Invalid content release date/);
  assert.throws(() => assertContentVersion(parseContentHistory(pending), "0.1.0"), /newer than package/);
  assert.throws(() => parseContentHistory(pending.replace("Expanded", "Tooling")), /category/);
  assert.throws(() => parseContentHistory(pending + pending.slice(pending.indexOf("## 0.2.0"))), /unique versions/);
  assert.throws(() => parseContentHistory(pending.replace("## Unreleased", "## Next")), /Invalid content edition/);
});

test("material links stay within the reader and content is rendered as text", () => {
  assert.equal(renderContentText('<img> & [SM](https://inference-and-training-systems.vercel.app/#gpu-chip-anatomy)'), '&lt;img&gt; &amp; <a href="#gpu-chip-anatomy">SM</a>');
  assert.throws(() => renderContentText("[bad](javascript:alert)"), /must link to a lesson/);
  assert.throws(() => parseContentHistory(pending.replace("/#gpu-chip-anatomy", "/other#gpu-chip-anatomy")), /must link to a lesson/);
  assert.match(renderContentHistory(pending, "0.2.0"), /Since v0\.2\.0/);
  assert.doesNotMatch(renderContentHistory(archiveContentChanges(pending, "0.3.0", "2026-09-17"), "0.3.0"), /Since v/);
});

function fixture(current = pending, moved = false) {
  let reads = 0;
  const writes: Record<string, unknown>[] = [];
  const pull = { state: "open", base: { ref: "main", sha: "base" }, head: { ref: "release-please--branches--main", sha: "head", repo: { full_name: "owner/repo" } }, labels: [{ name: "autorelease:pending" }] };
  const api = (path: string, body?: Record<string, unknown>) => {
    if (body) { writes.push(body); return {}; }
    if (path.endsWith("/pulls/2")) {
      reads++;
      return moved && reads > 1 ? { ...pull, head: { ...pull.head, sha: "changed" } } : pull;
    }
    const text = path.includes("package.json") ? '{"version":"0.3.0"}'
      : path.includes("/CHANGELOG.md") ? "## 0.3.0 (2026-09-17)\n* A release"
      : path.endsWith("ref=base") ? pending : current;
    return { sha: "blob", encoding: "base64", content: Buffer.from(text).toString("base64") };
  };
  return { api, writes, pull };
}

test("the release hook writes only the material log using the generated release metadata", () => {
  const { api, writes } = fixture();
  assert.equal(finalizeContentRelease(api, "owner/repo", "2"), true);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].branch, "release-please--branches--main");
  assert.equal(writes[0].sha, "blob");
  assert.equal(Buffer.from(writes[0].content as string, "base64").toString(), archiveContentChanges(pending, "0.3.0", "2026-09-17"));
  const repeated = fixture(archiveContentChanges(pending, "0.3.0", "2026-09-17"));
  assert.equal(finalizeContentRelease(repeated.api, "owner/repo", "2"), false);
  assert.equal(repeated.writes.length, 0);
});

test("the release hook refuses stale commits and unrelated PRs", () => {
  const stale = fixture(pending, true);
  assert.throws(() => finalizeContentRelease(stale.api, "owner/repo", "2"), /changed during/);
  assert.equal(stale.writes.length, 0);
  const foreign = fixture();
  foreign.pull.head.repo.full_name = "fork/repo";
  assert.throws(() => finalizeContentRelease(foreign.api, "owner/repo", "2"), /only be archived/);
  assert.equal(foreign.writes.length, 0);
});

test("the actual content history is valid and contains linked material rather than automation notes", () => {
  const source = readFileSync(new URL("../CONTENT_CHANGELOG.md", import.meta.url), "utf8");
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const editions = parseContentHistory(source);
  assertContentVersion(editions, pkg.version);
  assert.ok(editions.flatMap(item => item.groups).flatMap(item => item.changes).length >= 8);
  assert.match(renderContentHistory(source, pkg.version), /href="#gpu-chip-anatomy"/);
});
