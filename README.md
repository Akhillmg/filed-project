# FlatMate AI (`filed-project`) — College Roommate Matching & Shared Living Platform

FlatMate AI helps college students and young professionals find compatible roommates based on budget overlap, lifestyle, cleanliness, dietary habits, and sleep schedules—plus calculate equal rent and utility splits in Indian Rupees (₹).

---

## Architecture & Tech Stack

- **Framework**: Next.js 14 (App Router) & React 18
- **Styling**: Tailwind CSS (Dark Navy & Purple aesthetic) + Lucide Icons
- **Backend & Auth**: Supabase (PostgreSQL, GoTrue Auth, PostgREST, Row Level Security)
- **Testing**: Node.js built-in test runner (`node --test`)

### Project Structure
```text
├── app/
│   ├── discover/page.jsx      # Roommate discovery, compatibility sorting, filters & flat listings
│   ├── expenses/page.jsx      # Rent & utility split calculator (₹ INR) + Supabase persistence
│   ├── login/page.jsx         # Email/password authentication
│   ├── profile/page.jsx       # Protected user profile editor & private expense view
│   ├── signup/page.jsx        # Account creation with email confirmation detection
│   ├── layout.jsx             # Root layout wrapping AuthProvider & Navbar/Footer
│   └── page.jsx               # Landing page
├── components/                # Reusable UI (Navbar, Footer, Hero, Features, HowItWorks)
├── context/AuthContext.jsx    # Reactive Supabase auth session & profile state
├── lib/
│   ├── expenseCalculator.js   # Pure INR calculation & paise-rounding functions
│   ├── matching.js            # Pure deterministic rule-based compatibility engine
│   └── supabaseClient.js      # Browser-safe Supabase client (enforces anon/publishable key only)
├── supabase/schema.sql        # Idempotent PostgreSQL schema, triggers, & RLS policies
└── test/                      # Unit tests for matching algorithm & expense splitting
```

---

## Database Schema & Security

Defined in [`supabase/schema.sql`](supabase/schema.sql) (non-destructive, uses `IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`):

1. **`public.profiles`**:
   - Stores public roommate matching attributes (`id`, `name`, `city`, `locality`, `min_budget`, `max_budget`, `food_preference`, `cleanliness_level`, `sleep_schedule`, `lifestyle`, `bio`, `created_at`, `updated_at`).
   - **Privacy**: Excludes private email addresses and phone numbers.
   - **RLS**: Readable by `authenticated` users only; insert/update/delete restricted strictly to owner (`auth.uid() = id`).
2. **`public.listings`**:
   - Stores apartment/room vacancies (`id`, `owner_id`, `title`, `city`, `locality`, `monthly_rent`, `description`, `created_at`).
   - **RLS**: Readable by `authenticated` users; write access restricted to owner (`auth.uid() = owner_id`).
3. **`public.expenses`**:
   - Stores named monthly expense split calculations (`id`, `owner_id`, `title`, `amount`, `participant_count`, `created_at`).
   - **RLS**: Strictly private. Only the owner (`auth.uid() = owner_id`) can read, insert, update, or delete records.

---

## Compatibility Recommendation Algorithm

Implemented in [`lib/matching.js`](lib/matching.js) as a **deterministic, rule-based Multi-Attribute Decision Analysis (MADA)** engine (not a trained ML model). Every match score is bounded to $[0, 100]$ and decomposes into explainable strengths and friction points:

| Criterion | Weight | Scoring Rule |
| :--- | :---: | :--- |
| **Budget Overlap** | **30%** | Interval intersection using Jaccard + Szymkiewicz-Simpson overlap ratio. Disjoint ranges score `0`. Point budgets inside intervals score `100`. |
| **Lifestyle** | **25%** | Identical status scores `100`; Student + Working Professional scores `50`; Working + Hybrid scores `85`. |
| **Cleanliness** | **20%** | Ordinal distance: exact match `100`, 1-step gap `70`, 2-step gap (`Organized` vs `Relaxed`) scores `20`. |
| **Food Preference** | **15%** | `No Preference` scores `90`; exact match `100`; `Vegan` vs `Non-Vegetarian` scores `30`. |
| **Sleep Schedule** | **10%** | Exact match `100`; `Flexible` scores `85`; `Early Bird` vs `Night Owl` scores `20`. |

- **Missing Data Rule**: Missing attributes are never treated as a perfect match (penalized to `40` for budget, `50` for categorical traits).
- **Complexity**: $\mathcal{O}(nk + n \log n)$ for $n$ profiles and $k=5$ criteria, simplifying to $\mathcal{O}(n \log n)$ for sorting.

---

## Local Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure environment variables**:
   Copy `.env.example` to `.env.local` and supply your Supabase credentials from **Project Settings → API**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_or_anon_key
   ```
   *(Never place a `service_role` or `sb_secret_` key in `NEXT_PUBLIC_*` variables.)*
3. **Run database migration**:
   Open your Supabase project's **SQL Editor**, paste the contents of `supabase/schema.sql`, and execute it.
4. **Start development server & run tests**:
   ```bash
   npm test       # Runs unit tests for matching & INR expense splitting
   npm run build  # Validates production Next.js compilation
   npm run dev    # Starts local server at http://localhost:3000
   ```

---

## Deploying to Vercel

1. Push this repository to GitHub/GitLab/Bitbucket and import it into Vercel.
2. In Vercel **Project Settings → Environment Variables**, configure these two **public** variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy using the default Next.js build preset (`next build`).
4. In Supabase **Authentication → URL Configuration**, add your production Vercel domain (`https://your-app.vercel.app`) to **Site URL** and **Redirect URLs**.

---

## Limitations & Future Improvements

### Current Limitations
- **Rule-Based Weights**: Uses fixed heuristic weights rather than learned personalization from user feedback.
- **No Real-Time Messaging**: Roommate "Connect" requests display an in-app confirmation rather than opening a persistent chat thread.
- **Budget Planning Only**: The `/expenses` calculator records planned splits and does not integrate UPI/payment gateways or track settled balances across multiple users.

### Future Improvements
- **Real-Time Chat**: Add a `messages` table with Supabase Realtime subscriptions for safe in-app introductions.
- **College Verification**: Restrict signup or badge verification to `.edu` / university domains.
- **Shared Expense Groups**: Allow linking an expense calculation to multiple flatmate UUIDs so roommates can jointly view shared monthly bills.
