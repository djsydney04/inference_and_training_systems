import { assertContentVersion, parseContentHistory, renderContentText } from "./content-history.ts";
import { escapeReleaseText } from "./release-metadata.ts";

/** Present the shared educational history; publication automation owns its source. */
export function renderEducationalChangelog(source: string, version: string): string {
  const editions = parseContentHistory(source);
  assertContentVersion(editions, version);
  return editions.filter(entry => entry.groups.length).map((entry, index) => {
    const published = entry.date !== null;
    const date = entry.date ? new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${entry.date}T00:00:00Z`)) : "";
    return `<details class="changelog-release content-edition" id="content-${published ? `v${entry.version}` : "recent"}" ${index === 0 ? "open" : ""}>
      <summary><strong>${published ? `v${entry.version}` : "Recent additions"}</strong>${published ? `<time datetime="${entry.date}">${date}</time>` : `<span class="changelog-edition-context">Since v${escapeReleaseText(version)}</span>`}</summary>
      <div class="changelog-changes">${entry.groups.map(group => `<section class="changelog-group"><h3>${escapeReleaseText(group.kind)}</h3><ul>${group.changes.map(change => `<li>${renderContentText(change)}</li>`).join("")}</ul></section>`).join("")}</div>
    </details>`;
  }).join("");
}
