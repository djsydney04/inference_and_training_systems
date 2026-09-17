import packageSource from "../package.json?raw";
import changelogSource from "../CHANGELOG.md?raw";
import { escapeReleaseText, readReleaseChangelog, readReleaseMetadata, renderChangelogInline } from "./release-metadata";
import contentHistorySource from "../CONTENT_CHANGELOG.md?raw";
import { renderEducationalChangelog } from "./content-changelog-view";
import "./changelog.css";

// Release Please updates both sources in the same release PR.
export const release = readReleaseMetadata((JSON.parse(packageSource) as { version: string }).version, changelogSource);
const edition = release.date.slice(0, 7).replace("-", ".");
const formatDate = (date: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
const dateLabel = formatDate(release.date);
const repository = "https://github.com/djsydney04/inference_and_training_systems";
const history = readReleaseChangelog(changelogSource);

export const contentHistoryMarkup = `<section class="release-notes changelog content-history" id="content-changes" aria-labelledby="changelog-title">
  <header><h2 id="changelog-title">Changelog</h2><a href="${repository}/blob/main/CONTENT_CHANGELOG.md" target="_blank" rel="noreferrer">View on GitHub <span aria-hidden="true">↗</span></a></header>
  <p class="changelog-intro">New and expanded lessons, worked examples, diagrams, and references.</p>
  <div class="changelog-history">${renderEducationalChangelog(contentHistorySource, release.version)}</div>
  <p class="changelog-history-note">Earlier editions describe the material available at that release.</p>
</section>`;

// Preserve the existing technical-history anchor beneath the educational notes.
export const releaseNotesMarkup = `<details class="release-notes changelog changelog-technical" id="release-notes">
  <summary>Site releases <span>v${release.version}</span></summary>
  <p class="changelog-source"><a href="${repository}/blob/main/CHANGELOG.md" target="_blank" rel="noreferrer">GitHub release history <span aria-hidden="true">↗</span></a></p>
  <div class="changelog-history">${history.map((entry, index) => `<details class="changelog-release" id="release-v${entry.version}" ${index === 0 ? "open" : ""}>
    <summary><strong>v${entry.version}</strong><time datetime="${entry.date}">${formatDate(entry.date)}</time></summary>
    <div class="changelog-changes">${entry.sections.map(group => `<section class="changelog-group"><h3>${escapeReleaseText(group.title)}</h3><ul>${group.changes.map(change => `<li>${renderChangelogInline(change)}</li>`).join("")}</ul></section>`).join("")}</div>
  </details>`).join("")}</div>
</details>`;

export function initializeReleaseFooter() {
  const footer = document.querySelector("#app > footer");
  if (!footer) return;
  footer.className = "almanac-footer";
  footer.innerHTML = `<a class="footer-brand" href="#welcome">AI Almanac</a><div class="footer-edition"><span>Edition ${edition} <span aria-hidden="true">/</span> v${release.version}</span><time datetime="${release.date}">${dateLabel}</time></div><nav aria-label="Publication"><a href="#content-changes">Changelog</a><a href="#release-notes">Site releases</a><a href="#sources">Sources</a><a href="${repository}" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a></nav>`;
}
