import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Prompt } from '@/types/prompt'
import { TimelinePrompt } from '@/types/timeline-prompt'
import { ExplodedBuildPrompt } from '@/types/exploded-prompt'

const supabase = createClientComponentClient()

export type UnifiedPrompt =
  | (Prompt & { type: 'regular' })
  | (TimelinePrompt & { type: 'timeline' })
  | (ExplodedBuildPrompt & { type: 'exploded' })

export async function getFavorites(): Promise<UnifiedPrompt[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Get regular prompt favorites
  const { data: regularFavorites, error: regularError } = await supabase
    .from('favorites')
    .select('prompt_id')
    .eq('user_id', user.id)
    .eq('prompt_type', 'regular')

  if (regularError) {
    console.error('Error fetching regular favorites:', regularError)
    return []
  }

  // Get timeline prompt favorites
  const { data: timelineFavorites, error: timelineError } = await supabase
    .from('favorites')
    .select('prompt_id')
    .eq('user_id', user.id)
    .in('prompt_type', ['timeline'])

  if (timelineError) {
    console.error('Error fetching timeline favorites:', timelineError)
    return []
  }

  // Get exploded prompt favorites
  const { data: explodedFavorites, error: explodedError } = await supabase
    .from('favorites')
    .select('prompt_id')
    .eq('user_id', user.id)
    .eq('prompt_type', 'exploded')

  if (explodedError) {
    console.error('Error fetching exploded favorites:', explodedError)
  }

  // Get the actual prompts
  const regularPromptIds = regularFavorites?.map(f => f.prompt_id) || []
  const timelinePromptIds = timelineFavorites?.map(f => f.prompt_id) || []
  const explodedPromptIds = explodedFavorites?.map(f => f.prompt_id) || []

  const favorites: UnifiedPrompt[] = []

  if (regularPromptIds.length > 0) {
    const { data: regularPrompts } = await supabase
      .from('prompts')
      .select('*')
      .in('id', regularPromptIds)

    if (regularPrompts) {
      favorites.push(...regularPrompts.map(prompt => ({
        ...prompt,
        type: 'regular' as const
      })))
    }
  }

  if (timelinePromptIds.length > 0) {
    const { data: timelinePrompts } = await supabase
      .from('timeline_prompts')
      .select('*')
      .in('id', timelinePromptIds)

    if (timelinePrompts) {
      favorites.push(...timelinePrompts.map(prompt => ({
        ...prompt,
        type: 'timeline' as const
      })))
    }
  }

  if (explodedPromptIds.length > 0) {
    const { data: explodedPrompts } = await supabase
      .from('exploded_build_prompts')
      .select('*')
      .in('id', explodedPromptIds)

    if (explodedPrompts) {
      favorites.push(...explodedPrompts.map(prompt => ({
        ...prompt,
        type: 'exploded' as const
      })))
    }
  }

  return favorites
}

export async function toggleFavorite(prompt: UnifiedPrompt) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  console.log(`Toggling favorite for prompt: ${prompt.id} ${prompt.title}`)

  // Check if already favorited
  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('prompt_id', prompt.id)
    .eq('prompt_type', prompt.type)
    .maybeSingle()

  try {
    if (existing) {
      // Remove favorite
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('id', existing.id)

      if (deleteError) throw deleteError
      console.log('Removed favorite')
      return false
    } else {
      // Add new favorite
      console.log(`Adding new favorite for user: ${user.id} prompt: ${prompt.id} type: ${prompt.type}`)
      const { error: insertError } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          prompt_id: prompt.id,
          prompt_type: prompt.type
        })

      if (insertError) throw insertError
      console.log('Added favorite')
      return true
    }
  } catch (error) {
    console.error('Error toggling favorite:', error)
    return false
  }
}

export async function isFavorited(prompt: UnifiedPrompt) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('prompt_id', prompt.id)
    .eq('prompt_type', prompt.type)
    .maybeSingle()

  return !!data
} 