export type ReleaseMetadata = {
  version: string;
  date: string;
  changes: string[];
};

export type ChangelogRelease = {
  version: string;
  date: string;
  sections: { title: string; changes: string[] }[];
};

/** Read Release Please's published entries in their original order and groups. */
export function readReleaseChangelog(changelog: string): ChangelogRelease[] {
  const heading = /^#{1,2} \[?v?(\d+\.\d+\.\d+(?:-[\w.-]+)?)\]?(?:\([^\n]*\))? \((\d{4}-\d{2}-\d{2})\)[ \t]*\r?$/gm;
  const headings = [...changelog.matchAll(heading)];
  if (!headings.length) throw new Error("CHANGELOG.md has no dated release entry");
  return headings.map((match, index) => {
    const version = match[1], date = match[2];
    const parsed = new Date(`${date}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date)
      throw new Error(`Invalid release date: ${date}`);
    const entry = changelog.slice(match.index! + match[0].length, headings[index + 1]?.index);
    const sections: ChangelogRelease["sections"] = [];
    let section = { title: "Changes", changes: [] as string[] };
    sections.push(section);
    for (const line of entry.split(/\r?\n/)) {
      const group = /^###\s+(.+?)\s*$/.exec(line);
      const item = /^[*-] (.+)/.exec(line);
      if (group) {
        section = { title: group[1], changes: [] };
        sections.push(section);
      } else if (item) section.changes.push(item[1]);
      else if (/^[ \t]+\S/.test(line) && section.changes.length)
        section.changes[section.changes.length - 1] += ` ${line.trim()}`;
    }
    const populated = sections.filter(group => group.changes.length);
    if (!populated.length) throw new Error(`Release ${version} has no changelog entries`);
    return { version, date, sections: populated };
  });
}

/** Keep publication metadata matched to the newest published GitHub changelog. */
export function readReleaseMetadata(version: string, changelog: string): ReleaseMetadata {
  const latest = readReleaseChangelog(changelog)[0];
  if (latest.version !== version)
    throw new Error(`CHANGELOG.md version ${latest.version} does not match package.json ${version}`);
  const changes = latest.sections.flatMap(section => section.changes).map(item =>
    item
      .replace(/\s*\(\[[0-9a-f]{7,40}\]\(https?:\/\/[^\s)]+\)\)/gi, "")
      .replace(/\[([^\]]+)\]\([^\s)]+\)/g, "$1")
      .replace(/\*\*|`/g, "")
      .replace(/\s+/g, " ")
      .trim(),
  );
  return { version, date: latest.date, changes };
}

export function assertReleaseVersions(version: string, copies: Record<string, unknown>) {
  for (const [name, value] of Object.entries(copies)) {
    if (value !== version) throw new Error(`${name} version ${String(value)} does not match package.json ${version}`);
  }
}

/** Source text and link attributes are always escaped before rendering. */
export function escapeReleaseText(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

/** The inline Markdown emitted by Release Please, without interpreting raw HTML. */
export function renderChangelogInline(markdown: string): string {
  const tokens = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)|`([^`\n]+)`|\*\*([^*\n]+)\*\*/g;
  let html = "", cursor = 0;
  for (const match of markdown.matchAll(tokens)) {
    html += escapeReleaseText(markdown.slice(cursor, match.index));
    if (match[2]) html += `<a href="${escapeReleaseText(match[2])}" target="_blank" rel="noreferrer">${escapeReleaseText(match[1])}</a>`;
    else if (match[3]) html += `<code>${escapeReleaseText(match[3])}</code>`;
    else html += `<strong>${escapeReleaseText(match[4])}</strong>`;
    cursor = match.index! + match[0].length;
  }
  return html + escapeReleaseText(markdown.slice(cursor));
}
