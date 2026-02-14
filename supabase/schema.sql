-- ============================================================
-- FAMILIA - Complete Supabase Database Schema
-- "Real people. Real bonds. No borders."
-- ============================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. PROFILES (Core user data + avatar)
-- ============================================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    bio TEXT,
    voice_bio_url TEXT, -- "I want to be a digital mentor because..." recording
    profile_photo_url TEXT,
    
    -- Avatar customization (JSON blob)
    avatar_config JSONB DEFAULT '{
        "skin_tone": "#F5D0A9",
        "hair_style": "short",
        "hair_color": "#3B2F2F",
        "eye_color": "#5B3A29",
        "face_shape": "oval",
        "accessories": [],
        "outfit": "casual",
        "outfit_color": "#4A90D9",
        "background": "gradient_blue",
        "expression": "happy"
    }'::jsonb,
    
    -- Verification
    is_verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(20), -- 'video', 'voice_photo', 'government_id'
    verified_at TIMESTAMPTZ,
    
    -- Scores & levels
    care_score INTEGER DEFAULT 0 CHECK (care_score >= 0 AND care_score <= 100),
    reliability_score INTEGER DEFAULT 100 CHECK (reliability_score >= 0 AND reliability_score <= 100),
    total_bond_points INTEGER DEFAULT 0,
    global_rank INTEGER,
    
    -- Status
    status VARCHAR(30) DEFAULT 'active', -- 'active', 'busy', 'away', 'break', 'offline'
    status_message TEXT,
    status_return_date TIMESTAMPTZ,
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Safety
    is_minor BOOLEAN DEFAULT FALSE,
    parent_email VARCHAR(255),
    parent_approved BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    
    -- Preferences
    matching_preferences JSONB DEFAULT '{
        "preferred_roles": [],
        "age_range": {"min": 13, "max": 99},
        "preferred_countries": [],
        "language_priority": "ease",
        "match_gender_preference": "any"
    }'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. USER LANGUAGES
-- ============================================================
CREATE TABLE user_languages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    language_code VARCHAR(10) NOT NULL, -- 'hi', 'en', 'pt', 'ja', etc.
    language_name VARCHAR(50) NOT NULL,
    proficiency VARCHAR(20) NOT NULL DEFAULT 'native', -- 'native', 'fluent', 'intermediate', 'learning'
    is_primary BOOLEAN DEFAULT FALSE,
    
    -- Translation preferences
    show_original BOOLEAN DEFAULT FALSE, -- Show original + translation (for learning)
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, language_code)
);

-- ============================================================
-- 3. VERIFICATION RECORDS
-- ============================================================
CREATE TABLE verification_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    verification_type VARCHAR(20) NOT NULL, -- 'video', 'voice_photo', 'government_id'
    
    -- Video intro challenge
    video_url TEXT,
    video_duration_seconds INTEGER,
    
    -- Voice intro
    voice_url TEXT,
    voice_transcript TEXT,
    
    -- Photo verification
    photo_url TEXT,
    
    -- Liveness check result
    liveness_score DECIMAL(5,2),
    is_real_human BOOLEAN DEFAULT FALSE,
    
    -- Intent bio (voice note: "I want to be a digital mother because...")
    intent_voice_url TEXT,
    intent_transcript TEXT,
    
    -- Review
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reviewed_by UUID REFERENCES profiles(id),
    review_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- ============================================================
