// Product Analysis Feature Types

export interface UserProduct {
  id: string
  user_id: string
  name: string
  // category removed
  image_url: string
  image_metadata: ImageMetadata
  analysis_data: ProductAnalysis
  created_at: string
  updated_at: string
}

export interface ImageMetadata {
  width?: number
  height?: number
  fileSize?: number
  format?: string
  aspectRatio?: number
  filePath?: string // Path in storage bucket for retrieving signed URLs
}

export interface ProductAnalysis {
  productType?: string
  dominantColors?: string[]
  materials?: string[]
  shape?: string
  size?: 'small' | 'medium' | 'large'
  features?: string[]
  brandElements?: string[]
  suggestedEnvironments?: string[]
  confidence?: number
  analysisTimestamp?: string
}

export interface ProductAnalysisSession {
  id: string
  user_id: string
  product_id: string
  style_template_id: string
  generated_prompt: GeneratedPrompt
  analysis_cost: number
  created_at: string
}

export interface StyleTemplate {
  id: string
  name: string
  description: string
  preview_video_url?: string
  preview_image_url?: string
  template_data: TemplateData
  is_active: boolean
  created_at: string
}

export interface TemplateData {
  environment: string
  camera: string
  lighting: string
  motion: string
  effects: string[]
  mood?: string
  pacing?: 'slow' | 'medium' | 'fast'
}

export interface GeneratedPrompt {
  title: string
  description: string
  category: string
  base_style: string
  aspect_ratio: string
  scene_description: string
  camera_setup: string
  lighting: string
  negative_prompts: string[]
  timeline: TimelineSequence[]
  metadata: PromptMetadata
}

export interface TimelineSequence {
  sequence: number
  timestamp: string
  action: string
  dialogue: string
  sounds: string
  negativePrompt: string
  productDescription: string
}

export interface PromptMetadata {
  productName: string
  originalProductId: string
  styleTemplateId: string
  generationTimestamp: string
  aiModel: string
  analysisVersion: string
}

// Form and UI Types
export interface ProductUploadForm {
  name: string
  category: string // kept in payload for backward comp., always 'Uncategorized'
  file: File | null
}

export interface PromptGenerationRequest {
  productId: string
  styleTemplateId: string
  customizations?: PromptCustomizations
  userPrompt?: string
}

export interface PromptCustomizations {
  duration?: number
  environment?: string
  lighting?: string
  camera?: string
  effects?: string
  emphasizeFeatures?: string[]
  excludeElements?: string[]
  brandGuidelines?: string
  targetAudience?: string
}

// API Response Types
export interface AnalysisResponse {
  success: boolean
  analysis: ProductAnalysis
  cost: number
  processingTime: number
}

export interface PromptGenerationResponse {
  success: boolean
  prompt: GeneratedPrompt
  sessionId: string
  cost: number
}

// UI State Types
export interface ProductLibraryState {
  products: UserProduct[]
  loading: boolean
  error: string | null
  // category state removed
  searchQuery: string
  sortBy: 'name' | 'created_at'
  sortOrder: 'asc' | 'desc'
}

export interface PromptWizardState {
  currentStep: number
  selectedProduct: UserProduct | null
  selectedTemplate: StyleTemplate | null
  customizations: PromptCustomizations
  generatedPrompt: GeneratedPrompt | null
  isGenerating: boolean
  error: string | null
}

// Constants removed: PRODUCT_CATEGORIES

export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/png',
  'image/webp'
] as const

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_IMAGE_DIMENSION = 4096 // pixels

// Re-export usage types
export * from './usage' 

// Enhanced Video Style System
export interface EnhancedVideoStyle {
  id: string;
  name: string;
  description: string;
  duration: number; // 8 seconds for Veo3
  preferences: {
    lighting: string[];
    camera: string[];
    movement: string[];
    colorGrading: string[];
    environment: string[];
  };
  avoid?: {
    lighting?: string[];
    movement?: string[];
    colorGrading?: string[];
    environment?: string[];
  };
}

// Enhanced video generation types that follow existing timeline structure with Meta-Framework integration
export interface EnhancedSceneParameters {
  
  // Timeline sequence data (follows existing structure)
  timestamp: string; // e.g., "00:00.00-00:08.00"
  action: string; // Visual description of what happens
  dialogue: string; // Character dialogue/narration (max 26 words for 8 seconds)
  sounds: string; // Specific audio elements including ambient sounds, effects, background audio
  negativePrompt: string; // Elements to avoid - subtitles, captions, watermarks, text overlays
  productDescription: string; // AI-generated product description using metadata
  
  // Technical parameters (enhanced from Meta-Framework)
  environment: string;
  lighting: string;
  cameraSetup: string;
  cameraMovement: string;
  visualStyle: string;
  colorGrading: string;
  productAction: string;
  productPlacement: string;
  
