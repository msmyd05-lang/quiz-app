# QuizMaster — Setup Guide

## What you need (all free)
- [Vercel account](https://vercel.com) — to host the site
- [Supabase account](https://supabase.com) — for database & login
- [GitHub account](https://github.com) — to connect to Vercel

---

## Step 1 — Supabase Setup (5 min)

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Choose a name and password → Create project
3. Go to **SQL Editor** (left sidebar)
4. Paste everything from `supabase_schema.sql` and click **Run**
5. Go to **Project Settings → API**
6. Copy:
   - **Project URL** → this is your `SUPABASE_URL`
   - **anon / public key** → this is your `SUPABASE_ANON_KEY`

---

## Step 2 — GitHub Setup (2 min)

1. Go to [github.com](https://github.com) → **New repository**
2. Name it `quiz-app` → Create
3. Upload all the files from this folder to the repo

---

## Step 3 — Vercel Deploy (3 min)

1. Go to [vercel.com](https://vercel.com) → **New Project**
2. Import your GitHub repo
3. Before deploying, add **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL = (paste your Supabase URL)
   NEXT_PUBLIC_SUPABASE_ANON_KEY = (paste your anon key)
   ```
4. Click **Deploy** → done! 🎉

You'll get a link like `https://quiz-app-xyz.vercel.app`

---

## How the app works

- **Grammar section**: MCQ questions — pick the right answer, the app tracks which questions you struggle with and shows them more often
- **IT Definitions**: Flashcard style — flip the card, read the definition, then rate yourself (Again / Hard / Good / Easy)
- **Spaced Repetition**: Cards you find easy come back in days/weeks. Cards you struggle with come back tomorrow. This is the scientifically proven way to memorize.
- **Multi-user**: Anyone can sign up with email and password. Each user has their own progress.

---

## Sharing with students

Just send them the Vercel link. They sign up with their email, and their progress is saved automatically.
