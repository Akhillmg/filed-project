-- ==============================================================================
-- FlatMate AI - Complete Database Schema & Migration
-- Safe Migration: DOES NOT drop or overwrite existing tables or data.
-- ==============================================================================

-- 1. Ensure required extensions exist
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. PROFILES TABLE
-- Stores public roommate profile and compatibility attributes.
-- Privacy Note: Sensitive contact info (e.g. email, phone, passwords) is NOT stored
-- here to protect user privacy from public scraping.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL DEFAULT '',
    city TEXT,
    locality TEXT,
    min_budget NUMERIC,
    max_budget NUMERIC,
    food_preference TEXT,
    cleanliness_level TEXT,
    sleep_schedule TEXT,
    lifestyle TEXT,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Safely ensure every expected column exists even if profiles was previously created
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS locality TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS min_budget NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_budget NUMERIC;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS food_preference TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cleanliness_level TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS sleep_schedule TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lifestyle TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Safe Budget Range Constraints (non-negative, min <= max)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'profiles_budget_check'
    ) THEN
        ALTER TABLE public.profiles 
        ADD CONSTRAINT profiles_budget_check 
        CHECK (
            (min_budget IS NULL OR min_budget >= 0) AND
            (max_budget IS NULL OR max_budget >= 0) AND
            (min_budget IS NULL OR max_budget IS NULL OR max_budget >= min_budget)
        );
    END IF;
END $$;

-- ==============================================================================
-- 3. LISTINGS TABLE (Vacant Flats & Shared Rooms)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    city TEXT NOT NULL,
    locality TEXT,
    monthly_rent NUMERIC NOT NULL CHECK (monthly_rent >= 0),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS locality TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL;

-- ==============================================================================
-- 4. EXPENSES TABLE (Private Expense Tracker for Cost Splitting)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    participant_count INTEGER NOT NULL DEFAULT 1 CHECK (participant_count > 0),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 5. PERFORMANCE INDEXES
-- Optimizes location filtering, roommate search, and ownership lookups
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_locality ON public.profiles(locality);
CREATE INDEX IF NOT EXISTS idx_profiles_lifestyle ON public.profiles(lifestyle);
CREATE INDEX IF NOT EXISTS idx_listings_owner ON public.listings(owner_id);
CREATE INDEX IF NOT EXISTS idx_listings_city ON public.listings(city);
CREATE INDEX IF NOT EXISTS idx_expenses_owner ON public.expenses(owner_id);

-- ==============================================================================
-- 6. AUTOMATED TIMESTAMP TRIGGER FUNCTION (updated_at)
-- Automatically keeps updated_at fresh whenever a profile is modified
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- 7. AUTOMATIC PROFILE CREATION TRIGGER ON USER SIGNUP
-- Automatically inserts an initial profile row when an account is registered in auth.users
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- Rule: Authenticated users can read all profiles to search for flatmates.
--       Only the profile owner can insert or update their own profile.
--       No public write access. No private contact info stored.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;
CREATE POLICY "Authenticated users can read all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
CREATE POLICY "Users can delete their own profile"
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- LISTINGS POLICIES
-- Rule: Authenticated users can read all flat/room vacancies.
--       Only the listing owner can insert, update, or delete their listings.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read all listings" ON public.listings;
CREATE POLICY "Authenticated users can read all listings"
    ON public.listings
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own listings" ON public.listings;
CREATE POLICY "Users can insert their own listings"
    ON public.listings
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own listings" ON public.listings;
CREATE POLICY "Users can update their own listings"
    ON public.listings
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own listings" ON public.listings;
CREATE POLICY "Users can delete their own listings"
    ON public.listings
    FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_id);

-- ------------------------------------------------------------------------------
-- EXPENSES POLICIES
-- Rule: Strictly PRIVATE to the expense owner.
--       Only the owner (auth.uid() = owner_id) can select, insert, update, or delete.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
CREATE POLICY "Users can view their own expenses"
    ON public.expenses
    FOR SELECT
    TO authenticated
    USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert their own expenses" ON public.expenses;
CREATE POLICY "Users can insert their own expenses"
    ON public.expenses
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
CREATE POLICY "Users can update their own expenses"
    ON public.expenses
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;
CREATE POLICY "Users can delete their own expenses"
    ON public.expenses
    FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_id);

-- ==============================================================================
-- 9. RELOAD SCHEMA CACHE
-- Signals PostgREST to immediately rebuild its schema cache so that tables
-- are accessible instantly without "table not found in schema cache" errors.
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
