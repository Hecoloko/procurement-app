-- Create sequences table for tracking user-specific sequence numbers
CREATE TABLE IF NOT EXISTS sequences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_sequence INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sequences_user_id ON sequences(user_id);

-- Enable RLS
ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own sequence
CREATE POLICY "Users can read own sequence" ON sequences
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can update their own sequence
CREATE POLICY "Users can update own sequence" ON sequences
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Policy: Users can insert their own sequence
CREATE POLICY "Users can insert own sequence" ON sequences
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sequences_updated_at BEFORE UPDATE ON sequences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: This migration creates the sequences table but does NOT backfill existing data
-- New carts created after this migration will use the new ID format
