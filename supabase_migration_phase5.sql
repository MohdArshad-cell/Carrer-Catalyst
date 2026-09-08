-- Phase 5: Growth Infrastructure (Referrals & Admin)
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS referrals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID REFERENCES auth.users(id) NOT NULL,
    referred_email TEXT NOT NULL,
    referred_user_id UUID REFERENCES auth.users(id),  -- null until they signup
    status TEXT DEFAULT 'pending',  -- 'pending', 'completed', 'rewarded'
    tokens_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Each user gets a unique referral code (stored in profiles table if it exists, but usually we just put it in a separate table or rely on auth.users metadata. If you don't have a profiles table, create one)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT,
    role TEXT DEFAULT 'user',
    referral_code TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper function to generate unique referral code if needed
-- We'll handle referral code generation in the backend python code instead.

-- RLS Policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own referrals" ON referrals FOR SELECT USING (auth.uid() = referrer_id);
CREATE POLICY "Users read own profile" ON profiles FOR SELECT USING (auth.uid() = id);

-- Allow service role full access
CREATE POLICY "Service role referrals" ON referrals FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role profiles" ON profiles FOR ALL USING (auth.role() = 'service_role');