-- 4. RELATIONSHIPS (Core bonds between users)
-- ============================================================
CREATE TABLE relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    user_a_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Roles
    user_a_role VARCHAR(30) NOT NULL, -- 'mother', 'father', 'son', 'daughter', 'brother', 'sister', 'mentor', 'student', 'friend', 'grandparent', 'grandchild'
    user_b_role VARCHAR(30) NOT NULL,
    
    -- Relationship status & levels
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'paused', 'ended', 'graduated'
    level INTEGER DEFAULT 1 CHECK (level >= 1 AND level <= 10),
    -- Level 1: Stranger (text only)
    -- Level 2: Acquaintance (emojis + reactions)
    -- Level 3: Bonded (audio calls unlocked)
    -- Level 4: Close (video calls unlocked)
    -- Level 5: Family (join Global Family Room)
    -- Level 6-10: Deep bonds with special features
    
    -- Bond metrics
    bond_points INTEGER DEFAULT 0,
    care_score INTEGER DEFAULT 0,
    messages_exchanged INTEGER DEFAULT 0,
    contests_completed INTEGER DEFAULT 0,
    contests_won INTEGER DEFAULT 0,
    
    -- Time tracking
    total_chat_minutes INTEGER DEFAULT 0,
    total_call_minutes INTEGER DEFAULT 0,
    streak_days INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    
    -- Milestone tracking
    milestones JSONB DEFAULT '[]'::jsonb,
    -- e.g., [{"type": "first_message", "date": "..."}, {"type": "first_call", "date": "..."}]
    
    -- Ending/closure
    ended_by UUID REFERENCES profiles(id),
    end_reason VARCHAR(50),
    farewell_message_a TEXT,
    farewell_message_b TEXT,
    
    matched_at TIMESTAMPTZ DEFAULT NOW(),
    last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT different_users CHECK (user_a_id != user_b_id)
);

-- ============================================================
-- 5. MESSAGES (Chat with translations)
-- ============================================================
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Content
    content_type VARCHAR(20) DEFAULT 'text', -- 'text', 'voice', 'image', 'emoji', 'system'
    original_text TEXT,
    original_language VARCHAR(10),
    
    -- Translation
    translated_text TEXT,
    target_language VARCHAR(10),
    translation_method VARCHAR(20), -- 'auto', 'manual'
    
    -- Nuance detection
    has_idiom BOOLEAN DEFAULT FALSE,
    idiom_explanation TEXT, -- Cultural context explanation
    cultural_note TEXT,
    
    -- Voice messages
    voice_url TEXT,
    voice_duration_seconds INTEGER,
    translated_voice_url TEXT,
    
    -- Image
    image_url TEXT,
    image_caption TEXT,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- AI extracted facts (for contests)
    extracted_facts JSONB DEFAULT '[]'::jsonb,
    -- e.g., [{"fact": "favorite_food", "value": "feijoada", "confidence": 0.95}]
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. CONTESTS (Bonding quizzes)
-- ============================================================
CREATE TABLE contests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    
    contest_type VARCHAR(20) DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly', 'special'
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Scheduling
    scheduled_at TIMESTAMPTZ NOT NULL,
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    time_limit_minutes INTEGER DEFAULT 10,
    
    -- Status
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed', 'expired', 'skipped'
    
    -- Scoring
    max_points INTEGER DEFAULT 50,
    user_a_score INTEGER DEFAULT 0,
    user_b_score INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    is_synchronized BOOLEAN DEFAULT FALSE, -- Both answered same thing
    
    -- Rewards
    bond_points_awarded INTEGER DEFAULT 0,
    reward_type VARCHAR(30), -- 'care_package', 'badge', 'level_up', 'none'
    reward_data JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================
-- 7. CONTEST QUESTIONS
-- ============================================================
CREATE TABLE contest_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'open', -- 'open', 'multiple_choice', 'true_false', 'guess'
    question_about_user UUID REFERENCES profiles(id), -- Which user is the question about
    
    -- For multiple choice
    options JSONB, -- ["Option A", "Option B", "Option C", "Option D"]
    
    -- Answers
    correct_answer TEXT, -- From chat history / AI extraction
    source_message_id UUID REFERENCES messages(id), -- Message that contains the fact
    confidence_score DECIMAL(3,2), -- How confident AI is about the answer
    
    -- User answers
    user_a_answer TEXT,
    user_b_answer TEXT,
    user_a_answered_at TIMESTAMPTZ,
    user_b_answered_at TIMESTAMPTZ,
    
    -- Scoring
    points INTEGER DEFAULT 10,
    user_a_points INTEGER DEFAULT 0,
    user_b_points INTEGER DEFAULT 0,
    
    question_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. CHAT FACTS (AI-extracted from conversations)
-- ============================================================
CREATE TABLE chat_facts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    source_message_id UUID REFERENCES messages(id),
    
    fact_category VARCHAR(50) NOT NULL, -- 'favorite_food', 'childhood_fear', 'hobby', 'dream', 'pet', 'family', etc.
    fact_value TEXT NOT NULL,
    confidence DECIMAL(3,2) DEFAULT 0.80,
    
    -- For contest use
    used_in_contest BOOLEAN DEFAULT FALSE,
    times_used INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. FAMILY ROOMS (Global group chats)
