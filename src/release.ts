import packageSource from "../package.json?raw";
import changelogSource from "../CHANGELOG.md?raw";
import { escapeReleaseText, readReleaseChangelog, readReleaseMetadata, renderChangelogInline } from "./release-metadata";
import contentHistorySource from "../CONTENT_CHANGELOG.md?raw";
import { renderContentHistory } from "./content-history";
import "./content-history.css";
import "./changelog.css";

// Release Please updates both sources in the same release PR.
export const release = readReleaseMetadata((JSON.parse(packageSource) as { version: string }).version, changelogSource);
const edition = release.date.slice(0, 7).replace("-", ".");
const formatDate = (date: string) => new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
const dateLabel = formatDate(release.date);
const repository = "https://github.com/djsydney04/inference_and_training_systems";
const history = readReleaseChangelog(changelogSource);

// Keep the existing anchor working for saved links and chapter-footer navigation.
export const releaseNotesMarkup = `<section class="release-notes changelog" id="release-notes" aria-labelledby="changelog-title">
  <header><h2 id="changelog-title">Changelog</h2><a href="${repository}/blob/main/CHANGELOG.md" target="_blank" rel="noreferrer">View on GitHub <span aria-hidden="true">↗</span></a></header>
  <div class="changelog-history">${history.map((entry, index) => `<details class="changelog-release" id="release-v${entry.version}" ${index === 0 ? "open" : ""}>
    <summary><strong>v${entry.version}</strong><time datetime="${entry.date}">${formatDate(entry.date)}</time></summary>
    <div class="changelog-changes">${entry.sections.map(group => `<section class="changelog-group"><h3>${escapeReleaseText(group.title)}</h3><ul>${group.changes.map(change => `<li>${renderChangelogInline(change)}</li>`).join("")}</ul></section>`).join("")}</div>
  </details>`).join("")}</div>
</section>`;

export const contentHistoryMarkup = `<details class="release-notes content-history" id="content-changes"><summary>Content changes <span>Lessons and references</span></summary><div><h2>What changed in the material</h2><p>New lessons, deeper explanations, worked examples, corrections and sources. Follow a link to read the material. Earlier entries catalogue what was present in the tagged edition.</p>${renderContentHistory(contentHistorySource, release.version)}</div></details>`;

export function initializeReleaseFooter() {
  const footer = document.querySelector("#app > footer");
  if (!footer) return;
  footer.className = "almanac-footer";
  footer.innerHTML = `<a class="footer-brand" href="#welcome">AI Almanac</a><div class="footer-edition"><span>Edition ${edition} <span aria-hidden="true">/</span> v${release.version}</span><time datetime="${release.date}">${dateLabel}</time></div><nav aria-label="Publication"><a href="#content-changes">Content changes</a><a href="#release-notes">Changelog</a><a href="#sources">Sources</a><a href="${repository}" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a></nav>`;
}
