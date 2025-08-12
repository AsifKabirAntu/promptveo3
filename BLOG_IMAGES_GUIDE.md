# Blog Images Guide

This guide explains how to add images to your blog posts, including featured images, inline content images, and optimizing them for your blog system.

## 📁 Image Directory Structure

I've created the following directories for your blog images:

```
public/
├── blog/                    # Blog featured images and content images
│   ├── featured/           # Featured images for blog posts
│   ├── content/           # Images used within blog content
│   └── thumbnails/        # Smaller thumbnail versions (optional)
└── avatars/               # Author profile pictures (if you decide to add authors back)
```

## 🖼️ Adding Featured Images

### 1. Current Blog Posts Need These Images:

Your current blog posts reference these featured images:

- `public/blog/veo3-architecture-hero.jpg`
- `public/blog/veo3-character-consistency-hero.jpg`  
- `public/blog/veo3-meta-prompts-hero.jpg`

### 2. Image Specifications:

**Featured Images (Hero Images):**
- **Dimensions**: 1200x630px (ideal for social sharing)
- **Aspect Ratio**: 16:9 or 1.91:1
- **File Size**: Keep under 300KB for fast loading
- **Format**: WebP (preferred), JPG for best compression

**Content Images:**
- **Max Width**: 800px (will be responsive)
- **File Size**: Keep under 300KB each
- **Format**: JPG, PNG, or WebP

## 🎨 How to Add Images

### Method 1: Featured Images (Already Set Up)

Your blog posts already have featured images configured in the data:

```typescript
// In src/data/blog-posts.ts
featured_image: "/blog/veo3-meta-prompts-hero.webp"
```

Just add the image file to `public/blog/` and it will automatically appear.

### Method 2: Images in Blog Content

Add images directly in your markdown content:

```markdown
![Alt text description](/blog/content/example-image.jpg)

<!-- Or with title for tooltip -->
![Alt text](/blog/content/example-image.jpg "Image title")

<!-- For responsive images -->
<img src="/blog/content/example-image.jpg" alt="Description" className="w-full h-auto rounded-lg shadow-md my-6" />
```

### Method 3: Image with Caption

```markdown
<figure className="my-8">
  <img src="/blog/content/veo3-example.jpg" alt="Veo 3 example output" className="w-full h-auto rounded-lg shadow-lg" />
  <figcaption className="text-center text-sm text-gray-600 mt-2 italic">
    Example of professional Veo 3 output using structured prompts
  </figcaption>
</figure>
```

## 📝 Updating Your Current Blog Posts

### Example: Adding Images to "Meta Prompts" Article

```markdown
# Meta Prompts for Veo 3: The Future of AI Video Creation

![Meta Prompts Workflow](/blog/content/meta-prompts-workflow.jpg "Visual representation of the meta prompt process")

If you've ever wrestled with Veo 3 and thought, _"there must be a faster, more reliable way,"_ you're right...

## The Professional 7‑Component Veo 3 Format

<img src="/blog/content/veo3-components-diagram.jpg" alt="7-component Veo 3 format diagram" className="w-full max-w-2xl mx-auto h-auto rounded-lg shadow-md my-6" />

Every output from a good meta prompt includes these components...
```

## 🛠️ Image Optimization Tips

### 1. Compress Images Before Adding

Use tools like:
- **TinyPNG**: https://tinypng.com/
- **ImageOptim** (Mac): Free app for compression
- **Squoosh**: https://squoosh.app/ (Google's web-based tool)

### 2. Use WebP Format When Possible

```bash
# Convert JPG to WebP (if you have imagemagick installed)
convert input.jpg -quality 80 output.webp
```

### 3. Create Multiple Sizes (Optional)

```
public/blog/
├── veo3-hero.jpg           # Full size (1200x630)
├── veo3-hero-medium.jpg    # Medium (800x420)
└── veo3-hero-small.jpg     # Small (400x210)
```

## 🎯 Quick Start: Adding Your First Images

### Step 1: Get/Create Images

For your Veo 3 blog posts, you might want:

1. **Architecture diagram** showing the 6-layer framework
2. **Before/after examples** of prompt results
3. **Character consistency examples** 
4. **Meta prompt workflow diagram**

### Step 2: Add Featured Images

1. Save your hero images as:
   - `public/blog/veo3-architecture-hero.jpg`
   - `public/blog/veo3-character-consistency-hero.jpg`
   - `public/blog/veo3-meta-prompts-hero.jpg`

2. The images will automatically appear on your blog listing and individual post pages.

### Step 3: Add Content Images

1. Save content images to `public/blog/content/`
2. Reference them in your markdown:

```markdown
![Veo 3 Prompt Structure](/blog/content/prompt-structure-diagram.jpg)
```

### Step 4: Update Image Alt Text

Make sure all images have descriptive alt text for accessibility:

```markdown
![Detailed diagram showing the 6-layer cognitive framework for meta prompts, including Identity, Knowledge, Analysis, Generation, Quality, and Output layers](/blog/content/framework-diagram.jpg)
```

## 🎨 Styling Images in Blog Content

The ReactMarkdown component will automatically style your images, but you can also use custom styling:

```markdown
<!-- Centered image with shadow -->
<div className="text-center my-8">
  <img src="/blog/content/example.jpg" alt="Description" className="inline-block max-w-full h-auto rounded-lg shadow-xl" />
</div>

<!-- Two-column image layout -->
<div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
  <img src="/blog/content/before.jpg" alt="Before" className="w-full h-auto rounded-lg" />
  <img src="/blog/content/after.jpg" alt="After" className="w-full h-auto rounded-lg" />
</div>
```

## 📱 Responsive Image Best Practices

Your blog images are automatically responsive, but here are some tips:

1. **Use appropriate sizes**: Don't use 4K images for small content
2. **Consider mobile users**: Test how images look on phones
3. **Optimize loading**: Larger images should be compressed more
4. **Alt text**: Always include descriptive alt text

## 🔄 Adding Images to Existing Posts

To add images to your current blog posts, edit the content in `src/data/blog-posts.ts`:

```typescript
content: `# Your Blog Title

![Featured diagram](/blog/content/your-image.jpg)

Your content here...

## Section with Image

Here's how the process works:

![Process diagram](/blog/content/process-diagram.jpg "Step-by-step process visualization")

More content...`
```

---

## 🚀 Ready to Add Images?

1. **Create your images** (or find stock photos)
2. **Optimize them** for web (compress, resize)
3. **Save to** `public/blog/` directory
4. **Reference them** in your markdown content
5. **Test** to make sure they display properly

Your blog will look much more professional and engaging with proper images! 