-- ============================================================
CREATE TABLE family_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    room_name VARCHAR(100) NOT NULL,
    description TEXT,
    room_photo_url TEXT,
    
    -- Room settings
    max_members INTEGER DEFAULT 8,
    min_members INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Room type
    room_type VARCHAR(20) DEFAULT 'family', -- 'family', 'cultural_exchange', 'support', 'learning'
    
    -- Cultural potluck settings
    potluck_day VARCHAR(10) DEFAULT 'sunday', -- Day of the week
    potluck_time TIME DEFAULT '20:00',
    potluck_timezone VARCHAR(50) DEFAULT 'UTC',
    current_potluck_theme VARCHAR(100),
    next_host_id UUID REFERENCES profiles(id),
    
    -- Governance
    created_by UUID NOT NULL REFERENCES profiles(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. FAMILY ROOM MEMBERS
-- ============================================================
CREATE TABLE family_room_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES family_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    role_in_room VARCHAR(30) NOT NULL, -- 'mother', 'father', 'son', 'daughter', etc.
    is_moderator BOOLEAN DEFAULT FALSE, -- Parent roles get moderator powers
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'leaving', 'left', 'removed'
    leaving_announced_at TIMESTAMPTZ, -- 7-day farewell period
    
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    
    UNIQUE(room_id, user_id)
);

-- ============================================================
-- 11. FAMILY ROOM MESSAGES
-- ============================================================
CREATE TABLE family_room_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES family_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    content_type VARCHAR(20) DEFAULT 'text',
    original_text TEXT,
    original_language VARCHAR(10),
    
    -- Translations stored per language
    translations JSONB DEFAULT '{}'::jsonb,
    -- e.g., {"en": "Hello", "pt": "Olá", "hi": "नमस्ते"}
    
    -- Cultural notes
    has_idiom BOOLEAN DEFAULT FALSE,
    idiom_explanations JSONB DEFAULT '{}'::jsonb,
    
    -- Media
    image_url TEXT,
    voice_url TEXT,
    
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. CULTURAL POTLUCK EVENTS
-- ============================================================
CREATE TABLE cultural_potlucks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID NOT NULL REFERENCES family_rooms(id) ON DELETE CASCADE,
    host_id UUID NOT NULL REFERENCES profiles(id),
    
    theme VARCHAR(100) NOT NULL,
    -- Themes: 'comfort_food', 'festival_dishes', 'street_food', 'grandma_recipe', 'breakfast_around_world'
    
    -- Content
    dish_name VARCHAR(200),
    dish_photo_url TEXT,
    cultural_significance TEXT,
    recipe TEXT,
    country_of_origin VARCHAR(100),
    
    -- Engagement
    scheduled_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'live', 'completed'
    
    -- Voting for next theme
    next_theme_votes JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. GAMES (Fun & Emotional games)
