-- =============================================
-- Product Analysis Usage Tracking
-- =============================================

-- Create table to track monthly usage per user
CREATE TABLE user_product_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year DATE NOT NULL, -- First day of the month (e.g., 2024-01-01)
  uploads_used INTEGER DEFAULT 0,
  prompts_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per user per month
  UNIQUE(user_id, month_year)
);

-- Create indexes for performance
CREATE INDEX idx_user_product_usage_user_id ON user_product_usage(user_id);
CREATE INDEX idx_user_product_usage_month_year ON user_product_usage(month_year);
CREATE INDEX idx_user_product_usage_user_month ON user_product_usage(user_id, month_year);

-- Enable RLS
ALTER TABLE user_product_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own usage" ON user_product_usage
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own usage" ON user_product_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage" ON user_product_usage
  FOR UPDATE USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_product_usage_updated_at 
    BEFORE UPDATE ON user_product_usage 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to get or create current month usage record
CREATE OR REPLACE FUNCTION get_or_create_monthly_usage(user_uuid UUID)
RETURNS user_product_usage AS $$
DECLARE
  current_month DATE;
  usage_record user_product_usage;
BEGIN
  -- Get first day of current month
  current_month := DATE_TRUNC('month', CURRENT_DATE)::DATE;
  
  -- Try to get existing record
  SELECT * INTO usage_record 
  FROM user_product_usage 
  WHERE user_id = user_uuid AND month_year = current_month;
  
  -- If no record exists, create one
  IF NOT FOUND THEN
    INSERT INTO user_product_usage (user_id, month_year, uploads_used, prompts_generated)
    VALUES (user_uuid, current_month, 0, 0)
    RETURNING * INTO usage_record;
  END IF;
  
  RETURN usage_record;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment upload usage
CREATE OR REPLACE FUNCTION increment_upload_usage(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  usage_record user_product_usage;
BEGIN
  -- Get or create current month record
  usage_record := get_or_create_monthly_usage(user_uuid);
  
  -- Increment upload count
  UPDATE user_product_usage 
  SET uploads_used = uploads_used + 1,
      updated_at = NOW()
  WHERE id = usage_record.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment prompt generation usage
CREATE OR REPLACE FUNCTION increment_prompt_generation_usage(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  usage_record user_product_usage;
BEGIN
  -- Get or create current month record
  usage_record := get_or_create_monthly_usage(user_uuid);
  
  -- Increment prompt generation count
  UPDATE user_product_usage 
  SET prompts_generated = prompts_generated + 1,
      updated_at = NOW()
  WHERE id = usage_record.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can upload (respects limits)
CREATE OR REPLACE FUNCTION can_user_upload(user_uuid UUID, user_plan TEXT DEFAULT 'free')
RETURNS BOOLEAN AS $$
DECLARE
  usage_record user_product_usage;
  upload_limit INTEGER;
BEGIN
  -- Set limits based on plan
  IF user_plan = 'pro' THEN
    upload_limit := 20;
  ELSE
    upload_limit := 1;
  END IF;
  
  -- Get current usage
  usage_record := get_or_create_monthly_usage(user_uuid);
  
  -- Check if under limit
  RETURN usage_record.uploads_used < upload_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user can generate prompts (respects limits)
CREATE OR REPLACE FUNCTION can_user_generate_prompt(user_uuid UUID, user_plan TEXT DEFAULT 'free')
RETURNS BOOLEAN AS $$
DECLARE
  usage_record user_product_usage;
  prompt_limit INTEGER;
BEGIN
  -- Set limits based on plan
  IF user_plan = 'pro' THEN
    prompt_limit := 40;
  ELSE
    prompt_limit := 1;
  END IF;
  
  -- Get current usage
  usage_record := get_or_create_monthly_usage(user_uuid);
  
  -- Check if under limit
  RETURN usage_record.prompts_generated < prompt_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 