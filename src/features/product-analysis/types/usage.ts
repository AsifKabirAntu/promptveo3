export interface UserProductUsage {
  id: string
  user_id: string
  month_year: string // YYYY-MM-01 format
  uploads_used: number
  prompts_generated: number
  created_at: string
  updated_at: string
}

export interface UsageLimits {
  maxUploads: number
  maxPrompts: number
  uploadsUsed: number
  promptsUsed: number
  uploadsRemaining: number
  promptsRemaining: number
  canUpload: boolean
  canGeneratePrompt: boolean
}

export interface PlanLimits {
  free: {
    uploads: 1
    prompts: 1
  }
  pro: {
    uploads: 20
    prompts: 40
  }
}

export const PLAN_LIMITS: PlanLimits = {
  free: {
    uploads: 1,
    prompts: 1
  },
  pro: {
    uploads: 20,
    prompts: 40
  }
}

export function calculateUsageLimits(
  usage: UserProductUsage | null,
  plan: 'free' | 'pro'
): UsageLimits {
  const limits = PLAN_LIMITS[plan]
  const uploadsUsed = usage?.uploads_used || 0
  const promptsUsed = usage?.prompts_generated || 0

  return {
    maxUploads: limits.uploads,
    maxPrompts: limits.prompts,
    uploadsUsed,
    promptsUsed,
    uploadsRemaining: Math.max(0, limits.uploads - uploadsUsed),
    promptsRemaining: Math.max(0, limits.prompts - promptsUsed),
    canUpload: uploadsUsed < limits.uploads,
    canGeneratePrompt: promptsUsed < limits.prompts
  }
} 