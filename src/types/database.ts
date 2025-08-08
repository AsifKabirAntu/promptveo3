export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      prompts: {
        Row: {
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
          timeline: string | null
          category: string
          created_by: string | null
          created_at: string
          updated_at: string
          is_featured: boolean
          is_public: boolean
          likes_count: number
          usage_count: number
        }
        Insert: {
          id?: string
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
          timeline?: string | null
          category: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_featured?: boolean
          is_public?: boolean
          likes_count?: number
          usage_count?: number
        }
        Update: {
          id?: string
          title?: string
          description?: string
          style?: string
          camera?: string
          lighting?: string
          environment?: string
          elements?: string[]
          motion?: string
          ending?: string
          text?: string
          keywords?: string[]
          timeline?: string | null
          category?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_featured?: boolean
          is_public?: boolean
          likes_count?: number
          usage_count?: number
        }
      }
      timeline_prompts: {
        Row: {
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
          timeline: unknown // JSONB type
          created_by: string | null
          created_at: string
          updated_at: string
          is_featured: boolean
          is_public: boolean
          likes_count: number
          usage_count: number
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: string
          base_style: string
          aspect_ratio?: string
          scene_description: string
          camera_setup: string
          lighting: string
          negative_prompts?: string[]
          timeline: unknown // JSONB type
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_featured?: boolean
          is_public?: boolean
          likes_count?: number
          usage_count?: number
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          base_style?: string
          aspect_ratio?: string
          scene_description?: string
          camera_setup?: string
          lighting?: string
          negative_prompts?: string[]
          timeline?: unknown // JSONB type
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_featured?: boolean
          is_public?: boolean
          likes_count?: number
          usage_count?: number
        }
      }
      exploded_build_prompts: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          shot: unknown
          subject: unknown
          scene: unknown
          visual_details: unknown
          cinematography: unknown
          audio: unknown
          dialogue: unknown
          created_by: string | null
          created_at: string
          updated_at: string
          is_featured: boolean
          is_public: boolean
          likes_count: number
          usage_count: number
        }
        Insert: {
          id?: string
          title: string
          description: string
          category?: string
          shot: unknown
          subject: unknown
          scene: unknown
          visual_details: unknown
          cinematography: unknown
          audio: unknown
          dialogue: unknown
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_featured?: boolean
          is_public?: boolean
          likes_count?: number
          usage_count?: number
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          shot?: unknown
          subject?: unknown
          scene?: unknown
          visual_details?: unknown
          cinematography?: unknown
          audio?: unknown
          dialogue?: unknown
          created_by?: string | null
          created_at?: string
          updated_at?: string
          is_featured?: boolean
          is_public?: boolean
          likes_count?: number
          usage_count?: number
        }
      }
      user_prompts: {
        Row: {
          id: string
          user_id: string
          prompt_id: string
          is_favorited: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          prompt_id: string
          is_favorited?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          prompt_id?: string
          is_favorited?: boolean
          created_at?: string
        }
      }
      user_timeline_prompts: {
        Row: {
          id: string
          user_id: string
          timeline_prompt_id: string
          is_favorited: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          timeline_prompt_id: string
          is_favorited?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          timeline_prompt_id?: string
          is_favorited?: boolean
          created_at?: string
        }
      }
      prompt_usage: {
        Row: {
          id: string
          user_id: string | null
          prompt_id: string
          action: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          prompt_id: string
          action: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          prompt_id?: string
          action?: string
          created_at?: string
        }
      }
      timeline_prompt_usage: {
        Row: {
          id: string
          user_id: string | null
          timeline_prompt_id: string
          action: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          timeline_prompt_id: string
          action: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          timeline_prompt_id?: string
          action?: string
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          subscription_id: string
          status: string
          plan: string
          current_period_start: string
          current_period_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id: string
          status: string
          plan: string
          current_period_start: string
          current_period_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string
          status?: string
          plan?: string
          current_period_start?: string
          current_period_end?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_products: {
        Row: {
          id: string
          user_id: string
          name: string
          image_url: string
          image_metadata: unknown // JSONB
          analysis_data: unknown // JSONB
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          image_url: string
          image_metadata?: unknown
          analysis_data?: unknown
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          image_url?: string
          image_metadata?: unknown
          analysis_data?: unknown
          created_at?: string
          updated_at?: string
        }
      }
      user_product_usage: {
        Row: {
          id: string
          user_id: string
          month_year: string
          uploads_used: number
          prompts_generated: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          month_year: string
          uploads_used?: number
          prompts_generated?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          month_year?: string
          uploads_used?: number
          prompts_generated?: number
          created_at?: string
          updated_at?: string
        }
      }
      product_analysis_sessions: {
        Row: {
          id: string
          user_id: string
          product_id: string
          style_template_id: string
          generated_prompt: unknown // JSONB
          analysis_cost: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          style_template_id: string
          generated_prompt: unknown
          analysis_cost?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          product_id?: string
          style_template_id?: string
          generated_prompt?: unknown
          analysis_cost?: number
          created_at?: string
        }
      }
      style_templates: {
        Row: {
          id: string
          name: string
          description: string
          preview_video_url: string | null
          preview_image_url: string | null
          template_data: unknown // JSONB
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          description: string
          preview_video_url?: string | null
          preview_image_url?: string | null
          template_data: unknown
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          preview_video_url?: string | null
          preview_image_url?: string | null
          template_data?: unknown
          is_active?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 