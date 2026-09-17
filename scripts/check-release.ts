import { readFileSync } from "node:fs";
import { assertReleaseVersions, readReleaseMetadata } from "../src/release-metadata.ts";
import { assertContentVersion, parseContentHistory } from "../src/content-history.ts";

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const pkg = JSON.parse(read("package.json"));
const lock = JSON.parse(read("package-lock.json"));
const manifest = JSON.parse(read(".release-please-manifest.json"));
assertReleaseVersions(pkg.version, {
  "package-lock.json": lock.version,
  "package-lock.json root package": lock.packages?.[""]?.version,
  ".release-please-manifest.json": manifest["."],
});
const release = readReleaseMetadata(pkg.version, read("CHANGELOG.md"));
assertContentVersion(parseContentHistory(read("CONTENT_CHANGELOG.md")), pkg.version);
if (process.argv[2] && process.argv[2] !== `v${release.version}`)
  throw new Error(`Tag ${process.argv[2]} does not match v${release.version}`);
console.log(`Release v${release.version} (${release.date}): package, lockfile, manifest and site notes agree.`);
