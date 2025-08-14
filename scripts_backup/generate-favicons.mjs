import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Gradient Background -->
  <rect width="32" height="32" rx="8" fill="url(#gradient)" />
  
  <!-- Letter P -->
  <path d="M11 8h7.5c2.485 0 4.5 2.015 4.5 4.5S20.985 17 18.5 17H13v7h-2V8zm2 2v5h5.5c1.38 0 2.5-1.12 2.5-2.5S19.88 10 18.5 10H13z" fill="white"/>
  
  <!-- Gradient Definition -->
  <defs>
    <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#A855F7" />
      <stop offset="100%" stop-color="#3B82F6" />
    </linearGradient>
  </defs>
</svg>`;

const publicDir = path.join(__dirname, '..', 'public');

async function generateFavicons() {
  try {
    // Generate PNG favicons
    const sizes = [
      { name: 'favicon-16x16.png', size: 16 },
      { name: 'favicon-32x32.png', size: 32 },
      { name: 'apple-touch-icon.png', size: 180 }
    ];

    for (const { name, size } of sizes) {
      const outputPath = path.join(publicDir, name);
      await sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`Generated: ${name}`);
    }

    // Generate favicon.ico (32x32)
    const icoPath = path.join(publicDir, 'favicon.ico');
    await sharp(Buffer.from(svgContent))
      .resize(32, 32)
      .png()
      .toFile(icoPath);
    console.log('Generated: favicon.ico');

    console.log('✅ All favicons generated successfully!');
  } catch (error) {
    console.error('❌ Error generating favicons:', error);
  }
}

generateFavicons(); 