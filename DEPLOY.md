# Deploy Playbook — the same way, every project, every time

This replaces "log into the Cloudflare dashboard and click around" with two
commands you'll run identically on every site you ever build. Copy this file
(and the `wrangler.toml` pattern) into every new project going forward.

---

## Part 1 — One-time machine setup (do this once, ever)

1. Install the CLI globally:
   ```
   npm install -g wrangler
   ```
2. Log in (opens a browser, authorizes your Cloudflare account):
   ```
   wrangler login
   ```
   You won't need to do this again unless you switch machines or the token expires.

That's it — nothing else to install per project. `wrangler` is the one tool
for both static sites (Pages) and backend logic (Workers) from here on.

---

## Part 2 — Every new website: bootstrap once per project

Do this the first time you set up a given site. After this, Part 3 is all
you ever touch again for that project.

### A. Static site (Cloudflare Pages)

1. Put a `wrangler.toml` in the project root (copy the one from this repo):
   ```toml
   name = "your-project-name"
   pages_build_output_dir = "."
   compatibility_date = "2026-08-14"
   ```
   (`pages_build_output_dir = "."` means "the whole repo root is what gets
   deployed" — right for a plain HTML/CSS/JS site with no build step. If a
   future project has a build step, point this at the build output folder,
   e.g. `"./dist"`.)
2. First deploy creates the Pages project automatically:
   ```
   wrangler pages deploy .
   ```
3. *(Optional but recommended)* Point your real domain at it once, in the
   Cloudflare dashboard → **Workers & Pages** → your project → **Custom domains**.
   This is the one thing that's still a dashboard click — DNS/domain
   attachment isn't something the CLI needs to repeat per deploy.

### B. Any backend logic (Cloudflare Worker)

Only needed if the site has server-side pieces — a form handler, an API, etc.

1. Put a `wrangler.toml` next to the Worker's code (see `worker/wrangler.toml`
   in this repo for a working example with KV + email bindings):
   ```toml
   name = "your-worker-name"
   main = "your-worker-file.js"
   compatibility_date = "2026-08-14"
   ```
2. Add any bindings it needs (KV, Send Email, etc.) as `[[...]]` blocks —
   see this repo's `worker/wrangler.toml` for the exact syntax.
3. Set secrets once (never put these in the toml file — it's committed to git):
   ```
   wrangler secret put SOME_SECRET_NAME --config path/to/wrangler.toml
   ```
4. First deploy:
   ```
   wrangler deploy --config path/to/wrangler.toml
   ```

---

## Part 3 — Every deploy, forever after

This is the whole point: two commands, identical on every project.

```
# Publish the static site
wrangler pages deploy .

# Publish a Worker
wrangler deploy --config worker/wrangler.toml
```

Nothing goes live until you type one of these. `git push` is just backup —
it does not deploy anything on its own. If you want a changelog of what's
live, tag the commit right before you deploy:

```
git add -A && git commit -m "describe the change"
git tag deploy-$(date +%Y%m%d-%H%M)
git push --tags
wrangler pages deploy .
```

---

## This project specifically (Precise Laser Spa)

```
# Static site
wrangler pages deploy .

# chatbot-api Worker (KV + email delivery)
wrangler deploy --config worker/wrangler.toml
```

One thing to fix before the Worker deploy will work: `worker/wrangler.toml`
has a placeholder KV namespace ID. Run this once to find the real one
(it already exists — created back when the chatbot admin page was set up):

```
wrangler kv namespace list
```

Find the entry named `chatbot-qa`, copy its `id`, and paste it into
`worker/wrangler.toml` in place of `REPLACE_WITH_YOUR_KV_NAMESPACE_ID`.

Then set the one secret it needs (only once — it's remembered after this):

```
wrangler secret put ADMIN_PASSWORD --config worker/wrangler.toml
```

After that, `wrangler deploy --config worker/wrangler.toml` replaces the
old "copy-paste the file into the dashboard editor" step from
`SETUP-CHATBOT-ADMIN.md` and `NOTIFY-SETUP.md` for good — those docs'
*concepts* (Email Routing, destination verification, bindings) still apply,
but the *deploy step* is now just the command above.
