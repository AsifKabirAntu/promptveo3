import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const openRouterApiKey = process.env.OPENROUTER_API_KEY!

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { productId, selectedStyle, selectedCamera, analysisData, examplePrompts } = await request.json()

    if (!productId || !selectedStyle || !selectedCamera) {
      return NextResponse.json(
        { error: 'Product ID, style, and camera setup are required' },
        { status: 400 }
      )
    }

    // Get the product
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

    // Check if user can generate prompts
    const { data: subscription } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', product.user_id)
      .single()

    const userPlan = subscription?.plan || 'free'
    
    const { data: canGenerate, error: checkError } = await supabase
      .rpc('can_user_generate_prompt', {
        user_uuid: product.user_id,
        user_plan: userPlan
      })

    if (checkError) {
      console.error('Error checking prompt generation permissions:', checkError)
      return NextResponse.json(
        { error: 'Failed to check permissions' },
        { status: 500 }
      )
    }

    if (!canGenerate) {
      return NextResponse.json(
        { error: 'Prompt generation limit reached. Upgrade to Pro for more prompts or wait until next month.' },
        { status: 403 }
      )
    }

    // Check if product has been analyzed (use provided analysisData or product's existing data)
    const finalAnalysisData = analysisData || product.analysis_data
    if (!finalAnalysisData || Object.keys(finalAnalysisData).length === 0) {
      return NextResponse.json(
        { error: 'Product must be analyzed first' },
        { status: 400 }
      )
    }

    const startTime = Date.now()

    // Create the prompt for GPT-4o with enhanced context from examples
    const systemPrompt = `You are an expert video prompt creator for Veo3. Create a product reveal video prompt based on the user's selected style and product analysis data.

EXAMPLE OUTPUT (Smart Speaker Origami):
{
  "title": "Smart Speaker Origami",
  "category": "Product Reveal",
  "description": "In a serene minimalist Japanese room with translucent shoji screens filtering soft natural light, wooden floors gleam with subtle reflections. The camera begins a smooth 360-degree orbit around an invisible focal point as delicate speaker components gracefully float and connect through magnetic forces. Panels unfold like origami petals while the environment reacts with gentle light shifts, creating an ethereal dance of technology and zen aesthetics.",
  "base_style": "dynamic, photorealistic, 4K",
  "aspect_ratio": "16:9",
  "scene_description": "A minimalist Japanese room with shoji screens",
  "camera_setup": "360-degree orbit shot",
  "lighting": "soft ambient lighting",
  "timeline": [
    {
      "sequence": 1,
      "timestamp": "00:00.00-00:01.22",
      "action": "Parts gracefully connect with magnetic clicks.",
      "audio": "Soft ambient tones and faint rustling."
    },
    {
      "sequence": 2,
      "timestamp": "00:01.22-00:01.70",
      "action": "Invisible forces pull pieces together smoothly.",
      "audio": "Serene strings swelling to a climax."
    },
    {
      "sequence": 3,
      "timestamp": "00:01.70-00:03.74",
      "action": "Lights flash and the final component snaps into place.",
      "audio": "Soft ambient tones and faint rustling."
    },
    {
      "sequence": 4,
      "timestamp": "00:03.74-00:07.20",
      "action": "Delicate panels unfold like petals.",
      "audio": "Serene strings swelling to a climax."
    },
    {
      "sequence": 5,
      "timestamp": "00:07.20-00:07.35",
      "action": "The environment reacts with subtle changes as assembly occurs.",
      "audio": "Deep bass rumble followed by a harmonious chord."
    },
    {
      "sequence": 6,
      "timestamp": "00:07.35-00:08.00",
      "action": "The packaging trembles and emits light.",
      "audio": "Playful xylophone and marimba notes."
    }
  ]
}

Create a similar JSON structure for the provided product. Use the selected base_style and camera_setup. The timeline can vary in length. Keep within 8 seconds total.

IMPORTANT: For the "description" field, write a vivid, cinematic scene description that describes the visual environment, camera movement, lighting, and how the product appears/transforms in the scene. This should paint a clear picture for Veo3 video generation, not just say "product reveal prompt".

Return only the JSON.`

    const userMessage = `
Product: ${product.name}
Selected base_style: ${selectedStyle.base_style}
Selected camera_setup: ${selectedCamera.setup}

Product analysis data:
${JSON.stringify(finalAnalysisData, null, 2)}

Create a product reveal video prompt. Timeline can vary in length.`

    if (!openRouterApiKey) {
      // Return a mock response if no API key
      const mockPrompt = {
        prompt: `Create a stunning ${selectedStyle.base_style} product reveal video featuring ${product.name}. The scene is set in a ${selectedStyle.name.toLowerCase()} environment that complements the product's ${finalAnalysisData?.dominantColors?.join(' and ') || 'aesthetic'}. The video uses ${selectedCamera.setup} to showcase the product with ${selectedStyle.description.toLowerCase()}. ${finalAnalysisData?.productType || 'The product'} emerges gracefully, highlighting its ${finalAnalysisData?.materials?.join(', ') || 'premium materials'} and ${finalAnalysisData?.features?.join(', ') || 'key features'}. The ${selectedCamera.setup} captures every detail while maintaining the ${selectedStyle.name.toLowerCase()} aesthetic, creating a mesmerizing product showcase with cinematic precision.`,
        description: `In a ${selectedStyle.name.toLowerCase()} environment bathed in atmospheric lighting, the camera executes a ${selectedCamera.description.toLowerCase()} revealing the ${product.name} through dynamic transformation. ${finalAnalysisData?.dominantColors?.length ? `Rich ${finalAnalysisData.dominantColors.join(' and ')} tones` : 'Vibrant colors'} dance across ${finalAnalysisData?.materials?.join(' and ') || 'premium surfaces'} as the product materializes with ${selectedStyle.description.toLowerCase()}. The ${selectedCamera.setup} captures flowing movements and intricate details, creating a hypnotic dance of technology and artistry that showcases the product's ${finalAnalysisData?.features?.join(', ') || 'innovative features'} in stunning detail.`,
        timeline: [
          {
            sequence: 1,
            timestamp: "00:00.00-00:01.50",
            action: `Product introduction with ${selectedStyle.name.toLowerCase()} aesthetic using ${selectedCamera.setup}, setting the mood`,
            audio: `Ambient ${selectedStyle.name.toLowerCase()} soundscape begins`
          },
          {
            sequence: 2,
            timestamp: "00:01.50-00:03.50", 
            action: `Product components begin to assemble, showcasing ${finalAnalysisData?.materials?.join(' and ') || 'materials'} with ${selectedCamera.description.toLowerCase()}`,
            audio: `Gentle mechanical sounds with ${selectedStyle.name.toLowerCase()} musical elements`
          },
          {
            sequence: 3,
            timestamp: "00:03.50-00:06.50",
            action: `Main reveal sequence highlighting ${finalAnalysisData?.features?.join(', ') || 'key features'} using ${selectedCamera.setup}`,
            audio: `Audio crescendo matching the visual revelation`
          },
          {
            sequence: 4,
            timestamp: "00:06.50-00:08.00",
            action: `Final showcase with product fully revealed, emphasizing the ${selectedStyle.name.toLowerCase()} aesthetic`,
            audio: `Concluding harmony that completes the ${selectedStyle.name.toLowerCase()} experience`
          }
        ],
        title: `${selectedStyle.name} ${product.name} Reveal`,
        category: "Product Reveal",
        style: selectedStyle.base_style,
        camera: selectedCamera.setup,
        scene_description: `A ${selectedStyle.name.toLowerCase()} environment that perfectly complements the ${product.name}, featuring ${selectedStyle.description.toLowerCase()}`,
        duration: "8 seconds",
        videoSettings: {
          aspectRatio: "16:9",
          quality: "high",
          fps: 24
        },
        metadata: {
          productName: product.name,
          selectedStyle: selectedStyle.name,
          selectedCamera: selectedCamera.name,
          generatedAt: new Date().toISOString(),
          analysisVersion: "1.0"
        }
      }

      // Save the session
      const { data: session, error: sessionError } = await supabase
        .from('product_analysis_sessions')
        .insert({
          product_id: productId,
          style_template_id: selectedStyle.id || 'custom',
          generated_prompt: mockPrompt,
          analysis_cost: 0
        })
        .select()
        .single()

      if (sessionError) {
        console.error('Error saving analysis session:', sessionError)
      }

      return NextResponse.json({
        success: true,
        prompt: mockPrompt,
        sessionId: session?.id,
        cost: 0,
        processingTime: Date.now() - startTime,
        usedMockData: true
      })
    }

    // Call OpenRouter API
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'PromptVeo3 - Product Analysis'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user', 
            content: userMessage
          }
        ],
        temperature: 0.8,
        max_tokens: 2000
      })
    })

    if (!aiResponse.ok) {
      throw new Error(`OpenRouter API failed: ${aiResponse.statusText}`)
    }

    const aiResult = await aiResponse.json()
    const processingTime = Date.now() - startTime

    // Extract and parse the JSON from the AI response
    let generatedPrompt
    try {
      const content = aiResult.choices[0]?.message?.content || '{}'
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      generatedPrompt = JSON.parse(jsonMatch ? jsonMatch[0] : content)
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      // Fallback prompt
      generatedPrompt = {
        prompt: `Create a ${selectedStyle.base_style} product reveal video featuring ${product.name} using ${selectedCamera.setup}. The scene is set in a ${selectedStyle.name.toLowerCase()} environment that showcases the product with ${selectedCamera.description.toLowerCase()}, highlighting its ${finalAnalysisData?.features?.join(', ') || 'unique features'} in the ${selectedStyle.name.toLowerCase()} style.`,
        description: `A cinematic ${selectedStyle.name.toLowerCase()} scene unfolds as the camera performs a ${selectedCamera.description.toLowerCase()} around the ${product.name}. The environment pulses with ${selectedStyle.description.toLowerCase()} while the product emerges through graceful transformation, its ${finalAnalysisData?.materials?.join(' and ') || 'surfaces'} catching and reflecting the ambient light. Each movement reveals new details and features, creating a mesmerizing visual narrative that celebrates the product's design and functionality.`,
        timeline: [
          {
            sequence: 1,
            timestamp: "00:00.00-00:02.00",
            action: `Product introduction with ${selectedStyle.name.toLowerCase()} aesthetic using ${selectedCamera.setup}`,
            audio: `Ambient introduction matching ${selectedStyle.name.toLowerCase()} mood`
          },
          {
            sequence: 2,
            timestamp: "00:02.00-00:05.00",
            action: `Feature highlight sequence showcasing ${finalAnalysisData?.features?.join(', ') || 'key features'} using ${selectedCamera.setup}`,
            audio: `Dynamic audio progression highlighting product features`
          },
          {
            sequence: 3,
            timestamp: "00:05.00-00:08.00",
            action: `Final reveal and showcase with ${selectedStyle.name.toLowerCase()} style completion`,
            audio: `Concluding audio that completes the experience`
          }
        ],
        title: `${selectedStyle.name} ${product.name} Reveal`,
        category: "Product Reveal",
        style: selectedStyle.base_style,
        camera: selectedCamera.setup,
        scene_description: `A ${selectedStyle.name.toLowerCase()} environment designed to showcase ${product.name}`,
        duration: "8 seconds",
        videoSettings: {
          aspectRatio: "16:9",
          quality: "high", 
          fps: 24
        },
        metadata: {
          productName: product.name,
          selectedStyle: selectedStyle.name,
          selectedCamera: selectedCamera.name,
          generatedAt: new Date().toISOString(),
          analysisVersion: "1.0"
        }
      }
    }

    // Calculate cost (approximate)
    const estimatedCost = 0.02 // $0.02 per prompt generation

    // Save the analysis session
    const { data: session, error: sessionError } = await supabase
      .from('product_analysis_sessions')
      .insert({
        product_id: productId,
        style_template_id: selectedStyle.id || 'custom',
        generated_prompt: generatedPrompt,
        analysis_cost: estimatedCost
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error saving analysis session:', sessionError)
    }

    // Track prompt generation usage
    try {
      await supabase.rpc('increment_prompt_generation_usage', {
        user_uuid: product.user_id
      })
    } catch (usageError) {
      console.error('Failed to track prompt generation usage:', usageError)
      // Don't fail the request if usage tracking fails
    }

    return NextResponse.json({
      success: true,
      prompt: generatedPrompt,
      sessionId: session?.id,
      cost: estimatedCost,
      processingTime,
      usedMockData: false
    })

  } catch (error) {
    console.error('Prompt generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate prompt' },
      { status: 500 }
    )
  }
} 