-- ============================================================
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    game_type VARCHAR(50) NOT NULL,
    -- Types:
    -- 'emotion_charades' - Guess partner's emotion from description
    -- 'culture_trivia' - Questions about partner's country
    -- 'story_chain' - Build a story together, one sentence at a time
    -- 'dream_board' - Share dreams and vote on favorites
    -- 'memory_lane' - Share childhood memories, partner guesses which is true
    -- 'gratitude_jar' - Write things you're grateful about each other
    -- 'world_explorer' - Virtual tour of each other's cities
    -- 'music_swap' - Share songs, guess why they picked it
    -- 'mood_mirror' - Guess your partner's mood today
    -- 'time_capsule' - Write letters to open in 6 months
    
    title VARCHAR(200) NOT NULL,
    description TEXT,
    instructions TEXT,
    min_players INTEGER DEFAULT 2,
    max_players INTEGER DEFAULT 2,
    estimated_minutes INTEGER DEFAULT 10,
    
    -- Rewards
    bond_points_reward INTEGER DEFAULT 5,
    
    -- Categorization
    category VARCHAR(30), -- 'emotional', 'cultural', 'fun', 'creative', 'reflective'
    difficulty VARCHAR(20) DEFAULT 'easy', -- 'easy', 'medium', 'hard'
    
    icon_emoji VARCHAR(10),
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. GAME SESSIONS
-- ============================================================
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id),
    relationship_id UUID REFERENCES relationships(id),
    room_id UUID REFERENCES family_rooms(id),
    
    -- Players
    players JSONB NOT NULL DEFAULT '[]'::jsonb,
    -- e.g., [{"user_id": "...", "score": 10}, ...]
    
    -- Game state
    status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'active', 'completed', 'abandoned'
    current_round INTEGER DEFAULT 0,
    total_rounds INTEGER DEFAULT 5,
    game_data JSONB DEFAULT '{}'::jsonb, -- Game-specific data
    
    -- Results
    winner_id UUID REFERENCES profiles(id),
    bond_points_awarded INTEGER DEFAULT 0,
    
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 15. ACHIEVEMENTS & BADGES
-- ============================================================
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon_emoji VARCHAR(10),
    icon_url TEXT,
    
    -- Unlock criteria
    criteria_type VARCHAR(30) NOT NULL,
    -- 'messages_sent', 'contests_won', 'level_reached', 'streak_days',
    -- 'games_played', 'potlucks_hosted', 'languages_connected', 'family_rooms_joined'
    criteria_value INTEGER NOT NULL,
    
    -- Reward
    bond_points_reward INTEGER DEFAULT 10,
    
    -- Rarity
    rarity VARCHAR(20) DEFAULT 'common', -- 'common', 'uncommon', 'rare', 'epic', 'legendary'
    
    category VARCHAR(30), -- 'social', 'cultural', 'gaming', 'loyalty', 'special'
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. USER ACHIEVEMENTS
-- ============================================================
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES achievements(id),
    
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, achievement_id)
);

-- ============================================================
-- 17. NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    type VARCHAR(50) NOT NULL,
    -- 'new_match', 'new_message', 'contest_ready', 'level_up', 
    -- 'achievement_unlocked', 'potluck_reminder', 'game_invite',
    -- 'partner_status_change', 'relationship_paused', 'family_room_invite'
    
    title VARCHAR(200) NOT NULL,
    body TEXT,
    data JSONB DEFAULT '{}'::jsonb,
    
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 18. REPORTS & SAFETY
-- ============================================================
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES profiles(id),
    reported_user_id UUID NOT NULL REFERENCES profiles(id),
    relationship_id UUID REFERENCES relationships(id),
    
    reason VARCHAR(50) NOT NULL,
    -- 'harassment', 'inappropriate_content', 'fake_profile', 'spam', 
    -- 'underage', 'threatening', 'other'
    
    description TEXT,
    evidence_urls JSONB DEFAULT '[]'::jsonb,
    
    -- Review
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewing', 'resolved', 'dismissed'
    reviewed_by UUID REFERENCES profiles(id),
    action_taken VARCHAR(30), -- 'warning', 'temp_ban', 'permanent_ban', 'dismissed', 'monitoring'
    review_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- ============================================================
-- 19. MODERATION QUEUE
-- ============================================================
CREATE TABLE moderation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    
    queue_type VARCHAR(30) NOT NULL, -- 'report_review', 'verification_review', 'content_review'
    priority VARCHAR(10) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    
    reference_id UUID, -- ID of the report, verification, or content
    reference_type VARCHAR(30), -- 'report', 'verification', 'message'
    
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'in_review', 'completed'
    assigned_to UUID REFERENCES profiles(id),
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ============================================================
-- 20. EXIT SURVEYS
-- ============================================================
CREATE TABLE exit_surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    relationship_id UUID NOT NULL REFERENCES relationships(id),
    
    reason VARCHAR(50) NOT NULL,
    -- 'natural_conclusion', 'not_compatible', 'life_got_busy',
    -- 'felt_uncomfortable', 'graduated', 'other'
    
    additional_feedback TEXT,
    would_recommend BOOLEAN,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 21. MATCHING QUEUE
