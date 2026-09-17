import packageSource from "../package.json?raw";
import changelogSource from "../CHANGELOG.md?raw";
import { escapeReleaseText, readReleaseMetadata } from "./release-metadata";

// Release Please updates both sources in the same release PR.
export const release = readReleaseMetadata((JSON.parse(packageSource) as { version: string }).version, changelogSource);
const edition = release.date.slice(0, 7).replace("-", ".");
const dateLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${release.date}T00:00:00Z`));

export const releaseNotesMarkup = `<details class="release-notes" id="release-notes"><summary>Release notes <span>Version ${release.version}</span></summary><div><h2>AI Almanac · Edition ${edition}</h2><p><time datetime="${release.date}">${dateLabel}</time></p><ul>${release.changes.map(change => `<li>${escapeReleaseText(change)}</li>`).join("")}</ul></div></details>`;

export function initializeReleaseFooter() {
  const footer = document.querySelector("#app > footer");
  if (!footer) return;
  footer.className = "almanac-footer";
  footer.innerHTML = `<a class="footer-brand" href="#welcome">AI Almanac</a><div class="footer-edition"><span>Edition ${edition} <span aria-hidden="true">/</span> v${release.version}</span><time datetime="${release.date}">${dateLabel}</time></div><nav aria-label="Publication"><a href="#release-notes">Release notes</a><a href="#sources">Sources</a><a href="https://github.com/djsydney04/inference_and_training_systems" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a></nav>`;
}
