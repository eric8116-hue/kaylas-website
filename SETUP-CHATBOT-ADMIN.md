# Chatbot Admin — Cloudflare Setup

One-time setup, about 10 minutes. After this, Kayla manages chatbot answers herself at
`https://preciselaserspa.com/chatbot-admin.html` and never needs you to publish anything.

---

## What gets built

| Piece | What it does |
|---|---|
| **KV namespace** | Stores the Q&A list. Free tier covers this many times over. |
| **Worker** (`worker/chatbot-api.js`) | Serves the Q&A publicly, accepts password-protected saves. |
| **Admin page** (`chatbot-admin.html`) | Kayla's editor. Already deployed with the site. |
| **chatbot.js** | Fetches Kayla's answers on page load; falls back silently if the Worker is down. |

---

## Step 1 — Create the KV namespace

1. **dash.cloudflare.com** → left sidebar → **Storage & Databases** → **KV**
2. **Create Instance**
3. Name: `chatbot-qa`
4. **Add**

---

## Step 2 — Create the Worker

1. Left sidebar → **Compute (Workers)** → **Workers & Pages**
2. **Create** → **Start with Hello World!** → **Get started**
3. Name it exactly: `chatbot-api`
4. **Deploy** (deploys placeholder code — replaced next)
5. **Edit code** (or **Continue to project** → **Edit code**)
6. Select all the existing code and delete it
7. Open `worker/chatbot-api.js` from the website folder, copy the whole file, paste it in
8. **Deploy**

---

## Step 3 — Bind the KV namespace

1. In the `chatbot-api` Worker → **Settings** → **Bindings**
2. **Add binding** → **KV namespace**
3. Variable name: `CHATBOT_KV`  ← must match exactly, it's case-sensitive
4. KV namespace: select `chatbot-qa`
5. **Deploy**

---

## Step 4 — Set Kayla's password

1. Same **Settings** → **Variables and Secrets**
2. **Add** → type: **Secret**
3. Variable name: `ADMIN_PASSWORD`  ← exact, case-sensitive
4. Value: pick a password and give it to Kayla
5. **Deploy**

> Because it's stored as a Secret, the password is write-only — you can replace it later
> but nobody, including you, can read it back out of the dashboard.

---

## Step 5 — Confirm the Worker URL

The Worker's address is:

```
https://chatbot-api.eric8116.workers.dev
```

This is already set in `chatbot-admin.html` and `chatbot.js` — no changes needed unless the
Worker is ever renamed or recreated under a different account.

---

## Step 6 — Test it

1. Open `https://preciselaserspa.com/chatbot-admin.html`
2. Sign in with the password from Step 4
3. Add a test answer:
   - Name it: `Gift cards`
   - Trigger words: `gift card, gift certificate`
   - Answer: `Yes — gift cards are available in any amount. Call us at (631) 923-1174.`
4. **Save changes**
5. Wait about a minute, open the main site, click the chat bubble, type "gift card"
6. You should get exactly the answer you typed

---

## Handing it to Kayla

Send her:

- The link: `https://preciselaserspa.com/chatbot-admin.html`
- The password
- One line of explanation: *"Trigger words are what a customer might type. The answer is exactly what the chat says back. Save, and it's live in about a minute."*

The page explains the rest itself.

---

## Notes

**If the Worker ever goes down,** the chat keeps working — it falls back to the answers built
into `chatbot.js`. Kayla's custom answers just stop appearing until it's back.

**The admin page is hidden from Google** (`noindex`) and isn't linked anywhere on the site.
It's protected by the password, not by being secret, so the password should be a real one.

**Changing the password later:** Settings → Variables and Secrets → edit `ADMIN_PASSWORD` → Deploy.

**Cost:** KV free tier is 100,000 reads/day and 1,000 writes/day. The Worker free tier is
100,000 requests/day. A site this size won't come close.