-- ============================================================
CREATE TABLE matching_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    seeking_role VARCHAR(30) NOT NULL, -- Role they want to find
    offering_role VARCHAR(30) NOT NULL, -- Role they want to be
    
    -- Preferences
    preferred_age_min INTEGER DEFAULT 13,
    preferred_age_max INTEGER DEFAULT 99,
    preferred_countries JSONB DEFAULT '[]'::jsonb,
    preferred_languages JSONB DEFAULT '[]'::jsonb,
    language_priority VARCHAR(10) DEFAULT 'ease', -- 'ease' or 'learning'
    
    -- Queue status
    status VARCHAR(20) DEFAULT 'searching', -- 'searching', 'matched', 'cancelled'
    queue_position INTEGER,
    
    matched_with UUID REFERENCES profiles(id),
    matched_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 22. RELATIONSHIP MILESTONES
-- ============================================================
CREATE TABLE relationship_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    
    milestone_type VARCHAR(50) NOT NULL,
    -- 'first_message', 'first_call', 'first_contest', 'first_win',
    -- '100_messages', '7_day_streak', '30_day_streak', 'level_up',
    -- 'joined_family_room', '6_month_anniversary', '1_year_anniversary'
    
    title VARCHAR(200) NOT NULL,
    description TEXT,
    icon_emoji VARCHAR(10),
    bond_points_awarded INTEGER DEFAULT 5,
    
    achieved_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 23. TIME CAPSULES
-- ============================================================
CREATE TABLE time_capsules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id),
    
    content TEXT NOT NULL,
    content_type VARCHAR(20) DEFAULT 'text', -- 'text', 'voice', 'image'
    media_url TEXT,
    
    -- Sealed until this date
    open_date DATE NOT NULL,
    is_opened BOOLEAN DEFAULT FALSE,
    opened_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 24. GRATITUDE JAR ENTRIES