  // Advanced parameters
  physicsRealism: boolean;
  handAccuracy: string;
  voiceCharacteristics?: string;
  subtitlePrevention?: boolean;
  
  // Meta-Framework Professional Attributes
  cameraPositioning?: string; // "(thats where the camera is positioned...)" syntax
  visualAnchors?: string[]; // Unique identifiers for consistency
  consistencyMarkers?: {
    faceShape?: string;
    eyeColor?: string;
    hairColor?: string;
    clothingColors?: string[];
    accessories?: string;
    skinTone?: string;
    build?: string;
    height?: string;
  };
  
  // Meta-Framework Quality Assurance
  qualityProtocols?: {
    audioHallucinationPrevention: boolean;
    physicsAwareness: boolean;
    consistencyValidation: boolean;
    professionalStandards: boolean;
  };
  
  // Meta-Framework Technical Specifications
  metaFrameworkSpecs?: {
    cognitiveLayer: number; // 1-6 cognitive architecture level
    constraintOptimization: string; // "9-15 specifications"
    styleCompliance: string[]; // Style preference adherence
    performanceMetrics: {
      consistencyScore?: number;
      qualityRating?: number;
      technicalAccuracy?: number;
    };
  };
}

export interface EnhancedGeneratedPrompt {
  // Basic info
  title: string;
  description: string;
  category: string;
  
  // Style info (matching your timeline structure)
  base_style: string;
  aspect_ratio: string;
  scene_description: string;
  camera_setup: string;
  lighting: string;
  negative_prompts: string[];
  
  // Timeline sequences (your existing format)
  timeline: TimelineSequence[];
  
  // Enhanced metadata
  videoStyle: string;
  totalDuration: string;
  sceneCount: number;
  qualityScore?: number;
  
  // Technical details for advanced users
  enhancedScenes: EnhancedSceneParameters[];
  
  // Meta-Framework additions
  processingTime?: number;
  cost?: number;
  metaFrameworkVersion?: string;
  characterConsistencyLevel?: string;
  cognitiveArchitecture?: string;
  qualityProtocols?: string[];
}

// Enhanced Character customization with Meta-Framework 23-attribute system
export interface CharacterOptions {
  // Core Demographics (Basic)
  gender: 'male' | 'female' | 'non-binary';
  ethnicity: 'caucasian' | 'african-american' | 'hispanic' | 'asian' | 'middle-eastern' | 'mixed';
  age: 'young-adult' | 'adult' | 'middle-aged';
  
  // Physical Attributes (8 Core - Meta Framework)
  faceShape: 'oval' | 'round' | 'square' | 'heart-shaped' | 'diamond' | 'rectangular';
  eyeColor: 'blue' | 'brown' | 'green' | 'hazel' | 'gray' | 'amber';
  eyeShape: 'almond' | 'round' | 'hooded' | 'monolid' | 'upturned' | 'downturned';
  eyeDetails: 'long-lashes' | 'thick-brows' | 'natural-lashes' | 'defined-brows' | 'sparse-lashes';
  noseShape: 'straight' | 'broad' | 'petite' | 'button' | 'aquiline' | 'defined';
  lipShape: 'full' | 'thin' | 'bow-shaped' | 'natural' | 'wide' | 'narrow';
  jawlineDefinition: 'strong' | 'soft' | 'angular' | 'rounded' | 'defined' | 'gentle';
  skinTone: 'fair' | 'light' | 'medium' | 'tan' | 'dark' | 'deep';
  skinUndertone: 'warm' | 'cool' | 'neutral' | 'olive' | 'golden' | 'pink';
  skinTexture: 'smooth' | 'freckled' | 'clear' | 'natural-glow' | 'matte' | 'dewy';
  
  // Hair Specifications
  hairColor: 'black' | 'brown' | 'blonde' | 'red' | 'gray' | 'colorful' | 'chestnut' | 'platinum' | 'auburn';
  hairTexture: 'straight' | 'wavy' | 'curly' | 'coily' | 'fine' | 'thick';
  hairLength: 'pixie' | 'short' | 'medium' | 'shoulder-length' | 'long' | 'very-long';
  hairStyle: 'natural' | 'sleek' | 'loose-waves' | 'tight-curls' | 'braided' | 'updo';
  
  // Physical Build
  height: 'petite' | 'short' | 'average' | 'tall' | 'very-tall';
  build: 'slim' | 'average' | 'athletic' | 'curvy' | 'plus-size' | 'muscular';
  postureStyle: 'confident' | 'relaxed' | 'elegant' | 'casual' | 'assertive' | 'graceful';
  
