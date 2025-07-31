export interface Prompt {
  id: string
  title: string
  description: string
  style: string
  camera: string
  lighting: string
  environment: string
  elements: string[]
  motion: string
  ending: string
  text: string
  keywords: string[]
  timeline?: string | null  // Added timeline field (optional)
  created_at: string
  updated_at: string
  created_by: string
  is_featured: boolean
  is_public: boolean
  likes_count: number
  usage_count: number
  category: string
}

export interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  plan: 'free' | 'pro'
  created_at: string
  subscription_id?: string
  subscription_status?: string
}

export interface UserPrompt {
  id: string
  user_id: string
  prompt_id: string
  is_favorited: boolean
  created_at: string
}

export interface PromptUsage {
  id: string
  user_id: string
  prompt_id: string
  action: 'view' | 'export' | 'remix'
  created_at: string
}

export type PromptFormData = Omit<Prompt, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'likes_count' | 'usage_count'>

export interface PromptFilters {
  category?: string
  style?: string
  keywords?: string[]
  search?: string
} 