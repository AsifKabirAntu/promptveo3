// Timeline Prompt Types
export interface TimelineSequence {
  sequence: number
  timestamp: string
  action: string
  audio: string
}

export interface TimelinePrompt {
  id: string
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
  created_by: string
  created_at: string
  updated_at: string
  is_featured: boolean
  is_public: boolean
  likes_count: number
  usage_count: number
}

export interface TimelinePromptFormData {
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
  is_featured: boolean
  is_public: boolean
}

export interface UserTimelinePrompt {
  id: string
  user_id: string
  timeline_prompt_id: string
  is_favorited: boolean
  created_at: string
}

export interface TimelinePromptUsage {
  id: string
  user_id: string
  timeline_prompt_id: string
  action: 'view' | 'export' | 'remix'
  created_at: string
}

export interface TimelinePromptFilters {
  category?: string
  base_style?: string
  aspect_ratio?: string
  search?: string
}

// Raw JSON format for ingestion
export interface TimelinePromptData {
  title: string
  description: string
  category: string
  base_style: string
  aspect_ratio?: string
  scene_description: string
  camera_setup: string
  lighting: string
  negative_prompts: string[]
  timeline: TimelineSequence[]
  is_featured?: boolean
  is_public?: boolean
} 