  // Visual Consistency Markers (5 Attributes)
  clothingStyle: 'professional' | 'casual' | 'trendy' | 'minimalist' | 'creative' | 'sporty';
  primaryClothingColors: string[]; // Array of specific colors
  accessories: 'minimal' | 'statement' | 'professional' | 'trendy' | 'vintage' | 'none';
  footwear: 'sneakers' | 'heels' | 'boots' | 'flats' | 'sandals' | 'dress-shoes';
  visualAnchors: string[]; // Unique identifiers for consistency
  
  // Behavioral & Personality (4 Attributes)
  movementStyle: 'fluid' | 'precise' | 'energetic' | 'calm' | 'deliberate' | 'natural';
  defaultExpression: 'neutral' | 'slight-smile' | 'serious' | 'friendly' | 'focused' | 'warm';
  personality: 'energetic' | 'calm' | 'enthusiastic' | 'professional' | 'friendly' | 'confident';
  voiceCharacteristics: 'warm' | 'professional' | 'energetic' | 'calm' | 'friendly' | 'authoritative';
  
  // Technical Positioning (Meta-Framework Advanced)
  cameraRelationship: 'direct-gaze' | 'slight-angle' | 'profile' | 'three-quarter' | 'over-shoulder';
  preferredAngles: string[]; // Specific camera positioning preferences
  lightingInteraction: 'natural' | 'dramatic' | 'soft' | 'bright' | 'moody' | 'professional';
}

export const DEFAULT_CHARACTER_OPTIONS: CharacterOptions = {
  // Core Demographics
  gender: 'female',
  ethnicity: 'caucasian',
  age: 'young-adult',
  
  // Physical Attributes
  faceShape: 'oval',
  eyeColor: 'brown',
  eyeShape: 'almond',
  eyeDetails: 'natural-lashes',
  noseShape: 'straight',
  lipShape: 'natural',
  jawlineDefinition: 'soft',
  skinTone: 'medium',
  skinUndertone: 'warm',
  skinTexture: 'smooth',
  
  // Hair
  hairColor: 'brown',
  hairTexture: 'wavy',
  hairLength: 'shoulder-length',
  hairStyle: 'loose-waves',
  
  // Build
  height: 'average',
  build: 'average',
  postureStyle: 'confident',
  
  // Visual Markers
  clothingStyle: 'casual',
  primaryClothingColors: ['navy', 'white', 'gray'],
  accessories: 'minimal',
  footwear: 'sneakers',
  visualAnchors: [],
  
  // Behavioral
  movementStyle: 'natural',
  defaultExpression: 'friendly',
  personality: 'enthusiastic',
  voiceCharacteristics: 'warm',
  
  // Technical
  cameraRelationship: 'direct-gaze',
  preferredAngles: ['eye-level', 'slightly-above'],
  lightingInteraction: 'natural'
};

// Multi-scene generation request with character options
export interface MultiSceneGenerationRequest {
  productId: string;
  videoStyle: string;
  sceneCount: number;
  customRequirements?: string;
  characterOptions?: CharacterOptions; // For AI Vlog style
}

// Multi-Scene Generation Response
export interface MultiSceneGenerationResponse {
  // Timeline structure (compatible with existing components)
  title: string;
  description: string;
  category: string;
  base_style: string;
  aspect_ratio: string;
  scene_description: string;
  camera_setup: string;
  lighting: string;
  negative_prompts: string[];
  timeline: TimelineSequence[];
  
  // Enhanced metadata
  videoStyle: string;
  totalDuration: string;
  sceneCount: number;
  processingTime: number;
  cost: number;
  
  // Enhanced scenes for technical view
  enhancedScenes: EnhancedSceneParameters[];
  
  metadata: {
    qualityScore?: number;
    stylePreferences: any;
    validation: {
      isValid: boolean;
      errorCount: number;
      warningCount: number;
      suggestions: string[];
    };
  };
}

// Enhanced Prompt Generation Request (extends existing)
export interface EnhancedPromptGenerationRequest extends PromptGenerationRequest {
  sceneCount?: number;
  videoStyle?: string;
  generationType?: 'single-scene' | 'multi-scene';
  // Legacy properties for backward compatibility
  selectedStyle?: any;
  selectedCamera?: any;
  analysisData?: any;
  examplePrompts?: any;
}

