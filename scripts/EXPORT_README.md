# Export Prompts to PDF

This script exports all your PromptVeo3 prompts to a beautifully formatted document.

## Usage

```bash
npm run export-prompts
```

## What it does

1. **Fetches all prompts** from your Supabase database
2. **Organizes by category** - Groups prompts into their respective categories
3. **Generates a Markdown file** - Creates a well-structured document with:
   - Table of Contents
   - Category sections
   - Prompt details (title, description, style, tags, full prompt text)
   - Statistics and counts

## Output

The script creates a file in the `exports/` folder:
- **Filename**: `promptveo3-library-YYYY-MM-DD.md`
- **Location**: `exports/promptveo3-library-YYYY-MM-DD.md`

## Converting to PDF

After generating the Markdown file, you have several options to convert it to PDF:

### Option 1: Pandoc (Recommended - Best for handling long prompts)

Install Pandoc:
```bash
# macOS
brew install pandoc
brew install basictex  # Required for PDF generation

# Ubuntu/Debian
sudo apt-get install pandoc texlive-xetex

# Windows
choco install pandoc
choco install miktex
```

Convert to PDF with proper text wrapping:
```bash
cd exports

# Best command for long text (wraps properly, no cutoff)
pandoc promptveo3-library-2025-11-07.md -o promptveo3-library.pdf \
  --pdf-engine=xelatex \
  --variable geometry:margin=0.75in \
  --variable fontsize=9pt \
  --variable linestretch=1.2 \
  --wrap=auto

# Alternative: If you want smaller file size
pandoc promptveo3-library-2025-11-07.md -o promptveo3-library.pdf \
  --pdf-engine=pdflatex \
  --variable geometry:margin=0.75in \
  --listings
```

### Option 2: VS Code Extension

1. Install the "Markdown PDF" extension in VS Code
2. Open the generated `.md` file
3. Right-click and select "Markdown PDF: Export (pdf)"

### Option 3: Online Converter

Upload the markdown file to any of these services:
- https://www.markdowntopdf.com/
- https://md2pdf.netlify.app/
- https://dillinger.io/ (export as PDF)

### Option 4: Markdown to PDF CLI

```bash
npm install -g md-to-pdf
md-to-pdf exports/promptveo3-library-2024-11-07.md
```

## Output Format

The generated document includes:

### Header Section
- Total prompt count
- Number of categories
- Generation date

### Table of Contents
- Links to each category
- Prompt count per category

### Category Sections
Each category contains:
- Category name
- Prompt count
- Individual prompts with:
  - Title
  - Description
  - Style
  - Tags
  - Full Veo3 prompt text (in code blocks)

## Example Output Structure

```
# PromptVeo3 - Complete Prompt Library

**Total Prompts:** 1000
**Categories:** 15
**Generated:** November 7, 2024

---

## Table of Contents

1. [Cinematic](#cinematic) (150 prompts)
2. [Product Showcase](#product-showcase) (120 prompts)
...

---

## Cinematic

**150 prompts in this category**

### 1. Epic Mountain Sunrise

**Description:** A breathtaking sunrise over mountain peaks

**Style:** Cinematic

**Tags:** nature, landscape, sunrise, mountains

**Veo3 Prompt:**

```
[Detailed prompt text here...]
```

---
```

## Notes

- The script requires your Supabase credentials (from `.env.local`)
- All prompts are exported, including community prompts
- The markdown file is human-readable and can be edited before converting to PDF
- The `exports/` folder is git-ignored, so your exports won't be committed

## Troubleshooting

**Error: Cannot find Supabase credentials**
- Make sure your `.env.local` file has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

**No prompts found**
- Check your database connection
- Verify prompts exist in the `veo3_prompts` table

**PDF conversion issues**
- Try a different conversion method
- Check that the markdown file is valid
- Ensure you have the necessary PDF engine installed (for Pandoc)