-- ============================================================
CREATE TABLE gratitude_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    relationship_id UUID NOT NULL REFERENCES relationships(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES profiles(id),
    about_user_id UUID NOT NULL REFERENCES profiles(id),
    
    message TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_country ON profiles(country);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_is_verified ON profiles(is_verified);
CREATE INDEX idx_profiles_care_score ON profiles(care_score DESC);

CREATE INDEX idx_user_languages_user ON user_languages(user_id);
CREATE INDEX idx_user_languages_code ON user_languages(language_code);

CREATE INDEX idx_relationships_users ON relationships(user_a_id, user_b_id);
CREATE INDEX idx_relationships_status ON relationships(status);
CREATE INDEX idx_relationships_level ON relationships(level);

CREATE INDEX idx_messages_relationship ON messages(relationship_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

CREATE INDEX idx_contests_relationship ON contests(relationship_id);
CREATE INDEX idx_contests_status ON contests(status);
CREATE INDEX idx_contests_scheduled ON contests(scheduled_at);

CREATE INDEX idx_chat_facts_user ON chat_facts(user_id);
CREATE INDEX idx_chat_facts_relationship ON chat_facts(relationship_id);

CREATE INDEX idx_family_rooms_active ON family_rooms(is_active);
CREATE INDEX idx_family_room_members_room ON family_room_members(room_id);
CREATE INDEX idx_family_room_members_user ON family_room_members(user_id);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;

CREATE INDEX idx_matching_queue_status ON matching_queue(status);
CREATE INDEX idx_matching_queue_roles ON matching_queue(seeking_role, offering_role);

CREATE INDEX idx_game_sessions_relationship ON game_sessions(relationship_id);
CREATE INDEX idx_game_sessions_status ON game_sessions(status);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_languages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_room_messages ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Users can view profiles they have relationships with
CREATE POLICY "Users can view related profiles" ON profiles FOR SELECT
    USING (
        id IN (
            SELECT user_a_id FROM relationships WHERE user_b_id = auth.uid() AND status = 'active'
            UNION
            SELECT user_b_id FROM relationships WHERE user_a_id = auth.uid() AND status = 'active'
        )
    );

-- Users can manage their own languages
CREATE POLICY "Users manage own languages" ON user_languages FOR ALL USING (auth.uid() = user_id);

-- Users can view messages in their relationships
CREATE POLICY "Users view own messages" ON messages FOR SELECT
    USING (
        relationship_id IN (
            SELECT id FROM relationships WHERE user_a_id = auth.uid() OR user_b_id = auth.uid()
        )
    );

-- Users can send messages in their relationships
CREATE POLICY "Users send messages" ON messages FOR INSERT
    WITH CHECK (sender_id = auth.uid());

-- Users can view their notifications
CREATE POLICY "Users view own notifications" ON notifications FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER relationships_updated_at BEFORE UPDATE ON relationships
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER family_rooms_updated_at BEFORE UPDATE ON family_rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-increment message count on relationships
CREATE OR REPLACE FUNCTION increment_message_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE relationships 
    SET messages_exchanged = messages_exchanged + 1,
        last_interaction_at = NOW()
    WHERE id = NEW.relationship_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER messages_count_trigger AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION increment_message_count();

-- Auto-level-up based on bond points
CREATE OR REPLACE FUNCTION check_level_up()
RETURNS TRIGGER AS $$
DECLARE
    new_level INTEGER;
BEGIN
    -- Level thresholds based on bond points
    new_level := CASE
        WHEN NEW.bond_points >= 1000 THEN 10
        WHEN NEW.bond_points >= 750 THEN 9
        WHEN NEW.bond_points >= 550 THEN 8
        WHEN NEW.bond_points >= 400 THEN 7
        WHEN NEW.bond_points >= 300 THEN 6
        WHEN NEW.bond_points >= 200 THEN 5
        WHEN NEW.bond_points >= 120 THEN 4
        WHEN NEW.bond_points >= 60 THEN 3
        WHEN NEW.bond_points >= 20 THEN 2
        ELSE 1
    END;
    
    IF new_level > OLD.level THEN
        NEW.level = new_level;
        -- Insert milestone
        INSERT INTO relationship_milestones (relationship_id, milestone_type, title, icon_emoji)
        VALUES (NEW.id, 'level_up', 'Reached Level ' || new_level, '⭐');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER relationship_level_up BEFORE UPDATE ON relationships
    FOR EACH ROW WHEN (NEW.bond_points != OLD.bond_points)
    EXECUTE FUNCTION check_level_up();

-- ============================================================
-- SEED DATA: Default Games
-- ============================================================
INSERT INTO games (game_type, title, description, instructions, category, difficulty, icon_emoji, bond_points_reward, estimated_minutes) VALUES
('emotion_charades', '🎭 Emotion Charades', 'Describe an emotion without naming it. Your partner guesses!', 'Take turns describing emotions using only scenarios or metaphors. No naming the emotion directly!', 'emotional', 'easy', '🎭', 10, 10),
('culture_trivia', '🌍 Culture Quest', 'Test your knowledge about your partner''s country and culture!', 'Answer questions about your partner''s country, traditions, food, and customs. Learn while you play!', 'cultural', 'medium', '🌍', 15, 15),
('story_chain', '📖 Story Chain', 'Build an amazing story together, one sentence at a time!', 'Take turns adding one sentence to create a unique story. Be creative and build on each other''s ideas!', 'creative', 'easy', '📖', 8, 15),
('dream_board', '✨ Dream Board', 'Share your dreams and aspirations. Vote on the most inspiring!', 'Each person shares 3 dreams or goals. Discuss them and help each other plan to achieve them.', 'reflective', 'easy', '✨', 12, 20),
('memory_lane', '🎪 Memory Lane', 'Share childhood memories - can your partner guess which are real?', 'Share 3 childhood stories - 2 real, 1 made up. Your partner guesses which is fake!', 'fun', 'medium', '🎪', 10, 15),
('gratitude_jar', '🫙 Gratitude Jar', 'Write what you appreciate about each other!', 'Each person writes 3 things they''re grateful for about their partner. Read them aloud!', 'emotional', 'easy', '🫙', 15, 10),
('world_explorer', '🗺️ World Explorer', 'Take your partner on a virtual tour of your city!', 'Share photos and stories about your favorite places. Explain what makes them special to you.', 'cultural', 'easy', '🗺️', 12, 20),
('music_swap', '🎵 Music Swap', 'Share songs that mean something to you. Partner guesses why!', 'Share 3 songs and let your partner guess why each is meaningful to you.', 'fun', 'easy', '🎵', 8, 15),
('mood_mirror', '🪞 Mood Mirror', 'Can you guess your partner''s mood today?', 'Try to guess how your partner is feeling today based on what you know about them.', 'emotional', 'easy', '🪞', 5, 5),
('time_capsule', '⏰ Time Capsule', 'Write letters to each other to open in 6 months!', 'Write a heartfelt letter to your partner and seal it. It will unlock automatically in 6 months!', 'reflective', 'easy', '⏰', 20, 15),
('two_truths_lie', '🤥 Two Truths & A Lie', 'Share facts about yourself - one is false!', 'Tell your partner 3 things about yourself. Two are true, one is a lie. They guess which!', 'fun', 'easy', '🤥', 8, 10),
('recipe_exchange', '👨‍🍳 Recipe Exchange', 'Teach your partner how to make your favorite dish!', 'Share step-by-step instructions for your favorite recipe. Partner can ask questions!', 'cultural', 'easy', '👨‍🍳', 10, 20),
('compliment_battle', '💝 Compliment Battle', 'Who can give the most creative compliment?', 'Take turns giving each other unique, heartfelt compliments. Vote on the most creative one!', 'emotional', 'easy', '💝', 12, 10),
('would_you_rather', '🤔 Would You Rather', 'Discover how alike (or different) you really are!', 'Answer "Would You Rather" questions and see if your partner predicted your answer!', 'fun', 'easy', '🤔', 8, 10),
('photo_story', '📸 Photo Story', 'Share a photo and tell the story behind it!', 'Each person shares a meaningful photo and explains its story. Ask questions about each other''s photos!', 'reflective', 'easy', '📸', 10, 15);

-- ============================================================
-- SEED DATA: Default Achievements
-- ============================================================
INSERT INTO achievements (name, description, icon_emoji, criteria_type, criteria_value, rarity, category, bond_points_reward) VALUES
('First Hello', 'Send your first message to a partner', '👋', 'messages_sent', 1, 'common', 'social', 5),
('Chatterbox', 'Exchange 100 messages with a partner', '💬', 'messages_sent', 100, 'uncommon', 'social', 15),
('Storyteller', 'Exchange 500 messages with a partner', '📚', 'messages_sent', 500, 'rare', 'social', 30),
('Quiz Beginner', 'Complete your first bonding contest', '🎯', 'contests_won', 1, 'common', 'gaming', 10),
('Quiz Master', 'Win 10 bonding contests', '🏆', 'contests_won', 10, 'rare', 'gaming', 25),
('Mind Reader', 'Win 50 bonding contests', '🧠', 'contests_won', 50, 'epic', 'gaming', 50),
('Loyal Friend', 'Maintain a 7-day conversation streak', '🔥', 'streak_days', 7, 'uncommon', 'loyalty', 15),
('Unbreakable Bond', 'Maintain a 30-day conversation streak', '💎', 'streak_days', 30, 'rare', 'loyalty', 30),
('Eternal Family', 'Maintain a 100-day conversation streak', '👑', 'streak_days', 100, 'legendary', 'loyalty', 100),
('World Citizen', 'Connect with people from 5 different countries', '🌎', 'languages_connected', 5, 'rare', 'cultural', 25),
('Cultural Ambassador', 'Complete a 3-month cultural exchange', '🏅', 'languages_connected', 1, 'epic', 'cultural', 50),
('Game Night Regular', 'Play 20 games with partners', '🎮', 'games_played', 20, 'uncommon', 'gaming', 15),
('Family Builder', 'Join your first Global Family Room', '🏠', 'family_rooms_joined', 1, 'uncommon', 'social', 15),
('Chef Ambassador', 'Host 5 Cultural Potluck events', '👨‍🍳', 'potlucks_hosted', 5, 'rare', 'cultural', 25),
('Rising Star', 'Reach relationship Level 5', '⭐', 'level_reached', 5, 'uncommon', 'social', 20),
('Familia Legend', 'Reach relationship Level 10', '🌟', 'level_reached', 10, 'legendary', 'social', 100);

-- ============================================================
-- REALTIME SUBSCRIPTIONS (Enable for Supabase Realtime)
-- ============================================================
-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE family_room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE relationships;
ALTER PUBLICATION supabase_realtime ADD TABLE matching_queue;
