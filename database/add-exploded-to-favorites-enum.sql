-- Add 'exploded' value to prompt_type_enum if missing and update favorites validation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'prompt_type_enum') THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = 'prompt_type_enum' AND e.enumlabel = 'exploded'
    ) THEN
      ALTER TYPE prompt_type_enum ADD VALUE 'exploded';
    END IF;
  ELSE
    CREATE TYPE prompt_type_enum AS ENUM ('regular', 'timeline', 'exploded');
  END IF;
END $$;

-- Recreate validation trigger function to include 'exploded'
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
  ELSIF NEW.prompt_type = 'exploded' THEN
    IF NOT EXISTS (SELECT 1 FROM exploded_build_prompts WHERE id = NEW.prompt_id) THEN
      RAISE EXCEPTION 'Referenced prompt does not exist in exploded_build_prompts table';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS validate_favorite_reference_trigger ON favorites;
CREATE TRIGGER validate_favorite_reference_trigger
  BEFORE INSERT OR UPDATE ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION validate_favorite_reference();

-- Enable PostgREST Foreign Key Caching
NOTIFY pgrst, 'reload schema'; 