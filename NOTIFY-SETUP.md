# Contact Form & Text Widget — Email Delivery Setup

The website's contact form and floating "Text us" widget both POST to the
`chatbot-api` Worker's `/notify` endpoint, which emails the submission to a
real inbox.

**Delivery goes through Resend**, not Cloudflare Email Routing. The reason
matters, so it's worth stating plainly:

> Cloudflare's Email Routing send binding refuses to send to any address that
> hasn't been individually verified inside the same Cloudflare account. That's
> fine for your own address; it's a wall when the recipient is a client who
> can't find the verification email. Resend verifies your **sending domain**
> once — after that you can email **any** address forever, including new staff
> or a changed inbox, with zero further setup.

The Cloudflare path is still in the code as a fallback, but it's off by default.

---

## Setup — about 15 minutes, once

### Step 1 — Create a Resend account

1. **resend.com** → sign up (free tier: 3,000 emails/month, 100/day — far more
   than this site will use)

### Step 2 — Verify the sending domain

1. Resend dashboard → **Domains** → **Add Domain**
2. Enter `preciselaserspa.com`
3. Resend shows a set of DNS records (DKIM, SPF, usually a `MX` for bounces)
4. Add each one in **Cloudflare → DNS → Records** for the `preciselaserspa.com` zone
   - Set each to **DNS only** (grey cloud), not proxied
5. Back in Resend, click **Verify**. Usually confirms within a few minutes.

> This is what replaces per-recipient verification. Do it once, send to anyone.

### Step 3 — Create an API key

1. Resend → **API Keys** → **Create API Key**
2. Name it something like `precise-website`
3. Permission: **Sending access** is enough
4. Copy the key — it's shown only once

### Step 4 — Give the key to the Worker

In the project folder:

```
wrangler secret put RESEND_API_KEY --config worker/wrangler.toml
```

Paste the key when prompted. It's stored encrypted and never written to a file.

### Step 5 — Set the destination inbox

Edit `worker/wrangler.toml`:

```toml
[vars]
NOTIFY_TO = "Preciselaserspa@gmail.com"
```

No verification needed on this address anymore — that's the whole point.

### Step 6 — Deploy and test

```
wrangler deploy --config worker/wrangler.toml
```

Then submit the contact form on the live site. The email should arrive within
seconds, titled *"New contact form submission — Precise Laser website"*.

Replying to it goes straight back to the guest — the Worker sets `Reply-To`
to whatever email they entered.

---

## If something fails

Run this, then submit the form again:

```
wrangler tail --config worker/wrangler.toml
```

The Worker now logs Resend's own error text, so the terminal will say exactly
what's wrong — bad API key, unverified sending domain, malformed address —
instead of a generic failure. The visitor still sees a friendly message
telling them to call instead.

---

## Notes

**Nothing fails silently.** If delivery isn't configured or breaks, the form
shows an on-page error directing the visitor to call. It never fakes a
success screen — a visitor who thinks they've reached Kayla when they
haven't is worse than one who knows to phone.

**Spam guard:** both forms include an invisible honeypot field. Humans never
fill it in; simple bots often do. Those submissions are dropped server-side.

**Cost:** free at this volume. If the site ever exceeds 3,000 submissions a
month, that's a very good problem and Resend's next tier is $20/month.

**If the site moves to Kayla's own Cloudflare account,** the Resend account
and API key can move with it, or she can create her own — see `HANDOFF.md`.
