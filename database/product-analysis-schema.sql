-- Product Analysis Feature Schema
-- Run this SQL in your Supabase SQL editor

-- Create user_products table
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

-- Create product_analysis_sessions table
CREATE TABLE product_analysis_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES user_products(id) ON DELETE CASCADE,
  style_template_id TEXT NOT NULL,
  generated_prompt JSONB NOT NULL,
  analysis_cost DECIMAL(10,4) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create style_templates table
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

-- Create indexes for better performance
CREATE INDEX idx_user_products_user_id ON user_products(user_id);
CREATE INDEX idx_user_products_category ON user_products(category);
CREATE INDEX idx_user_products_created_at ON user_products(created_at DESC);

CREATE INDEX idx_product_analysis_sessions_user_id ON product_analysis_sessions(user_id);
CREATE INDEX idx_product_analysis_sessions_product_id ON product_analysis_sessions(product_id);
CREATE INDEX idx_product_analysis_sessions_created_at ON product_analysis_sessions(created_at DESC);

CREATE INDEX idx_style_templates_active ON style_templates(is_active);

-- Enable Row Level Security
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for user_products
CREATE POLICY "Users can view their own products"
  ON user_products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products"
  ON user_products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON user_products FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON user_products FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for product_analysis_sessions
CREATE POLICY "Users can view their own analysis sessions"
  ON product_analysis_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis sessions"
  ON product_analysis_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policies for style_templates (read-only for users)
CREATE POLICY "Active style templates are viewable by everyone"
  ON style_templates FOR SELECT
  USING (is_active = true);

-- Create updated_at trigger for user_products
CREATE OR REPLACE FUNCTION update_user_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_products_updated_at
  BEFORE UPDATE ON user_products
  FOR EACH ROW EXECUTE FUNCTION update_user_products_updated_at();

-- Insert default style templates
INSERT INTO style_templates (id, name, description, template_data) VALUES
('cosmic-reveal', 'Cosmic Reveal', 'Product emerges from cosmic space with swirling galaxies', '{"environment": "cosmic space with swirling galaxies", "camera": "360-degree orbit shot", "lighting": "ethereal cosmic lighting", "motion": "smooth orbital movement", "effects": ["particle systems", "light trails"]}'),
('minimalist-japanese', 'Minimalist Japanese', 'Clean, zen-like reveal in traditional Japanese setting', '{"environment": "minimalist Japanese room with shoji screens", "camera": "slow zoom with gentle rotation", "lighting": "soft natural lighting", "motion": "graceful unfolding", "effects": ["paper textures", "bamboo shadows"]}'),
('urban-warehouse', 'Urban Warehouse', 'Gritty industrial reveal with urban energy', '{"environment": "urban warehouse with graffiti", "camera": "low-angle tracking shot", "lighting": "dramatic industrial lighting", "motion": "dynamic assembly", "effects": ["concrete textures", "metal reflections"]}'),
('floating-void', 'Floating Void', 'Product suspended in infinite dark space', '{"environment": "infinite dark void", "camera": "smooth circular motion", "lighting": "dramatic spotlighting", "motion": "weightless floating", "effects": ["volumetric lighting", "subtle reflections"]}'),
('nature-organic', 'Nature Organic', 'Organic emergence from natural elements', '{"environment": "lush forest clearing", "camera": "organic flowing movement", "lighting": "dappled natural light", "motion": "growing from nature", "effects": ["organic textures", "leaf particles"]}');

-- Add comments for documentation
COMMENT ON TABLE user_products IS 'User-uploaded product images with metadata and AI analysis';
COMMENT ON TABLE product_analysis_sessions IS 'Sessions tracking AI analysis and prompt generation';
COMMENT ON TABLE style_templates IS 'Predefined style templates for product reveal videos';

COMMENT ON COLUMN user_products.image_metadata IS 'Metadata about the uploaded image (dimensions, file size, etc.)';
COMMENT ON COLUMN user_products.analysis_data IS 'AI analysis results for the product image';
COMMENT ON COLUMN product_analysis_sessions.generated_prompt IS 'The AI-generated prompt for video creation';
COMMENT ON COLUMN product_analysis_sessions.analysis_cost IS 'Cost of AI analysis in USD'; 