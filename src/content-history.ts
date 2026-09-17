import { escapeReleaseText } from "./release-metadata.ts";

export const contentKinds = ["Added", "Expanded", "Corrected", "References"] as const;
export type ContentKind = typeof contentKinds[number];
export type ContentEdition = {
  version: string;
  date: string | null;
  groups: { kind: ContentKind; changes: string[] }[];
};
const emptyQueue = "No content changes queued.";
const publicationOrigin = "https://inference-and-training-systems.vercel.app";
const versionPattern = /^\d+\.\d+\.\d+$/;

function validateDate(date: string) {
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date)
    throw new Error(`Invalid content release date: ${date}`);
}

function compareVersions(a: string, b: string) {
  const left = a.split(".").map(Number), right = b.split(".").map(Number);
  for (let index = 0; index < 3; index++) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return 0;
}

export function contentLinkTarget(href: string) {
  const url = new URL(href, `${publicationOrigin}/`);
  if (url.origin !== publicationOrigin || url.pathname !== "/" || url.search || !/^#[a-z][a-z0-9-]*$/.test(url.hash))
    throw new Error(`Content notes must link to a lesson: ${href}`);
  return url.hash;
}

/** A deliberately small Markdown format shared by the reader and release job. */
export function parseContentHistory(source: string): ContentEdition[] {
  const editions: ContentEdition[] = [];
  let edition: ContentEdition | undefined;
  let group: ContentEdition["groups"][number] | undefined;
  for (const line of source.replace(/\r\n/g, "\n").split("\n")) {
    if (line.startsWith("## ")) {
      const heading = /^## (?:(Unreleased)|(\d+\.\d+\.\d+) \((\d{4}-\d{2}-\d{2})\))$/.exec(line);
      if (!heading) throw new Error(`Invalid content edition: ${line}`);
      edition = { version: heading[1] || heading[2], date: heading[3] ?? null, groups: [] };
      if (edition.date) validateDate(edition.date);
      editions.push(edition);
      group = undefined;
    } else if (!edition || !line.trim() || (line === emptyQueue && edition.version === "Unreleased")) {
      continue;
    } else if (line.startsWith("### ")) {
      const kind = line.slice(4) as ContentKind;
      if (!contentKinds.includes(kind) || edition.groups.some(item => item.kind === kind))
        throw new Error(`Invalid or repeated content category: ${kind}`);
      group = { kind, changes: [] };
      edition.groups.push(group);
    } else if (line.startsWith("- ") && group) {
      group.changes.push(line.slice(2));
    } else if (/^ {2}\S/.test(line) && group?.changes.length) {
      group.changes[group.changes.length - 1] += ` ${line.trim()}`;
    } else {
      throw new Error(`Unsupported content log line: ${line}`);
    }
  }
  if (editions[0]?.version !== "Unreleased" || editions.filter(item => item.version === "Unreleased").length !== 1)
    throw new Error("Content history needs one Unreleased section at the top");
  for (const [index, item] of editions.entries()) {
    if (index > 1 && compareVersions(editions[index - 1].version, item.version) <= 0)
      throw new Error("Content editions must have unique versions in descending order");
    if (index && !item.groups.length) throw new Error(`Content edition ${item.version} has no entries`);
    for (const section of item.groups) {
      if (!section.changes.length) throw new Error(`Empty content category: ${section.kind}`);
      for (const change of section.changes) {
        const links = [...change.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)];
        if (!links.length) throw new Error(`Content entry needs a lesson link: ${change}`);
        links.forEach(link => contentLinkTarget(link[2]));
      }
    }
  }
  return editions;
}

export function assertContentVersion(editions: ContentEdition[], version: string) {
  if (!versionPattern.test(version)) throw new Error(`Invalid content release version: ${version}`);
  if (editions.some(item => item.date && compareVersions(item.version, version) > 0))
    throw new Error(`Content history contains an edition newer than package version ${version}`);
}

export function archiveContentChanges(source: string, version: string, date: string) {
  const editions = parseContentHistory(source);
  assertContentVersion(editions, version);
  validateDate(date);
  if (!editions[0].groups.length) return source;
  if (editions.some(item => item.version === version))
    throw new Error(`Content version ${version} is already archived`);
  const start = source.indexOf("## Unreleased");
  const end = source.indexOf("\n## ", start + 1);
  const boundary = end < 0 ? source.length : end;
  const pending = source.slice(start + "## Unreleased".length, boundary).replace(/^No content changes queued\.\r?$/gm, "").trim();
  return `${source.slice(0, start)}## Unreleased\n\n${emptyQueue}\n\n## ${version} (${date})\n\n${pending}\n${end < 0 ? "" : source.slice(end)}`;
}

export function renderContentText(value: string) {
  let result = "", offset = 0;
  for (const match of value.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
    result += escapeReleaseText(value.slice(offset, match.index));
    result += `<a href="${contentLinkTarget(match[2])}">${escapeReleaseText(match[1])}</a>`;
    offset = match.index! + match[0].length;
  }
  return result + escapeReleaseText(value.slice(offset));
}

export function renderContentHistory(source: string, version: string) {
  const editions = parseContentHistory(source);
  assertContentVersion(editions, version);
  return editions.filter(item => item.groups.length).map(item => `<section class="content-history-entry">
    <h3>${item.date ? `Version ${item.version}` : `Since v${version}`}</h3>
    <p class="content-history-date">${item.date ? `<time datetime="${item.date}">${new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${item.date}T00:00:00Z`))}</time>` : "Added to the material; awaiting the next release."}</p>
    ${item.groups.map(group => `<h4>${group.kind}</h4><ul>${group.changes.map(change => `<li>${renderContentText(change)}</li>`).join("")}</ul>`).join("")}
  </section>`).join("");
}
