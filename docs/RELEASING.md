# Versioned releases

[Release Please](https://github.com/googleapis/release-please-action) maintains
one release PR as commits land on `main`. Merge that PR when an edition is ready.
The next successful Release Please run creates its `vX.Y.Z` tag and GitHub release.
The site shows the new version when the merged source is built and deployed.

## What updates together

The bot updates `package.json`, both root versions in `package-lock.json`,
`.release-please-manifest.json`, and `CHANGELOG.md` in the same PR. The footer and
in-page release notes read the package version and latest changelog entry,
including its date. There is no separate date or version to maintain in TypeScript.

`npm run check:release` rejects mismatches, missing release notes and invalid
dates. It also runs automatically before every production build. Optionally pass
a tag to check it: `npm run check:release -- v0.2.0`.

## Material history

[CONTENT_CHANGELOG.md](../CONTENT_CHANGELOG.md) records new lessons, explanations,
worked examples, corrections and references. It also drives the site's
**Content changes** panel, linked from the publication footer. Links use the
public site's stable lesson fragments so they work on GitHub; the reader turns
them into local navigation links.

Write reader-facing entries under `## Unreleased`, grouped by `### Added`,
`### Expanded`, `### Corrected` or `### References`. Each entry is a Markdown
bullet with at least one lesson link. Continuation lines use two spaces. Avoid
raw HTML and other Markdown constructs. Example:

```markdown
### Expanded

- Explain register pressure with a worked example in [GPU anatomy](https://inference-and-training-systems.vercel.app/#gpu-chip-anatomy).
```

When Release Please prepares a PR, the workflow snapshots those entries from
its main baseline under the generated version and date, then clears Unreleased.
It validates the final commit, including that snapshot. Repeated runs regenerate
the snapshot from main, so author pending notes on main, not on the bot branch.
On the site, pending entries appear as “Since vX.Y.Z” until their release merges.
Software-only releases produce no empty content edition. A material edition may
therefore be older than the current application version.

The first entries backfill tagged editions; they do not assert an exact original
publication date for older lessons. Future entries are archived at release time.

## Choosing the next version

Use conventional commit messages, including for squash-merge titles:

| Commit | Version change |
| --- | --- |
| `fix: correct a diagram label` | Patch: `0.2.0` → `0.2.1` |
| `feat: add an SM walkthrough` | Minor: `0.2.0` → `0.3.0` |
| `feat!: change a public contract` | Minor while below 1.0; major after 1.0 |
| `docs:`, `style:`, `chore:`, `ci:`, `test:`, `refactor:` | Included in notes alongside a releasable change |

The largest applicable bump wins when several changes share a release. Versions
advance when the release PR merges, not on each development commit. Do not run
`npm version` or edit just one version file. Review the generated changelog in the
release PR; edit its prose there if needed without changing its version heading.

The initial manifest preserves the existing `0.2.0` edition. `bootstrap-sha`
starts the first generated changelog after the commit introducing that edition.
Release Please uses its own release history after the first release PR merges.

## Checks and permissions

The workflows use the repository's built-in `GITHUB_TOKEN`; no personal token or
new secret is required. Repository Settings → Actions → General must allow
GitHub Actions to create and approve pull requests. This permits bot PR creation;
the workflow does not approve or merge its own release PR.

Tests, the production build and four viewport checks of the publication footer
run before the release action. Bot-created PRs do not trigger another Actions run
with `GITHUB_TOKEN`, so the release workflow explicitly checks the generated PR
commit and reports `release-validation` on that exact SHA. Ordinary PRs run the
same checks through `verify.yml`. Merge a release PR only after validation passes.

To retry after a transient failure, rerun the failed workflow or select
Actions → Release Please → Run workflow on `main`. The bot finds the pending
release PR or merged release and continues; do not delete published tags to retry.

This setup creates GitHub releases and source archives. It does not publish an
npm package or change the site's hosting configuration. The package is private.
