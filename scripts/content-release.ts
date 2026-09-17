import { archiveContentChanges } from "../src/content-history.ts";
import { readReleaseMetadata } from "../src/release-metadata.ts";

export type GitHubApi = (path: string, body?: Record<string, unknown>) => unknown;
type PullRequest = {
  state: string;
  base: { ref: string; sha: string };
  head: { ref: string; sha: string; repo: { full_name: string } };
  labels: { name: string }[];
};
type FileContent = { content: string; sha: string; encoding: string };

/** Rebuild the release PR's content snapshot from its current main baseline. */
export function finalizeContentRelease(api: GitHubApi, repo: string, number: string) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !/^\d+$/.test(number))
    throw new Error("A repository and release PR number are required");
  const root = `repos/${repo}`;
  const pull = api(`${root}/pulls/${number}`) as PullRequest;
  if (pull.state !== "open" || pull.base.ref !== "main" || pull.head.repo.full_name !== repo ||
      !pull.head.ref.startsWith("release-please--") || !pull.labels.some(label => label.name === "autorelease:pending"))
    throw new Error("Content history can only be archived on an open Release Please PR");
  const file = (path: string, ref: string) => {
    const result = api(`${root}/contents/${path}?ref=${ref}`) as FileContent;
    if (result.encoding !== "base64") throw new Error(`Unsupported encoding for ${path}`);
    return { sha: result.sha, text: Buffer.from(result.content, "base64").toString("utf8") };
  };
  const pkg = JSON.parse(file("package.json", pull.head.sha).text);
  const release = readReleaseMetadata(pkg.version, file("CHANGELOG.md", pull.head.sha).text);
  const baseline = file("CONTENT_CHANGELOG.md", pull.base.sha).text;
  const current = file("CONTENT_CHANGELOG.md", pull.head.sha);
  const archived = archiveContentChanges(baseline, release.version, release.date);
  if (current.text === archived) return false;
  // Do not attach stale notes if either side of the PR moved while we read it.
  const latest = api(`${root}/pulls/${number}`) as PullRequest;
  if (latest.head.sha !== pull.head.sha || latest.base.sha !== pull.base.sha)
    throw new Error("Release PR changed during content preparation; rerun the workflow");
  api(`${root}/contents/CONTENT_CHANGELOG.md`, {
    message: `chore: archive content changes for v${release.version}`,
    branch: pull.head.ref,
    sha: current.sha,
    content: Buffer.from(archived).toString("base64"),
  });
  return true;
}
