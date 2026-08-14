# Contact Form & Text Widget — Cloudflare Setup

One-time setup, about 10 minutes. After this, the website's contact form and
the floating "Text us" widget both email a real, monitored inbox the moment
someone submits — instead of silently going nowhere (which is what they were
doing until now).

Uses the same `chatbot-api` Worker that already runs the chatbot admin page —
no new services, no new accounts.

---

## What gets built

| Piece | What it does |
|---|---|
| **Email Routing** | Cloudflare feature that lets a Worker send mail "from" your domain. |
| **Send Email binding** | Lets the `chatbot-api` Worker actually send. |
| **`/notify` endpoint** (already in `worker/chatbot-api.js`) | Receives the contact form / text widget submission, emails it. |

---

## Step 1 — Turn on Email Routing

1. **dash.cloudflare.com** → select the `preciselaserspa.com` zone
2. Left sidebar → **Email** → **Email Routing**
3. If it's not already on, click **Enable Email Routing** (Cloudflare adds the
   required MX/TXT records to the zone automatically — no action needed if
   the domain's nameservers are already pointed at Cloudflare, which they are
   for Pages to work)

---

## Step 2 — Verify the destination address

This is the real inbox that should get the emails — probably
`Preciselaserspa@gmail.com`, the one already used everywhere else on the site.

1. Same **Email Routing** page → **Destination addresses** tab
2. **Add destination address** → type the inbox → **Send verification email**
3. Open that inbox, click the verification link Cloudflare sends
4. It should now show **Verified** in the dashboard

*(Skip this step if that address is already verified from earlier chatbot setup.)*

---

## Step 3 — Add the Send Email binding to the Worker

1. **Compute (Workers)** → **Workers & Pages** → open **chatbot-api**
2. **Settings** → **Bindings** → **Add binding**
3. Choose **Send Email**
4. Variable name: `SEND_EMAIL` ← must match exactly, case-sensitive
5. Leave the destination address restriction **off** (so the address can be
   changed later via the variable in Step 4 without re-deploying the binding)
6. **Save** / **Deploy**

---

## Step 4 — Set the destination variable

1. Same **Settings** → **Variables and Secrets**
2. **Add** → type: **Text** (plain variable, not a secret — it's not sensitive)
3. Variable name: `NOTIFY_TO` ← exact, case-sensitive
4. Value: the verified address from Step 2, e.g. `Preciselaserspa@gmail.com`
5. **Deploy**

---

## Step 5 — Deploy the updated Worker code

1. In the `chatbot-api` Worker → **Edit code**
2. Select all the existing code, delete it
3. Open `worker/chatbot-api.js` from the website folder (already updated with
   the `/notify` endpoint), copy the whole file, paste it in
4. **Deploy**

---

## Step 6 — Test it

1. Open the live site, click **Contact**, fill out the form, **Send message**
2. Check the inbox from Step 2 — an email titled *"New contact form
   submission — Precise Laser website"* should arrive within a few seconds
3. Repeat with the floating **Text us** widget — should arrive titled
   *"New text-widget message — Precise Laser website"*
4. If either shows an on-page error instead of the success screen, the
   binding or variable name is probably mistyped — double-check Steps 3–4

---

## Notes

**If this setup isn't done yet,** the form and text widget now fail loudly
with an on-page error message ("Something went wrong sending your message —
please call or text us instead") instead of quietly pretending the message
was sent. That's intentional — better a visitor knows to call than everyone
assuming Kayla is ignoring them.

**The "from" address** (`website@preciselaserspa.com`) doesn't need to be a
real inbox — Cloudflare just needs the domain itself on Email Routing to send
as that address. Replies should go to the destination inbox directly, not
back through this address.

**Basic spam guard:** both forms include an invisible honeypot field. A
human never fills it in; simple bots often do. Submissions with it filled in
are silently dropped server-side.

**Cost:** Free. Cloudflare Email Routing has no meaningful usage limit for a
site this size.
