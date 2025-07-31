-- Create favorites table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prompt_type_enum') THEN
    CREATE TYPE prompt_type_enum AS ENUM ('regular', 'timeline');
  END IF;
END $$;

-- Drop existing table if it exists
DROP TABLE IF EXISTS favorites CASCADE;

CREATE TABLE favorites (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt_id uuid NOT NULL,
  prompt_type prompt_type_enum NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, prompt_id, prompt_type)
);

-- Create validation trigger function
CREATE OR REPLACE FUNCTION validate_favorite_reference()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.prompt_type = 'regular' THEN
    IF NOT EXISTS (SELECT 1 FROM prompts WHERE id = NEW.prompt_id) THEN
      RAISE EXCEPTION 'Referenced prompt does not exist in prompts table';
    END IF;
  ELSIF NEW.prompt_type = 'timeline' THEN
    IF NOT EXISTS (SELECT 1 FROM timeline_prompts WHERE id = NEW.prompt_id) THEN
      RAISE EXCEPTION 'Referenced prompt does not exist in timeline_prompts table';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS validate_favorite_reference_trigger ON favorites;
CREATE TRIGGER validate_favorite_reference_trigger
  BEFORE INSERT OR UPDATE ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION validate_favorite_reference();

-- Enable RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own favorites" ON favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" ON favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_prompt_id ON favorites(prompt_id);
CREATE INDEX idx_favorites_user_prompt ON favorites(user_id, prompt_id, prompt_type);

-- Enable PostgREST Foreign Key Caching
NOTIFY pgrst, 'reload schema'; 