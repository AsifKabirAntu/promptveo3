import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/types/database'
import { 
  UserProduct, 
  ProductAnalysisSession, 
  StyleTemplate,
  PromptGenerationRequest,
  AnalysisResponse,
  PromptGenerationResponse,
  ProductUploadForm 
} from '../types'
import { canUserUpload, canUserGeneratePrompt, incrementUploadUsage, incrementPromptGenerationUsage } from './usage-api'

const supabase = createClientComponentClient<Database>()

// Helper function to get signed URL
export async function getSignedUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('product-images')
    .createSignedUrl(filePath, 3600) // 1 hour expiry

  if (error || !data?.signedUrl) {
    throw error || new Error('Failed to create signed URL')
  }

  return data.signedUrl
}

// Product Management
export async function uploadProduct(formData: ProductUploadForm, file: File): Promise<UserProduct> {
  try {
    // Get current user first
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Authentication required. Please sign in to upload products.')
    }

    // Check if user can upload
    const canUpload = await canUserUpload()
    if (!canUpload) {
      throw new Error('Upload limit reached. Upgrade to Pro for more uploads or wait until next month.')
    }

    // Upload image to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    // Create user-specific file path for security
    const filePath = `${user.id}/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Get initial signed URL
    const signedUrl = await getSignedUrl(filePath)

    // Extract image metadata
    const imageMetadata = {
      width: 0, // Will be set by image analysis
      height: 0,
      fileSize: file.size,
      format: file.type,
      aspectRatio: 0,
      filePath: filePath // Store the file path for future signed URLs
    }

    // Insert product record (no category)
    const { data, error } = await supabase
      .from('user_products')
      .insert({
        user_id: user.id,
        name: formData.name,
        image_url: signedUrl,
        image_metadata: imageMetadata,
        analysis_data: {}
      })
      .select()
      .single()

    if (error) throw error

    // Trigger automatic analysis in background
    try {
      await analyzeProductImage(data.id)
    } catch (analysisError) {
      // Don't fail the upload if analysis fails - it can be retried later
      console.warn('Analysis failed during upload, can be retried later:', analysisError)
    }

    // Track upload usage
    try {
      await incrementUploadUsage()
    } catch (usageError) {
      // Don't fail the upload if usage tracking fails
      console.warn('Failed to track upload usage:', usageError)
    }

    return data as UserProduct

  } catch (error) {
    console.error('Error uploading product:', error)
    throw error
  }
}

export async function getUserProducts(): Promise<UserProduct[]> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Authentication required. Please sign in to view products.')
    }

    const { data, error } = await supabase
      .from('user_products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Refresh signed URLs for all products
    const productsWithUrls = await Promise.all(data.map(async (product) => {
      try {
        const filePath = product.image_metadata?.filePath
        if (filePath) {
          const signedUrl = await getSignedUrl(filePath)
          return { ...product, image_url: signedUrl }
        }
        return product
      } catch (error) {
        console.error(`Error refreshing URL for product ${product.id}:`, error)
        return product
      }
    }))

    return productsWithUrls as UserProduct[]

  } catch (error) {
    console.error('Error fetching products:', error)
    throw error
  }
}

export async function deleteProduct(productId: string): Promise<void> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      throw new Error('Authentication required')
    }

    // Get product details first to get the file path
    const { data: product, error: fetchError } = await supabase
      .from('user_products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', user.id)
      .single()

    if (fetchError) throw fetchError

    // Delete the file from storage if it exists
    if (product?.image_metadata?.filePath) {
      const { error: storageError } = await supabase.storage
        .from('product-images')
        .remove([product.image_metadata.filePath])

      if (storageError) {
        console.error('Error deleting file:', storageError)
      }
    }

    // Delete the product record
    const { error } = await supabase
      .from('user_products')
      .delete()
      .eq('id', productId)
      .eq('user_id', user.id)

    if (error) throw error

  } catch (error) {
    console.error('Error deleting product:', error)
    throw error
  }
}

export async function updateProduct(productId: string, updates: Partial<UserProduct>): Promise<UserProduct> {
  try {
    const { data, error } = await supabase
      .from('user_products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single()

    if (error) throw error
    return data as UserProduct

  } catch (error) {
    console.error('Error updating product:', error)
    throw error
  }
}

// Style Templates
export async function getStyleTemplates(): Promise<StyleTemplate[]> {
  try {
    const { data, error } = await supabase
      .from('style_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as StyleTemplate[]

  } catch (error) {
    console.error('Error fetching style templates:', error)
    throw error
  }
}

// AI Analysis and Prompt Generation
export async function analyzeProductImage(productId: string): Promise<AnalysisResponse> {
  try {
    const response = await fetch('/api/product-analysis/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId }),
    })

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result as AnalysisResponse

  } catch (error) {
    console.error('Error analyzing product:', error)
    throw error
  }
}

export async function generatePrompt(request: PromptGenerationRequest): Promise<PromptGenerationResponse> {
  try {
    const response = await fetch('/api/product-analysis/generate-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`Prompt generation failed: ${response.statusText}`)
    }

    const result = await response.json()
    return result as PromptGenerationResponse

  } catch (error) {
    console.error('Error generating prompt:', error)
    throw error
  }
}

// Analysis Sessions
export async function getAnalysisSessions(): Promise<ProductAnalysisSession[]> {
  try {
    const { data, error } = await supabase
      .from('product_analysis_sessions')
      .select(`
        *,
        user_products (
          id,
          name,
          image_url
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as ProductAnalysisSession[]

  } catch (error) {
    console.error('Error fetching analysis sessions:', error)
    throw error
  }
}

export async function getAnalysisSession(sessionId: string): Promise<ProductAnalysisSession> {
  try {
    const { data, error } = await supabase
      .from('product_analysis_sessions')
      .select(`
        *,
        user_products (
          id,
          name,
          image_url
        )
      `)
      .eq('id', sessionId)
      .single()

    if (error) throw error
    return data as ProductAnalysisSession

  } catch (error) {
    console.error('Error fetching analysis session:', error)
    throw error
  }
}

// Utility functions
export async function createStorageBucket(): Promise<void> {
  try {
    const { error } = await supabase.storage
      .createBucket('product-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      })

    if (error && !error.message.includes('already exists')) {
      throw error
    }
  } catch (error) {
    console.error('Error creating storage bucket:', error)
    throw error
  }
} 