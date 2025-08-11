// Video Enhancement Utilities for Product Analysis
import { ENHANCED_VIDEO_STYLES } from '@/features/product-analysis/types';

/**
 * Build enhanced prompt for AI generation
 */
export function buildEnhancedPrompt(
  product: any,
  videoStyle: string,
  sceneCount: number,
  customRequirements?: string,
  characterOptions?: any
): string {
  const styleData = ENHANCED_VIDEO_STYLES[videoStyle];
  
  return `Generate a ${sceneCount}-scene ${videoStyle} video prompt for the product "${product.name}".

Product Details:
- Name: ${product.name}
- Description: ${product.description || 'No description provided'}
- Category: ${product.category || 'General product'}

Video Style: ${videoStyle}
Style Preferences:
- Lighting: ${styleData?.preferences.lighting.join(', ') || 'natural'}
- Camera: ${styleData?.preferences.camera.join(', ') || 'medium-shot'}
- Movement: ${styleData?.preferences.movement.join(', ') || 'smooth'}
- Color Grading: ${styleData?.preferences.colorGrading.join(', ') || 'natural'}

${customRequirements ? `Custom Requirements: ${customRequirements}` : ''}

${characterOptions ? `
Character Details:
- Voice: ${characterOptions.voiceCharacteristics}
- Personality: ${characterOptions.personality}
- Camera Relationship: ${characterOptions.cameraRelationship}
- Lighting Interaction: ${characterOptions.lightingInteraction}
` : ''}

Generate a JSON response with the following structure:
{
  "title": "Video title",
  "description": "Video description", 
  "category": "product_demo",
  "base_style": "${videoStyle}",
  "aspect_ratio": "16:9",
  "scene_description": "Overall scene description",
  "camera_setup": "medium-shot",
  "lighting": "natural-bright",
  "negative_prompts": ["blurry", "low quality"],
  "timeline": [
    {
      "sequence": 1,
      "timestamp": "00:00.00-00:08.00",
      "action": "Scene action description",
      "dialogue": "Character dialogue",
      "sounds": "Audio description",
      "negativePrompt": "Things to avoid",
      "productDescription": "Product focus for this scene"
    }
  ]
}`;
}

/**
 * Generate character description for consistency
 */
export function generateCharacterDescription(characterOptions?: any): string {
  if (!characterOptions) {
    return 'Professional presenter with clear, engaging delivery';
  }

  return `${characterOptions.personality} presenter with ${characterOptions.voiceCharacteristics} voice characteristics, maintaining ${characterOptions.cameraRelationship} with camera under ${characterOptions.lightingInteraction} lighting conditions`;
}

/**
 * Generate solid product description for scenes
 */
export function generateSolidProductDescription(product: any): string {
  const baseName = product.name || 'product';
  const description = product.description || '';
  const category = product.category || '';

  let productDesc = `${baseName}`;
  
  if (category) {
    productDesc += ` (${category})`;
  }
  
  if (description) {
    // Take first 100 characters of description for conciseness
    const shortDesc = description.length > 100 
      ? description.substring(0, 100) + '...' 
      : description;
    productDesc += ` - ${shortDesc}`;
  }

  return productDesc;
} 