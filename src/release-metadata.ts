export type ReleaseMetadata = {
  version: string;
  date: string;
  changes: string[];
};

/** Read the first published entry in Release Please's generated changelog. */
export function readReleaseMetadata(version: string, changelog: string): ReleaseMetadata {
  const heading = /^#{1,2} \[?v?(\d+\.\d+\.\d+(?:-[\w.-]+)?)\]?(?:\([^\n]*\))? \((\d{4}-\d{2}-\d{2})\)\s*$/m;
  const match = heading.exec(changelog);
  if (!match) throw new Error("CHANGELOG.md has no dated release entry");
  if (match[1] !== version)
    throw new Error(`CHANGELOG.md version ${match[1]} does not match package.json ${version}`);
  const date = match[2];
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date)
    throw new Error(`Invalid release date: ${date}`);
  const entry = changelog.slice(match.index + match[0].length).split(/^#{1,2} /m)[0];
  const changes = [...entry.matchAll(/^[*-] (.+(?:\n[ \t]+\S[^\n]*)*)/gm)].map((item) =>
    item[1]
      .replace(/\s*\(\[[0-9a-f]{7,40}\]\(https?:\/\/[^\s)]+\)\)/gi, "")
      .replace(/\[([^\]]+)\]\([^\s)]+\)/g, "$1")
      .replace(/\*\*|`/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
  if (!changes.length) throw new Error(`Release ${version} has no changelog entries`);
  return { version, date, changes };
}

export function assertReleaseVersions(version: string, copies: Record<string, unknown>) {
  for (const [name, value] of Object.entries(copies)) {
    if (value !== version) throw new Error(`${name} version ${String(value)} does not match package.json ${version}`);
  }
}

/** Changelog text is rendered as text, never interpreted as HTML. */
export function escapeReleaseText(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}
