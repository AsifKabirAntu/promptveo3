-- =============================================
-- Product Analysis Feature - Complete Setup
-- =============================================

-- 1. Create Tables (in dependency order)
-- =============================================

-- Create user_products table first (no dependencies)
CREATE TABLE user_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_metadata JSONB DEFAULT '{}',
  analysis_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create style_templates table (no dependencies)
CREATE TABLE style_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  preview_video_url TEXT,
  preview_image_url TEXT,
  template_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_analysis_sessions table (depends on user_products)
CREATE TABLE product_analysis_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES user_products(id) ON DELETE CASCADE,
  style_template_id TEXT REFERENCES style_templates(id),
  generated_prompt JSONB NOT NULL,
  analysis_cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Indexes for Performance
-- =============================================

-- User products indexes
CREATE INDEX idx_user_products_user_id ON user_products(user_id);
CREATE INDEX idx_user_products_category ON user_products(category);
CREATE INDEX idx_user_products_created_at ON user_products(created_at DESC);

-- Analysis sessions indexes
CREATE INDEX idx_product_analysis_sessions_user_id ON product_analysis_sessions(user_id);
CREATE INDEX idx_product_analysis_sessions_product_id ON product_analysis_sessions(product_id);
CREATE INDEX idx_product_analysis_sessions_created_at ON product_analysis_sessions(created_at DESC);

-- Style templates indexes
CREATE INDEX idx_style_templates_active ON style_templates(is_active);

-- 3. Enable Row Level Security (RLS)
-- =============================================

ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_templates ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
-- =============================================

-- User Products Policies
CREATE POLICY "Users can view their own products" ON user_products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products" ON user_products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products" ON user_products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products" ON user_products
  FOR DELETE USING (auth.uid() = user_id);

-- Product Analysis Sessions Policies
CREATE POLICY "Users can view their own analysis sessions" ON product_analysis_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis sessions" ON product_analysis_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analysis sessions" ON product_analysis_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analysis sessions" ON product_analysis_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Style Templates Policies (read-only for all authenticated users)
CREATE POLICY "All authenticated users can view active style templates" ON style_templates
  FOR SELECT USING (auth.role() = 'authenticated' AND is_active = TRUE);

-- 5. Create Update Trigger for user_products
-- =============================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_products_updated_at 
    BEFORE UPDATE ON user_products 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 6. Insert Default Style Templates
-- =============================================

INSERT INTO style_templates (id, name, description, template_data) VALUES
('cinematic-epic', 'Cinematic Epic', 'Dramatic cinematic reveal with epic scale', '{"environment": "dramatic landscape", "camera": "sweeping cinematic movement", "lighting": "golden hour dramatic", "motion": "epic reveal", "effects": ["lens flares", "depth of field"]}'),

('minimalist-clean', 'Minimalist Clean', 'Clean, minimal aesthetic with smooth transitions', '{"environment": "white studio space", "camera": "smooth orbital movement", "lighting": "soft even lighting", "motion": "gentle rotation", "effects": ["clean transitions", "subtle shadows"]}'),

('futuristic-tech', 'Futuristic Tech', 'High-tech futuristic presentation', '{"environment": "digital tech space", "camera": "dynamic tech movement", "lighting": "neon accent lighting", "motion": "digital materialization", "effects": ["holographic elements", "tech particles"]}'),

('lifestyle-warm', 'Lifestyle Warm', 'Warm, inviting lifestyle presentation', '{"environment": "cozy living space", "camera": "handheld natural movement", "lighting": "warm natural light", "motion": "organic interaction", "effects": ["natural bokeh", "warm tones"]}'),

('luxury-premium', 'Luxury Premium', 'Premium luxury brand presentation', '{"environment": "elegant luxury setting", "camera": "sophisticated movement", "lighting": "premium studio lighting", "motion": "refined reveal", "effects": ["premium materials", "elegant reflections"]}'),

('nature-organic', 'Nature Organic', 'Organic emergence from natural elements', '{"environment": "lush forest clearing", "camera": "organic flowing movement", "lighting": "dappled natural light", "motion": "growing from nature", "effects": ["organic textures", "leaf particles"]}');

-- 7. Grant necessary permissions
-- =============================================

-- Grant usage on sequences if any were created
-- (gen_random_uuid() doesn't create sequences, but keeping for completeness)

-- =============================================
-- Setup Complete!
-- =============================================

-- To verify the setup worked, run this query:
-- SELECT 
--   t.table_name,
--   COUNT(c.column_name) as column_count
-- FROM information_schema.tables t
-- LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
-- WHERE t.table_schema = 'public' 
--   AND t.table_name IN ('user_products', 'product_analysis_sessions', 'style_templates')
-- GROUP BY t.table_name
-- ORDER BY t.table_name; 