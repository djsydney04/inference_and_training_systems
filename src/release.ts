import packageSource from "../package.json?raw";

// Update these notes and the package version together when publishing an edition.
export const release = {
  version: (JSON.parse(packageSource) as { version: string }).version,
  date: "2026-09-16",
  changes: [
    "A new name: AI Almanac, with a dedicated entrance and a simpler chapter reader.",
    "Readable 2D workbenches for matrix multiplication and all-reduce, using the same numerical models as the lessons.",
    "Improved small-screen layouts, diagram labels, keyboard navigation, and a searchable diagram library.",
  ],
};
const edition = release.date.slice(0, 7).replace("-", ".");
const dateLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${release.date}T00:00:00Z`));

export const releaseNotesMarkup = `<details class="release-notes" id="release-notes"><summary>Release notes <span>Version ${release.version}</span></summary><div><h2>AI Almanac · Edition ${edition}</h2><p><time datetime="${release.date}">${dateLabel}</time></p><ul>${release.changes.map(change => `<li>${change}</li>`).join("")}</ul></div></details>`;

export function initializeReleaseFooter() {
  const footer = document.querySelector("#app > footer");
  if (!footer) return;
  footer.className = "almanac-footer";
  footer.innerHTML = `<a class="footer-brand" href="#welcome">AI Almanac</a><div class="footer-edition"><span>Edition ${edition} <span aria-hidden="true">/</span> v${release.version}</span><time datetime="${release.date}">${dateLabel}</time></div><nav aria-label="Publication"><a href="#release-notes">Release notes</a><a href="#sources">Sources</a><a href="https://github.com/djsydney04/inference_and_training_systems" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a></nav>`;
}
