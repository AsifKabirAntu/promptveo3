# PromptVeo3 Data Ingestion Guide

This guide will help you import your real prompt data into PromptVeo3, replacing the dummy data with your actual prompt library.

## 🚀 Quick Start

1. **Set up your environment variables** (see below)
2. **Prepare your data in JSON format** (see format section)
3. **Run the ingestion script**

## 📋 Prerequisites

### Environment Variables

You need these environment variables in your `.env.local` file:

```bash
# Your Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url

# Your Supabase anon key (for the app)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Your Supabase service role key (for data ingestion - KEEP SECRET!)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

⚠️ **Important**: The `SUPABASE_SERVICE_ROLE_KEY` is different from your anon key and should be kept secret. You can find it in your Supabase project settings under "API" → "Project API keys" → "service_role".

### Database Setup

Make sure you've already run the database schema and seed scripts:

1. **Create the database schema:**
   - Go to your Supabase project → SQL Editor
   - Run the contents of `database/schema.sql`

2. **Optionally run seed data** (you can skip this if you're importing your own data):
   - Run the contents of `database/seed-data.sql`

## 📝 Data Format

Your prompt data should be in JSON format with the following structure:

### Required Fields

```json
{
  "title": "Your Prompt Title",
  "description": "Detailed description of the scene...",
  "style": "Cinematic|Documentary|Artistic|Commercial|Experimental|Vintage|Modern|Dramatic",
  "camera": "Camera movement and angle description",
  "lighting": "Lighting setup and mood",
  "environment": "Setting and location description",
  "elements": ["array", "of", "visual", "elements"],
  "motion": "Camera motion and movement description",
  "ending": "How the scene concludes",
  "keywords": ["searchable", "keywords", "array"],
  "category": "Cinematic|Nature|Urban|Abstract|Portrait|Action|Fantasy|Sci-Fi"
}
```

### Optional Fields

```json
{
  "text": "none",           // Default: "none"
  "is_featured": false,  // Default: false
  "is_public": true      // Default: true
}
```

### Example Data File

See `data/example-prompts.json` for a complete example with 3 sample prompts.

## 🛠️ Ingestion Commands

### View Available Commands

```bash
npm run ingest
```

### Import from JSON File

```bash
npm run ingest json path/to/your/prompts.json
```

Example:
```bash
npm run ingest json data/my-prompts.json
```

### Clear All Existing Prompts (⚠️ DANGEROUS)

```bash
npm run ingest clear
```

**Warning**: This will delete ALL prompts from your database. Use with caution!

## 📊 Step-by-Step Ingestion Process

### Step 1: Prepare Your Data

1. **Convert your data to JSON format** following the schema above
2. **Validate your JSON** using a JSON validator
3. **Save the file** in your project directory (e.g., `data/my-prompts.json`)

### Step 2: Test with Small Batch

Start with a small batch (5-10 prompts) to test the ingestion:

```bash
npm run ingest json data/test-prompts.json
```

### Step 3: Import Full Dataset

Once you've verified the format works:

```bash
npm run ingest json data/all-prompts.json
```

### Step 4: Verify in App

1. Start your development server: `npm run dev`
2. Visit `http://localhost:3000`
3. Check that your prompts appear in the dashboard
4. Test searching and filtering functionality

## 🔧 Troubleshooting

### Common Issues

1. **Environment variables not set**
   ```
   ❌ Missing environment variables. Please set:
      - NEXT_PUBLIC_SUPABASE_URL
      - SUPABASE_SERVICE_ROLE_KEY
   ```
   **Solution**: Add the missing variables to your `.env.local` file

2. **JSON parsing errors**
   ```
   ❌ Error reading or parsing file: SyntaxError: Unexpected token
   ```
   **Solution**: Validate your JSON file format

3. **Database connection errors**
   ```
   ❌ Error inserting batch: connection failed
   ```
   **Solution**: Check your Supabase URL and service role key

4. **Schema validation errors**
   ```
   ❌ Error inserting batch: column "xyz" does not exist
   ```
   **Solution**: Ensure your JSON fields match the database schema

### Field Validation

- **Required fields**: All fields marked as required must be present
- **Array fields**: `elements` and `keywords` must be arrays of strings
- **Boolean fields**: `is_featured` and `is_public` should be true/false
- **Text length**: Keep descriptions reasonable (< 1000 characters)

## 🔄 Updating Existing Data

To update your prompts:

1. **Clear existing data**: `npm run ingest clear`
2. **Import updated data**: `npm run ingest json data/updated-prompts.json`

Or modify individual prompts through the Supabase dashboard.

## 🧹 Data Management

### Best Practices

1. **Backup your data** before making changes
2. **Test with small batches** first
3. **Use meaningful categories and keywords** for better searchability
4. **Mark your best prompts as featured** (`is_featured: true`)
5. **Keep descriptions concise but descriptive**

### Categories Available

- Cinematic
- Nature  
- Urban
- Abstract
- Portrait
- Action
- Fantasy
- Sci-Fi

### Styles Available

- Cinematic
- Documentary
- Artistic
- Commercial
- Experimental
- Vintage
- Modern
- Dramatic

## 📈 After Ingestion

Once your data is imported:

1. **Featured prompts** will appear on your landing page
2. **All public prompts** will be searchable in the dashboard  
3. **Categories and keywords** will power the filter system
4. **Prompt of the day** will be randomly selected from featured prompts

## 🆘 Need Help?

1. Check the console output for detailed error messages
2. Verify your data format against the example file
3. Test your Supabase connection in the Supabase dashboard
4. Start with the example data file to ensure everything works

---

**Ready to import your data?** Start with the example file to test your setup:

```bash
npm run ingest json data/example-prompts.json
``` 