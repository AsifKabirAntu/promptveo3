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
  audio: string
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