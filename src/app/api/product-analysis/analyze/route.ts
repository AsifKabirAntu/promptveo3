import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openRouterApiKey = process.env.OPENROUTER_API_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json()

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get the product from the database
    const { data: product, error: productError } = await supabase
      .from('user_products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // If already analyzed, return existing analysis
    if (Object.keys(product.analysis_data || {}).length > 0) {
      return NextResponse.json({
        success: true,
        analysis: product.analysis_data,
        cost: 0,
        processingTime: 0
      })
    }

    const startTime = Date.now()

    // Analyze the image using OpenRouter GPT-4o
    const analysisPrompt = `
      Analyze this product image and provide detailed information in JSON format. 
      Focus on characteristics that would be useful for creating a product reveal video.

      Please provide:
      {
        "productType": "Brief description of what the product is",
        "dominantColors": ["array", "of", "main", "colors"],
        "materials": ["array", "of", "materials", "visible"],
        "shape": "overall shape description",
        "size": "small/medium/large estimate",
        "features": ["notable", "features", "or", "details"],
        "brandElements": ["visible", "logos", "or", "branding"],
        "suggestedEnvironments": ["environments", "that", "would", "complement", "this", "product"],
        "confidence": 0.95
      }

      Be specific and detailed. This analysis will be used to generate AI prompts for product reveal videos.
    `

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'PromptVeo3'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: analysisPrompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: product.image_url
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const aiResponse = await response.json()
    const processingTime = Date.now() - startTime

    // Extract the JSON from the AI response
    let analysis
    try {
      const content = aiResponse.choices[0]?.message?.content || '{}'
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : content)
      analysis.analysisTimestamp = new Date().toISOString()
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      // Provide fallback analysis
      analysis = {
        productType: 'Product',
        dominantColors: ['Unknown'],
        materials: ['Unknown'],
        shape: 'Unknown',
        size: 'medium',
        features: ['Product features'],
        brandElements: [],
        suggestedEnvironments: ['Studio environment'],
        confidence: 0.5,
        analysisTimestamp: new Date().toISOString()
      }
    }

    // Calculate cost (approximate)
    const estimatedCost = 0.01 // $0.01 per analysis as placeholder

    // Update the product with analysis data
    const { error: updateError } = await supabase
      .from('user_products')
      .update({
        analysis_data: analysis,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)

    if (updateError) {
      console.error('Error updating product analysis:', updateError)
    }

    return NextResponse.json({
      success: true,
      analysis,
      cost: estimatedCost,
      processingTime
    })

  } catch (error) {
    console.error('Product analysis error:', error)
    return NextResponse.json(
      { error: 'Failed to analyze product image' },
      { status: 500 }
    )
  }
} 