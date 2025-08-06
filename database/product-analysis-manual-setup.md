# Product Analysis Manual Database Setup

Since the automated setup script requires special database permissions, please run the SQL commands manually in your Supabase SQL Editor.

## Steps:

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run each SQL block below in order**

---

## 1. Create Tables

```sql
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
```

```sql
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
```

```sql
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
```

---

## 2. Create Indexes

```sql
-- Create indexes for better performance
CREATE INDEX idx_user_products_user_id ON user_products(user_id);
CREATE INDEX idx_user_products_category ON user_products(category);
CREATE INDEX idx_user_products_created_at ON user_products(created_at DESC);

CREATE INDEX idx_product_analysis_sessions_user_id ON product_analysis_sessions(user_id);
CREATE INDEX idx_product_analysis_sessions_product_id ON product_analysis_sessions(product_id);
CREATE INDEX idx_product_analysis_sessions_created_at ON product_analysis_sessions(created_at DESC);

CREATE INDEX idx_style_templates_active ON style_templates(is_active);
```

---

## 3. Enable Row Level Security

```sql
-- Enable Row Level Security
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE style_templates ENABLE ROW LEVEL SECURITY;
```

---

## 4. Create RLS Policies

```sql
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
```

```sql
-- Create policies for product_analysis_sessions
CREATE POLICY "Users can view their own analysis sessions"
  ON product_analysis_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analysis sessions"
  ON product_analysis_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

```sql
-- Create policies for style_templates (read-only for users)
CREATE POLICY "Active style templates are viewable by everyone"
  ON style_templates FOR SELECT
  USING (is_active = true);
```

---

## 5. Create Triggers

```sql
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
```

---

## 6. Insert Default Style Templates

```sql
-- Insert default style templates
INSERT INTO style_templates (id, name, description, template_data) VALUES
('cosmic-reveal', 'Cosmic Reveal', 'Product emerges from cosmic space with swirling galaxies', '{"environment": "cosmic space with swirling galaxies", "camera": "360-degree orbit shot", "lighting": "ethereal cosmic lighting", "motion": "smooth orbital movement", "effects": ["particle systems", "light trails"]}'),
('minimalist-japanese', 'Minimalist Japanese', 'Clean, zen-like reveal in traditional Japanese setting', '{"environment": "minimalist Japanese room with shoji screens", "camera": "slow zoom with gentle rotation", "lighting": "soft natural lighting", "motion": "graceful unfolding", "effects": ["paper textures", "bamboo shadows"]}'),
('urban-warehouse', 'Urban Warehouse', 'Gritty industrial reveal with urban energy', '{"environment": "urban warehouse with graffiti", "camera": "low-angle tracking shot", "lighting": "dramatic industrial lighting", "motion": "dynamic assembly", "effects": ["concrete textures", "metal reflections"]}'),
('floating-void', 'Floating Void', 'Product suspended in infinite dark space', '{"environment": "infinite dark void", "camera": "smooth circular motion", "lighting": "dramatic spotlighting", "motion": "weightless floating", "effects": ["volumetric lighting", "subtle reflections"]}'),
('nature-organic', 'Nature Organic', 'Organic emergence from natural elements', '{"environment": "lush forest clearing", "camera": "organic flowing movement", "lighting": "dappled natural light", "motion": "growing from nature", "effects": ["organic textures", "leaf particles"]}');
```

---

## 7. Create Storage Bucket

Go to **Storage** section in Supabase Dashboard and:

1. Click **"New Bucket"**
2. Set bucket name: `product-images`
3. Make it **Public**
4. Set file size limit: **10MB**
5. Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

---

## 8. Add Environment Variable

Add this to your `.env.local` file:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

---

## Verification

After completing all steps, you should be able to:

1. Visit `/dashboard/products` 
2. Upload product images
3. See them in your product library
4. Test AI analysis (with OpenRouter API key)

The storage bucket was already created successfully, so you just need to run the SQL commands above! 