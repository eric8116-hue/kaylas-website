# Precise Laser Spa — Public-site release guide

Updated October 10, 2026. This is the public website, separate from the protected
CRM. Preparing or testing files does not publish them. Push, deploy, database
changes, and secret changes require Eric's separate authorization.

## Project and source layout

- Public domain: https://preciselaserspa.com/
- Pages project configured here: `web-precise-laser`.
- Browser source: root HTML/CSS/JS plus `source-images/`.
- Static release folder: `dist/` (generated, ignored by Git).
- Pages Functions: root `functions/`; shared server code: root `lib/`.
- Production D1 binding: `DB`, database `precise-laser-crm`, configured ID
  `59423115-7227-44f2-9795-ea6fb38f8f73`.
- Staff link: https://precise-laser-crm-bkm.pages.dev/index.html

`kaylas-website` is a historical project name. Do not copy old deploy commands
or upload the repository root. The old `public` output setting did not match
this repository's layout. The Pages configuration now points to `dist`.

## Local preparation and checks

Run from this repository root:

```sh
python3 tools/sync-shared.py --check
node --test tests/*.test.mjs
bash tools/build-clean-bundle.sh
WRANGLER_SEND_METRICS=false wrangler pages functions build functions --outdir /tmp/precise-public-functions-check
```

The bundle builder copies CURRENT working-tree browser assets, including local
edits, rather than silently taking an older Git commit. It performs no network
requests. It rejects nonempty destinations and symlinks; choose a new empty
folder or review the existing package before removing it. For an alternate
review folder, pass its path as the sole argument.

The allowlist includes root browser assets, `_headers`, `_redirects` when
present, `robots.txt`, `sitemap.xml`, and permitted assets under `source-images`,
`assets`, `images`, and `fonts`. It excludes backend source, internal notes,
tests, partials, caches, backups, and local credentials. A new asset type or
folder needs an intentional allowlist update.

`functions/` and `lib/` stay OUTSIDE `dist`. Wrangler compiles Functions from
the project root; they must not be uploaded as static JavaScript. The local
Functions build above checks imports separately from asset staging.

See Cloudflare's [Functions directory guidance](https://developers.cloudflare.com/pages/functions/get-started/)
and [Wrangler configuration reference](https://developers.cloudflare.com/pages/functions/wrangler-configuration/).

## Authorized release only

Before publishing, review the complete diff, pass checks for both public and
CRM repositories, and confirm the staged assets still match the reviewed
source. Commit the intended release explicitly; do not use an indiscriminate
`git add -A` because local caches and unrelated work may be present.

Confirm the existing Cloudflare project, domain attachment, production branch,
bindings and secret names without exposing secret values. This file does not
prove current Cloudflare account settings. In particular, verify automatic Git
deployments before assuming that a push is only a backup.

After separate release approval, from this repository root:

```sh
wrangler pages deploy dist --project-name=web-precise-laser --branch=main
```

This command publishes. The explicit project and branch prevent accidentally
releasing to a similarly named historical project or an unintended preview.
Do not deploy a stale `dist` folder after changing source: rebuild into a fresh
empty folder and review it again.

The CRM and public intake writers share a database and must use the SAME
existing `FIELD_ENCRYPTION_KEY`. Verify required production bindings and
secrets in both projects before release; never generate a replacement key for
existing encrypted records. The pending encryption/security release order and
historical backfill are documented in the CRM repository:
`docs/PRECISE-AUDIT-ENCRYPTION.md` and `docs/PRECISE-SECURITY-BATCH-02.md`.
Historical data backfill is a separate approved operation, not a routine deploy.

After deployment, record the commit, deployment ID/URL and actual production
checks. A local test run or successful upload alone does not verify the live
intake workflow, staff sign-in, encrypted reads, or mobile photo uploads.

## Separate chatbot Worker

`worker/` contains a distinct Worker and its own configuration. It is not part
of a Pages asset upload. Review its current name, bindings and secrets in
`worker/wrangler.toml`; the KV ID is already configured, not a placeholder.
Changes to that Worker need their own review and release authorization. An
approved Pages release does not authorize a Worker deployment.
