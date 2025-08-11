# Enhanced Prompt Generation System

## Overview

The Enhanced Prompt Generation system brings **professional multi-scene video creation** to PromptVeo3, allowing users to create professional-quality video prompts with multiple 8-second scenes using advanced style systems.

## Key Features

### 🎬 Multi-Scene Generation
- Generate **2-6 scenes** per video (each 8 seconds for Veo3 compatibility)
- Professional scene progression and storytelling
- Smart camera work and lighting transitions

### 🎨 Advanced Video Styles
- **Cinematic**: Professional film-style with dramatic composition
- **AI Vlogs**: Casual, authentic vlog-style content with vibrant feel
- **ASMR**: Calming, intimate, detail-focused content
- **Product Review**: Clean, authoritative product analysis
- **Lifestyle**: Natural product use in real-world scenarios
- **Social Content**: Vibrant, engaging social media content

### 🔧 Smart Style System
- **Style Preferences**: Each style has preferred lighting, camera angles, and movements
- **Avoidance Rules**: Styles automatically avoid incompatible techniques
- **Auto-Selection**: Backend intelligently chooses camera work and lighting
- **Consistency Enforcement**: Maintains visual consistency across all scenes

### ✅ Quality Validation & Auto-Fixing
- **Real-time Validation**: Checks scene quality and style compliance
- **Auto-Fix System**: Automatically corrects common issues
- **Quality Scoring**: 0-100 quality score for generated scenes
- **Consistency Checks**: Ensures character, voice, and visual consistency

## 🎭 **Hyper-Detailed Character & Product Consistency**

### **Character Consistency System**
Our enhanced system generates **comprehensive character descriptions** including:

#### **Facial Features**
- Face shape based on ethnicity and gender
- Detailed eye characteristics (color, shape, lashes)
- Nose shape, lip shape, jawline definition
- Skin tone with undertones and texture

#### **Physical Characteristics**
- Height, build, and posture details
- Hair texture, color, and styling specific to ethnicity
- Age-appropriate appearance markers

#### **Clothing & Accessories**
- Complete outfit descriptions with specific colors and styles
- Accessories matched to personality and style
- Professional, casual, trendy, minimalist, or creative looks

#### **Example Character Description**
```
28-35-year-old female with oval face shape, large blue eyes with long eyelashes, 
straight nose, full lips, soft jawline, naturally straight to wavy brown hair 
styled in loose waves ending just below shoulders, fair skin with warm undertones, 
average height with healthy average build, wearing a soft heather gray fitted 
t-shirt with medium-wash slim-fit jeans and clean white canvas sneakers, small 
hoop earrings and a simple crossbody bag in tan leather. Maintains consistent 
appearance and confident enthusiastic demeanor throughout all scenes.
```

### **Product Consistency System**
Generates **detailed product specifications** from analysis data:

#### **Physical Specifications**
- Exact color descriptions from dominant color analysis
- Material construction details
- Size and dimension specifications
- Condition and wear markers

#### **Brand & Feature Details**
- Specific feature callouts from product analysis
- Branding and labeling visibility requirements
- Consistent positioning instructions

#### **Example Product Description**
```
iPhone 15 Pro in Deep Purple with titanium construction, standard smartphone 
dimensions, pristine condition, featuring advanced camera system, Action Button, 
titanium build, with consistent branding and labeling visible, maintains exact 
same appearance and positioning throughout all scenes.
```

### **Environment Variation Strategy**
While **character and product remain identical**, environments change contextually:

- **Scene 1**: Minimalist studio for product introduction
- **Scene 2**: Cozy home kitchen for daily use demonstration  
- **Scene 3**: Outdoor park setting for lifestyle integration

This approach provides **visual variety** while maintaining **consistency** where it matters most.

## Technical Architecture

### API Endpoints

#### Multi-Scene Generation
```typescript
POST /api/product-analysis/generate-prompt

Request:
{
  productId: string;
  videoStyle: string;
  sceneCount: number; // 2-6
  customRequirements?: string;
  generationType: 'multi-scene';
}

Response:
{
  success: boolean;
  title: string;
  description: string;
  videoStyle: string;
  totalDuration: string; // "24 seconds" for 3 scenes
  scenes: EnhancedSceneParameters[];
  metadata: {
    qualityScore: number;
    validation: ValidationResult;
    stylePreferences: StylePreferences;
  }
}
```

### Scene Parameters (17 Total)

Each scene includes these comprehensive parameters:

```typescript
interface EnhancedSceneParameters {
  sceneNumber: number;
  duration: "8 seconds"; // Fixed for Veo3
  
  // Environment & Lighting
  environment: string;
  lighting: string;
  timeOfDay?: string;
  
  // Camera Work
  cameraSetup: string;
  cameraMovement: string;
  
  // Visual Style
  visualStyle: string;
  colorGrading: string;
  
  // Product Interaction
  productAction: string;
  productPlacement: string;
  
  // Audio
  ambientAudio: string;
  audioLayers: string;
  
  // Technical
  subtitlePrevention: boolean;
  physicsRealism: boolean;
  handAccuracy: string;
  
  // Scene Content
  storyDescription: string;
  
  // Optional Character (for demos)
  characterReference?: string;
  voiceCharacteristics?: string;
}
```

### Style System

#### Style Configuration
```typescript
interface EnhancedVideoStyle {
  id: string;
  name: string;
  description: string;
  duration: 8; // seconds per scene
  preferences: {
    lighting: string[];
    camera: string[];
    movement: string[];
    colorGrading: string[];
    environment: string[];
  };
  avoid?: {
    lighting?: string[];
    movement?: string[];
    colorGrading?: string[];
  };
}
```

#### Example: Cinematic Style
```typescript
'cinematic': {
  name: 'Cinematic Product Reveal',
  description: 'Professional film-style with dramatic composition',
  preferences: {
    lighting: ['dramatic-cinematic', 'low-key-moody', 'soft-diffused'],
    camera: ['close-up', 'medium-shot', 'extreme-close-up'],
    movement: ['smooth-tracking', 'dolly-zoom', 'orbit-360'],
    colorGrading: ['cinematic-teal', 'desaturated-moody']
  },
  avoid: {
    lighting: ['artificial-indoor', 'harsh-direct'],
    movement: ['handheld', 'shaky']
  }
}
```

## User Experience

### Enhanced Prompt Wizard

1. **Product Selection**: Choose uploaded product
2. **Scene Configuration**: Select 2-6 scenes (each 8 seconds)
3. **Style Selection**: Choose from 6 professional video styles
4. **Custom Requirements**: Optional specific instructions
5. **Generation**: AI creates style-appropriate scenes
6. **Review & Copy**: View detailed scenes with copy functionality

### Example Output

For a 3-scene cinematic iPhone video:

```
🎬 iPhone 15 Pro - Cinematic Product Reveal
📱 Professional cinematic showcase in 24 seconds

Scene 1 (8 seconds):
Extreme close-up of iPhone 15 Pro emerging from complete darkness, dramatic cinematic lighting with soft shadows, camera performs smooth 360-degree orbit revealing titanium finish

Camera: close-up with smooth-tracking
Lighting: dramatic-cinematic
Environment: minimalist-studio
Product Action: rotating slowly to reveal design
Visual Style: cinematic-dramatic
Color Grading: cinematic-teal

Scene 2 (8 seconds):
Medium shot of hands in white gloves carefully demonstrating camera system, soft diffused lighting, camera tilts up following the device movement

Scene 3 (8 seconds):
Final hero shot in professional setup, device floating with subtle breathing motion, dramatic lighting emphasizes premium materials, camera holds static for impact
```