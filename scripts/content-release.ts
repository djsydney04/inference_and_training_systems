import { archiveContentChanges } from "../src/content-history.ts";
import { readReleaseMetadata } from "../src/release-metadata.ts";

export type GitHubApi = (path: string, body?: Record<string, unknown>) => unknown;
export type ContentReleaseResult = { changed: boolean; sha: string };
type PullRequest = {
  state: string;
  base: { ref: string; sha: string };
  head: { ref: string; sha: string; repo: { full_name: string } };
  labels: { name: string }[];
};
type FileContent = { content: string; sha: string; encoding: string };

/** Rebuild the release PR's content snapshot from its current main baseline. */
export function finalizeContentRelease(api: GitHubApi, repo: string, number: string): ContentReleaseResult {
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo) || !/^\d+$/.test(number))
    throw new Error("A repository and release PR number are required");
  const root = `repos/${repo}`;
  const pull = api(`${root}/pulls/${number}`) as PullRequest;
  if (pull.state !== "open" || pull.base.ref !== "main" || pull.head.repo.full_name !== repo ||
      !pull.head.ref.startsWith("release-please--") || !pull.labels.some(label => label.name === "autorelease: pending"))
    throw new Error("Content history can only be archived on an open Release Please PR");
  // PR metadata may briefly lag a branch update. Git refs identify its actual tip.
  const ref = (branch: string) => (api(`${root}/git/ref/heads/${branch}`) as { object: { sha: string } }).object.sha;
  const headSha = ref(pull.head.ref), baseSha = ref(pull.base.ref);
  const file = (path: string, ref: string) => {
    const result = api(`${root}/contents/${path}?ref=${ref}`) as FileContent;
    if (result.encoding !== "base64") throw new Error(`Unsupported encoding for ${path}`);
    return { sha: result.sha, text: Buffer.from(result.content, "base64").toString("utf8") };
  };
  const pkg = JSON.parse(file("package.json", headSha).text);
  const release = readReleaseMetadata(pkg.version, file("CHANGELOG.md", headSha).text);
  const baseline = file("CONTENT_CHANGELOG.md", baseSha).text;
  const current = file("CONTENT_CHANGELOG.md", headSha);
  const archived = archiveContentChanges(baseline, release.version, release.date);
  if (current.text === archived) return { changed: false, sha: headSha };
  // Do not attach stale notes if either side of the PR moved while we read it.
  if (ref(pull.head.ref) !== headSha || ref(pull.base.ref) !== baseSha)
    throw new Error("Release PR changed during content preparation; rerun the workflow");
  const updated = api(`${root}/contents/CONTENT_CHANGELOG.md`, {
    message: `chore: archive content changes for v${release.version}`,
    branch: pull.head.ref,
    sha: current.sha,
    content: Buffer.from(archived).toString("base64"),
  }) as { commit: { sha: string } };
  if (!/^[0-9a-f]{40}$/.test(updated.commit?.sha)) throw new Error("GitHub did not return the archived commit SHA");
  return { changed: true, sha: updated.commit.sha };
}
