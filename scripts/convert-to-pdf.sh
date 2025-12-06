#!/bin/bash

# Script to convert the exported markdown to PDF
# Usage: ./scripts/convert-to-pdf.sh

cd exports

# Find the most recent markdown file
MARKDOWN_FILE=$(ls -t promptveo3-library-*.md | head -1)

if [ -z "$MARKDOWN_FILE" ]; then
    echo "❌ No markdown file found in exports/ directory"
    echo "Run 'npm run export-prompts' first"
    exit 1
fi

echo "📄 Found: $MARKDOWN_FILE"
echo "🔄 Converting to PDF..."

# Check if pandoc is installed
if ! command -v pandoc &> /dev/null; then
    echo "❌ Pandoc is not installed"
    echo ""
    echo "Install it with:"
    echo "  macOS:   brew install pandoc && brew install basictex"
    echo "  Ubuntu:  sudo apt-get install pandoc texlive-xetex"
    echo "  Windows: choco install pandoc && choco install miktex"
    exit 1
fi

# Convert to PDF with proper text wrapping
PDF_FILE="${MARKDOWN_FILE%.md}.pdf"

pandoc "$MARKDOWN_FILE" -o "$PDF_FILE" \
  --pdf-engine=xelatex \
  --variable geometry:margin=0.75in \
  --variable fontsize=9pt \
  --variable linestretch=1.2 \
  --wrap=auto \
  --toc \
  --toc-depth=2

if [ $? -eq 0 ]; then
    echo "✅ PDF created successfully: exports/$PDF_FILE"
    echo ""
    echo "📊 File info:"
    ls -lh "$PDF_FILE"
else
    echo "❌ PDF conversion failed"
    echo ""
    echo "Try the alternative method:"
    echo "  pandoc $MARKDOWN_FILE -o $PDF_FILE --pdf-engine=pdflatex --listings"
    exit 1
fi

