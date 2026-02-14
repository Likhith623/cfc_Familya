-- ============================================================
-- FIX RLS POLICIES FOR FAMILIA APP
-- Run this in your Supabase SQL Editor (Dashboard > SQL)
-- ============================================================

-- 1. ADD INSERT POLICY FOR PROFILES (allows creating profiles during signup)
-- Service role already bypasses RLS, but let's ensure proper policies exist
CREATE POLICY "Service role can insert profiles" ON profiles
    FOR INSERT
    WITH CHECK (true);

-- Alternative: Allow users to insert their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- 2. ENSURE PROPER SELECT POLICY
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- 3. ENSURE PROPER UPDATE POLICY
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- 4. ADD DELETE POLICY (for account deletion)
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
CREATE POLICY "Users can delete own profile" ON profiles
    FOR DELETE
    USING (auth.uid() = id);

-- 5. FIX USER_LANGUAGES RLS
DROP POLICY IF EXISTS "Users manage own languages" ON user_languages;
CREATE POLICY "Users manage own languages" ON user_languages
    FOR ALL
    USING (auth.uid() = user_id);

-- 6. FIX MATCHING_QUEUE RLS
ALTER TABLE matching_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own queue" ON matching_queue;
CREATE POLICY "Users manage own queue" ON matching_queue
    FOR ALL
    USING (auth.uid() = user_id);

-- Allow viewing other users in queue for matching
DROP POLICY IF EXISTS "Users can view queue for matching" ON matching_queue;
CREATE POLICY "Users can view queue for matching" ON matching_queue
    FOR SELECT
    USING (status = 'searching');

-- 7. FIX RELATIONSHIPS RLS
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own relationships" ON relationships;
CREATE POLICY "Users can view own relationships" ON relationships
    FOR SELECT
    USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

DROP POLICY IF EXISTS "Users can insert relationships" ON relationships;
CREATE POLICY "Users can insert relationships" ON relationships
    FOR INSERT
    WITH CHECK (auth.uid() = user_a_id OR auth.uid() = user_b_id);

DROP POLICY IF EXISTS "Users can update own relationships" ON relationships;
CREATE POLICY "Users can update own relationships" ON relationships
    FOR UPDATE
    USING (auth.uid() = user_a_id OR auth.uid() = user_b_id);

-- 8. FIX MESSAGES RLS
DROP POLICY IF EXISTS "Users view own messages" ON messages;
DROP POLICY IF EXISTS "Users send messages" ON messages;
CREATE POLICY "Users view own messages" ON messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM relationships r
            WHERE r.id = messages.relationship_id
            AND (r.user_a_id = auth.uid() OR r.user_b_id = auth.uid())
        )
    );
CREATE POLICY "Users send messages" ON messages
    FOR INSERT
    WITH CHECK (sender_id = auth.uid());

-- 9. FIX NOTIFICATIONS RLS
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
CREATE POLICY "Users view own notifications" ON notifications
    FOR ALL
    USING (auth.uid() = user_id);

-- 10. ALLOW SERVICE ROLE TO BYPASS RLS (important for backend)
-- This should already be enabled by default, but let's make sure tables allow service role
-- Note: Service role key automatically bypasses RLS in Supabase

-- VERIFICATION: After running this, you can verify RLS policies with:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
