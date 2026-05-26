# 🪖 BootMail — Deployment Guide

## Step 1 — Run the Database Schema

1. Go to **supabase.com** → your project → **SQL Editor**
2. Click **New Query**
3. Open `lib/supabase/schema.sql` from this project
4. Paste the entire contents into the SQL editor
5. Click **Run**
6. You should see "Success" — your database is ready

\---

## Step 2 — Push to GitHub

```bash
# In your project folder (where this README lives):

git init
git add .
git commit -m "Initial BootMail commit"
git branch -M main
git remote add origin https://github.com/YOUR\\\_USERNAME/bootmail.git
git push -u origin main
```

> Your GitHub token: use the ghp\\\_ key from your secrets file
> when prompted for a password during git push

\---

## Step 3 — Deploy to Vercel

1. Go to **vercel.com** → **New Project**
2. Import your GitHub repo (bootmail)
3. Framework preset: **Next.js** (auto-detected)
4. Click **Environment Variables** and add ALL of these:

```
NEXT\\\_PUBLIC\\\_SUPABASE\\\_URL        = https://qtkoqupvfrofgbbhnxfc.supabase.co
NEXT\\\_PUBLIC\\\_APP\\\_URL             = https://bootmail.app
NEXT\\\_PUBLIC\\\_APP\\\_NAME            = BootMail
```

5. Click **Deploy**
6. Wait \~60 seconds — your app is live on a vercel.app URL

\---

## Step 4 — Connect bootmail.app Domain

1. In Vercel → your project → **Settings → Domains**
2. Add `bootmail.app`
3. Vercel gives you DNS records to add
4. Go to **Namecheap** (where you bought bootmail.app)
5. Add the DNS records Vercel shows you
6. Wait 5–30 minutes for DNS to propagate
7. bootmail.app is live ✓

\---

## Step 5 — Verify Waitlist Works

1. Visit bootmail.app
2. Scroll to the waitlist form
3. Enter a test email and submit
4. Go to Supabase → **Table Editor → waitlist**
5. You should see your test entry ✓

\---

## What's Live After These Steps

* ✅ bootmail.app landing page
* ✅ Waitlist signup → saves to Supabase
* ✅ Full database schema ready
* ✅ SSL / HTTPS automatic via Vercel
* ✅ Auto-deploys on every GitHub push

\---

## Next Features to Build (tell Claude to build these)

1. `/auth` — Sign up and login pages
2. `/dashboard` — Family home screen with recruit overview
3. `/letters/new` — Letter composer with photo upload
4. `/packages` — Care package store
5. `/book/\\\[slug]` — Public signing page
6. `/api/webhooks/stripe` — Payment handling
7. `/admin` — Your order management dashboard

\---

## Adding Stripe (when ready)

1. Go to **stripe.com** → Developers → API Keys
2. Add to Vercel environment variables:

`


   ```

3. Tell Claude: "Build the Stripe checkout for letter bundles"

\---

## File Structure

```
bootmail/
├── app/                    # Next.js app router pages
│   ├── layout.tsx          # Root layout + fonts
│   ├── page.tsx            # Landing page ← YOU ARE HERE
│   ├── globals.css         # Global styles + design system
│   ├── auth/               # Login, signup, forgot password
│   ├── dashboard/          # Main family dashboard
│   ├── letters/            # Letter composer + history
│   ├── packages/           # Care package store
│   ├── store/              # Gear + gift cards
│   ├── book/               # Legacy book + signing
│   └── api/                # API routes (Stripe, webhooks)
├── components/             # Reusable UI components
├── lib/
│   └── supabase/
│       ├── client.ts       # Browser Supabase client
│       ├── server.ts       # Server Supabase client
│       └── schema.sql      # ← Run this in Supabase first!
├── types/
│   └── index.ts            # All TypeScript types
├── .env.local              # Secrets (NEVER commit this)
├── .gitignore              # Blocks .env.local from GitHub
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

