-- Phase 2: Generation Logs Migration
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS generation_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    action TEXT NOT NULL,           -- 'ai_tailor', 'ai_evaluate', 'ai_coverletter', 'ai_interview'
    status TEXT NOT NULL,           -- 'success', 'failed'
    latency_ms INTEGER,            -- milliseconds taken
    tokens_deducted INTEGER DEFAULT 1,
    error_message TEXT,            -- null on success
    metadata JSONB,               -- optional: template used, score, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast admin dashboard queries
CREATE INDEX IF NOT EXISTS idx_gen_logs_user ON generation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_gen_logs_action ON generation_logs(action);
CREATE INDEX IF NOT EXISTS idx_gen_logs_created ON generation_logs(created_at);

-- RLS: Users can only read their own logs, admin can read all
ALTER TABLE generation_logs ENABLE ROW LEVEL SECURITY;

-- If policy exists, drop it to avoid errors when re-running
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users read own logs" ON generation_logs;
    DROP POLICY IF EXISTS "Service role full access" ON generation_logs;
EXCEPTION
    WHEN undefined_object THEN
        -- Do nothing
END $$;

CREATE POLICY "Users read own logs" ON generation_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON generation_logs
    FOR ALL USING (auth.role() = 'service_role');
