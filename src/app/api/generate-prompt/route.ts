import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const { userRequest, conversationHistory } = await request.json()

    if (!userRequest) {
      return NextResponse.json(
        { error: 'User request is required' },
        { status: 400 }
      )
    }

    // Read the VEO3 Meta Framework Guide
    let veo3Framework = ''
    try {
      const frameworkPath = join(process.cwd(), 'VEO3_META_FRAMEWORK_GUIDE.md')
      veo3Framework = await readFile(frameworkPath, 'utf-8')
    } catch (error) {
      console.error('Error reading VEO3 framework document:', error)
      return NextResponse.json(
        { error: 'Framework document not found' },
        { status: 500 }
      )
    }

    // Check for OpenRouter API key
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      )
    }

    // Prepare conversation context
    const contextMessages = conversationHistory.map((msg: any) => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    }))

    // Create the system prompt with the framework
    const systemPrompt = `You are a professional Veo 3 prompt generation expert with access to the complete VEO3 Meta Framework Guide. Your task is to analyze user requests and generate professional, high-quality Veo 3 prompts using the comprehensive framework provided below.

## VEO3 META FRAMEWORK GUIDE:
${veo3Framework}

## YOUR ROLE:
- Analyze the user's video idea/request thoroughly
- Apply the 6-Layer Cognitive Framework from the guide
- Use the 4-Phase Systematic Methodology
- Generate a complete, professional Veo 3 prompt following the 7-Component Format
- Ensure all advanced techniques are properly implemented

## RESPONSE FORMAT:
You must respond with a JSON object containing:
1. "explanation" - A brief explanation of how you analyzed their request and what approach you took
2. "prompt" - The complete generated Veo 3 prompt object with the following structure:

{
  "explanation": "Brief explanation of your analysis and approach",
  "prompt": {
    "title": "Descriptive title for the prompt",
    "category": "Corporate/Educational/Social Media/Creative",
    "platform": "Target platform (LinkedIn, TikTok, YouTube, etc.)",
    "duration": "Recommended duration",
    "aspectRatio": "16:9, 9:16, or 1:1",
    "character": {
      "name": "Character name",
      "age": "Age range",
      "appearance": "Detailed 15+ attribute description",
      "wardrobe": "Clothing and styling details",
      "personality": "Personality traits and demeanor"
    },
    "environment": {
      "setting": "Location/setting description",
      "lighting": "Lighting specifications",
      "background": "Background elements",
      "atmosphere": "Mood and atmosphere"
    },
    "cinematography": {
      "cameraPosition": "Using '(thats where the camera is: ...)' syntax",
      "shotType": "Close-up, medium, wide, etc.",
      "movement": "Camera movement specifications",
      "composition": "Visual composition details"
    },
    "action": {
      "primaryActions": "Main character actions",
      "secondaryMovements": "Gestures and expressions",
      "physicsConsiderations": "Natural movement specifications"
    },
    "dialogue": {
      "spokenContent": "Using 'Character: dialogue' format",
      "voiceCharacteristics": "Voice tone, pace, emotion",
      "audioIntegration": "Background audio specifications"
    },
    "technicalSpecs": {
      "resolution": "4K, HD, etc.",
      "quality": "Quality requirements",
      "duration": "Specific duration",
      "format": "Platform-specific format"
    },
    "qualityControl": {
      "negativePrompts": "List of things to avoid",
      "brandCompliance": "Brand guideline considerations",
      "safetyProtocols": "Content safety measures"
    },
    "fullPrompt": "The complete, ready-to-use Veo 3 prompt text combining all elements above in professional format"
  }
}

## IMPORTANT GUIDELINES:
- Always use the "(thats where the camera is: ...)" syntax for camera positioning
- Include the colon syntax for dialogue: "Character: 'spoken content'"
- Apply physics-aware prompting for natural movement
- Include comprehensive negative prompts for quality control
- Ensure platform-specific optimizations
- Maintain character consistency with 15+ attributes
- Follow the professional 7-component structure exactly
- Generate the fullPrompt as a cohesive, professional Veo 3 prompt ready for direct use

## CRITICAL OUTPUT REQUIREMENT:
You MUST respond with ONLY the JSON object specified above. Do NOT include:
- Any introduction text before the JSON
- Any explanation text after the JSON  
- Any markdown formatting around the JSON
- Any additional commentary or notes
- Any text that is not part of the structured JSON response

Your response must start with { and end with } - nothing else.

Analyze the user's request and generate a complete, professional response following this format exactly.`

    // Call OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        'X-Title': 'PromptVeo3 - Veo 3 Prompt Generator',
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...contextMessages,
          { role: 'user', content: userRequest }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('OpenRouter API error:', errorData)
      return NextResponse.json(
        { error: 'Failed to generate prompt' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const assistantMessage = data.choices[0]?.message?.content

    if (!assistantMessage) {
      return NextResponse.json(
        { error: 'No response from AI' },
        { status: 500 }
      )
    }

    // Parse the JSON response from GPT
    try {
      const parsedResponse = JSON.parse(assistantMessage)
      return NextResponse.json(parsedResponse)
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError)
      console.log('Raw AI response:', assistantMessage)
      
      // Fallback response if JSON parsing fails
      return NextResponse.json({
        explanation: "Generated a professional Veo 3 prompt based on your request using the complete meta framework.",
        prompt: {
          title: "Generated Veo 3 Prompt",
          category: "General",
          fullPrompt: assistantMessage,
          rawResponse: assistantMessage
        }
      })
    }

  } catch (error) {
    console.error('Error in generate-prompt API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 