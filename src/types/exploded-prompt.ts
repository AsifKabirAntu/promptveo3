export interface ExplodedShot {
  composition: string
  lens: string
  frame_rate: string
  camera_movement: string
}

export interface ExplodedSubject {
  description: string
  wardrobe: string
  props: string
}

export interface ExplodedScene {
  location: string
  time_of_day: string
  environment: string
}

export interface ExplodedVisualDetails {
  action: string
  special_effects: string
  hair_clothing_motion: string
}

export interface ExplodedCinematography {
  lighting: string
  color_palette: string
  tone: string
}

export interface ExplodedAudio {
  music: string
  ambient: string
  sound_effects: string
  mix_level: string
}

export interface ExplodedDialogue {
  character: string
  line: string
  subtitles: boolean
}

export interface ExplodedBuildPrompt {
  id: string
  title: string
  description: string
  category: string // should be 'Exploded Build'
  shot: ExplodedShot
  subject: ExplodedSubject
  scene: ExplodedScene
  visual_details: ExplodedVisualDetails
  cinematography: ExplodedCinematography
  audio: ExplodedAudio
  dialogue: ExplodedDialogue
  created_by: string | null
  created_at: string
  updated_at: string
  is_featured: boolean
  is_public: boolean
  likes_count: number
  usage_count: number
}

export interface ExplodedBuildPromptData {
  title: string
  description: string
  category?: string
  shot: ExplodedShot
  subject: ExplodedSubject
  scene: ExplodedScene
  visual_details: ExplodedVisualDetails
  cinematography: ExplodedCinematography
  audio: ExplodedAudio
  dialogue: ExplodedDialogue
  is_featured?: boolean
  is_public?: boolean
} 