// Video Style Registry
export const ENHANCED_VIDEO_STYLES: Record<string, EnhancedVideoStyle> = {
  'cinematic': {
    id: 'cinematic',
    name: 'Cinematic Product Reveal',
    description: 'Professional film-style with dramatic composition',
    duration: 8,
    preferences: {
      lighting: ['dramatic-cinematic', 'low-key-moody', 'soft-diffused'],
      camera: ['close-up', 'medium-shot', 'extreme-close-up'],
      movement: ['smooth-tracking', 'dolly-zoom', 'static', 'tilt-up', 'tilt-down', 'orbit-360'],
      colorGrading: ['cinematic-teal', 'desaturated-moody', 'warm-nostalgic'],
      environment: ['minimalist-studio', 'dark-dramatic-background', 'professional-setup']
    },
    avoid: {
      lighting: ['artificial-indoor', 'harsh-direct'],
      movement: ['handheld', 'shaky'],
      colorGrading: ['vibrant-social', 'oversaturated']
    }
  },
  
  'ai-vlogs': {
    id: 'ai-vlogs',
    name: 'AI Vlog Style',
    description: 'Casual, authentic vlog-style content with vibrant feel',
    duration: 8,
    preferences: {
      lighting: ['natural-bright', 'high-key-airy', 'soft-diffused'],
      camera: ['selfie-angle', 'handheld-phone', 'medium-shot', 'close-up'],
      movement: ['handheld', 'static', 'smooth-tracking', 'pan-left', 'pan-right'],
      colorGrading: ['vibrant-social', 'natural', 'warm-nostalgic'],
      environment: ['home-setting', 'casual-background', 'everyday-environment']
    },
    avoid: {
      lighting: ['dramatic-cinematic', 'low-key-moody'],
      movement: ['dolly-zoom', 'complex-movements'],
      colorGrading: ['desaturated-moody', 'dark-tones']
    }
  },
  
  'asmr': {
    id: 'asmr',
    name: 'ASMR Product Focus',
    description: 'Calming, intimate, detail-focused content',
    duration: 8,
    preferences: {
      lighting: ['soft-diffused', 'high-key-airy', 'natural-bright'],
      camera: ['close-up', 'extreme-close-up', 'macro-detail'],
      movement: ['static', 'slow-smooth-tracking'],
      colorGrading: ['warm-nostalgic', 'natural', 'cool-modern'],
      environment: ['clean-minimal', 'soft-texture-background', 'intimate-setting']
    },
    avoid: {
      lighting: ['dramatic-cinematic', 'harsh-lighting'],
      movement: ['handheld', 'fast-movement', 'dynamic-shots'],
      colorGrading: ['vibrant-social', 'high-contrast']
    }
  },
  
  'product-review': {
    id: 'product-review',
    name: 'Professional Product Review',
    description: 'Clean, authoritative product analysis',
    duration: 8,
    preferences: {
      lighting: ['natural-bright', 'high-key-airy', 'soft-diffused'],
      camera: ['medium-shot', 'close-up', 'wide-shot', 'overhead-shot'],
      movement: ['static', 'smooth-tracking', 'slow-push-in'],
      colorGrading: ['natural', 'vibrant-social', 'clean-neutral'],
      environment: ['clean-desk', 'tech-studio', 'professional-background']
    },
    avoid: {
      lighting: ['low-key-moody', 'dramatic-shadows'],
      movement: ['handheld', 'shaky'],
      colorGrading: ['desaturated-moody', 'extreme-grading']
    }
  },
  
  'lifestyle': {
    id: 'lifestyle',
    name: 'Lifestyle Integration',
    description: 'Natural product use in real-world scenarios',
    duration: 8,
    preferences: {
      lighting: ['natural-bright', 'warm-ambient', 'golden-hour'],
      camera: ['medium-shot', 'wide-shot', 'close-up'],
      movement: ['handheld', 'smooth-tracking', 'static', 'pan-follow'],
      colorGrading: ['natural', 'warm-nostalgic', 'vibrant-social'],
      environment: ['home-setting', 'outdoor-natural', 'lifestyle-context']
    }
  },
  
  'social-content': {
    id: 'social-content',
    name: 'Social Media Ready',
    description: 'Vibrant, engaging social media content',
    duration: 8,
    preferences: {
      lighting: ['natural-bright', 'high-key-airy', 'colorful-lighting'],
      camera: ['selfie-angle', 'medium-shot', 'dynamic-angles'],
      movement: ['handheld', 'dynamic', 'quick-cuts', 'energetic'],
      colorGrading: ['vibrant-social', 'high-saturation', 'trendy-filters'],
      environment: ['colorful-background', 'trendy-setting', 'creative-space']
    },
    avoid: {
      lighting: ['low-key-moody', 'subdued-lighting'],
      movement: ['static', 'slow-movements'],
      colorGrading: ['desaturated', 'muted-tones']
    }
  }
};

// Style Validation
export interface StyleValidationResult {
  valid: boolean;
  errors: string[];
  suggestions: string[];
}

// Scene Generation Configuration
export interface SceneGenerationConfig {
  sceneCount: 2 | 3 | 4 | 5 | 6;
  videoStyle: string;
  duration: 8; // Fixed for Veo3
  focusAreas?: string[];
  customRequirements?: string;
} 