'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { UserProduct, ENHANCED_VIDEO_STYLES, MultiSceneGenerationRequest, MultiSceneGenerationResponse, CharacterOptions, DEFAULT_CHARACTER_OPTIONS } from '@/features/product-analysis/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Paywall } from '@/components/ui/paywall';
import { canUserGeneratePrompt } from '@/features/product-analysis/services/usage-api';
import { createClient } from '@/lib/supabase-browser';
import { getSignedUrl } from '@/features/product-analysis/services/api';

interface PageParams {
  id: string;
}

// Helper function to get a single product by ID
async function getProductById(productId: string): Promise<UserProduct> {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    throw new Error('Authentication required. Please sign in to view products.');
  }

  const { data, error } = await supabase
    .from('user_products')
    .select('*')
    .eq('id', productId)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;

  // Refresh signed URL if filePath exists
  try {
    const filePath = data.image_metadata?.filePath;
    if (filePath) {
      const signedUrl = await getSignedUrl(filePath);
      return { ...data, image_url: signedUrl } as UserProduct;
    }
    return data as UserProduct;
  } catch (error) {
    console.error(`Error refreshing URL for product ${productId}:`, error);
    return data as UserProduct;
  }
}

export default function EnhancedGeneratePage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;
  
  const [product, setProduct] = useState<UserProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<'config' | 'generating' | 'result'>('config');
  const [selectedVideoStyle, setSelectedVideoStyle] = useState<string>('cinematic');
  const [selectedSceneCount, setSelectedSceneCount] = useState<number>(3);
  const [customRequirements, setCustomRequirements] = useState<string>('');
  const [characterOptions, setCharacterOptions] = useState<CharacterOptions>(DEFAULT_CHARACTER_OPTIONS);
  const [includeCharacterInPrompt, setIncludeCharacterInPrompt] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScenes, setGeneratedScenes] = useState<MultiSceneGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [showPaywall, setShowPaywall] = useState(false);

  const sceneCountOptions = [2, 3, 4, 5, 6];
  const videoStyles = Object.values(ENHANCED_VIDEO_STYLES);

  // Check if AI Vlog style is selected
  const isAIVlogStyle = selectedVideoStyle === 'ai-vlogs';

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(productId);
        setProduct(productData);
      } catch (error) {
        console.error('Error loading product:', error);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const handleGenerate = async () => {
    if (!product) return;

    // Check if user can generate prompts
    const canGenerate = await canUserGeneratePrompt();
    if (!canGenerate) {
      setShowPaywall(true);
      return;
    }

    setCurrentStep('generating');
    setIsGenerating(true);
    setError(null);

    try {
      const request: MultiSceneGenerationRequest = {
        productId: product.id,
        videoStyle: selectedVideoStyle,
        sceneCount: selectedSceneCount,
        customRequirements: customRequirements || undefined,
        characterOptions: isAIVlogStyle && includeCharacterInPrompt ? characterOptions : undefined
      };

      const response = await fetch('/api/product-analysis/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...request,
          generationType: 'multi-scene'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate scenes');
      }

      const result: MultiSceneGenerationResponse = await response.json();
      setGeneratedScenes(result);
      setCurrentStep('result');
    } catch (error) {
      console.error('Scene generation error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate scenes');
      setCurrentStep('config');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const handleCopyAllScenes = async () => {
    if (!generatedScenes) return;
    
    const allScenesText = generatedScenes.timeline.map((scene, index) => 
      `Scene ${index + 1} (8 seconds):
${scene.action}

Dialogue: ${scene.dialogue}
Sounds: ${scene.sounds}
Negative Prompt: ${scene.negativePrompt}
Product: ${scene.productDescription}
Timestamp: ${scene.timestamp}

---`
    ).join('\n\n');

    const fullPrompt = `${generatedScenes.title}

${generatedScenes.description}

Video Style: ${generatedScenes.videoStyle}
Total Duration: ${generatedScenes.totalDuration}

SCENES:
${allScenesText}`;

    await handleCopy(fullPrompt);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded mb-8 w-1/2"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-700 mb-6">The product you're looking for could not be found.</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (showPaywall) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Paywall 
          feature="Enhanced Prompt Generation"
          description="Generate multiple scenes with professional video styles"
          onClose={() => setShowPaywall(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
        <button 
          onClick={() => router.push('/dashboard/products')}
          className="hover:text-gray-900"
        >
          Products
        </button>
        <span>/</span>
        <button 
          onClick={() => router.push(`/dashboard/products/${product.id}`)}
          className="hover:text-gray-900"
        >
          {product.name}
        </button>
        <span>/</span>
        <span className="text-gray-900 font-medium">Enhanced Prompt Generation</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Enhanced Prompt Generation</h1>
        <p className="text-lg text-gray-700">Create professional multi-scene video prompts with advanced styles</p>
      </div>

      {/* Content */}
      {currentStep === 'config' && (
        <div className="space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Product Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Product: {product.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <p className="text-gray-700">{product.analysis_data?.productType || 'Not analyzed'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Features:</span>
                <p className="text-gray-700">{product.analysis_data?.features?.join(', ') || 'Not analyzed'}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Colors:</span>
                <p className="text-gray-700">{product.analysis_data?.dominantColors?.join(', ') || 'Not specified'}</p>
              </div>
            </div>
          </Card>

          {/* Scene Count Selection */}
          <Card className="p-8 bg-white border-2 border-gray-100">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Number of Scenes</h2>
              <p className="text-gray-600">Each scene will be 8 seconds (Veo3 requirement)</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
              {sceneCountOptions.map((count) => (
                <div
                  key={count}
                  className={`relative group cursor-pointer transition-all duration-300 ${
                    selectedSceneCount === count 
                      ? 'transform scale-105' 
                      : 'hover:transform hover:scale-102'
                  }`}
                  onClick={() => setSelectedSceneCount(count)}
                >
                  <div className={`
                    p-6 rounded-xl border-2 transition-all duration-300 text-center
                    ${selectedSceneCount === count 
                      ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200' 
                      : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                    }
                  `}>
                    <div className={`text-3xl font-bold mb-2 ${
                      selectedSceneCount === count ? 'text-white' : 'text-gray-900'
                    }`}>
                      {count}
                    </div>
                    <div className={`text-sm font-medium ${
                      selectedSceneCount === count ? 'text-blue-100' : 'text-gray-600'
                    }`}>
                      {count * 8}s total
                    </div>
                    <div className={`text-xs mt-1 ${
                      selectedSceneCount === count ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {count === 2 ? 'Quick demo' : 
                       count === 3 ? 'Balanced' :
                       count === 4 ? 'Detailed' :
                       count === 5 ? 'Complete' : 'Comprehensive'}
                    </div>
                  </div>
                  
                  {selectedSceneCount === count && (
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      ✓
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Selected: <span className="font-semibold text-blue-600">{selectedSceneCount} scenes</span> 
                {' • '}
                <span className="font-semibold text-blue-600">{selectedSceneCount * 8} seconds</span> total duration
              </p>
            </div>
          </Card>

          {/* Video Style Selection */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Video Style</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videoStyles.map((style) => (
                <div
                  key={style.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedVideoStyle === style.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedVideoStyle(style.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-lg text-gray-900">{style.name}</h3>
                    <Badge variant="secondary">{style.duration}s per scene</Badge>
                  </div>
                  <p className="text-gray-700 mb-4">{style.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-green-700">Preferred:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {style.preferences.lighting.slice(0, 2).map((pref) => (
                          <Badge key={pref} variant="outline" className="text-xs">
                            {pref}
                          </Badge>
                        ))}
                        {style.preferences.movement.slice(0, 2).map((pref) => (
                          <Badge key={pref} variant="outline" className="text-xs">
                            {pref}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    {style.avoid && (
                      <div>
                        <span className="text-sm font-medium text-red-700">Avoids:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Object.values(style.avoid).flat().slice(0, 2).map((avoid) => (
                            <Badge key={avoid} variant="outline" className="text-xs text-red-600">
                              {avoid}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Custom Requirements */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Custom Requirements (Optional)</h2>
            <textarea
              value={customRequirements}
              onChange={(e) => setCustomRequirements(e.target.value)}
              placeholder="e.g., Focus on camera system, include hands-on demonstration, emphasize premium materials..."
              className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
            />
          </Card>

          {/* Character Selection for AI Vlog Style */}
          {isAIVlogStyle && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Content Creator Character</h2>
                  <p className="text-gray-700 mt-1">Customize the AI vlogger appearance for consistent character across all scenes</p>
                </div>
                <div className="flex items-center space-x-3">
                  <label className="text-sm font-medium text-gray-700">Include in prompt:</label>
                  <button
                    onClick={() => setIncludeCharacterInPrompt(!includeCharacterInPrompt)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      includeCharacterInPrompt ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        includeCharacterInPrompt ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              {includeCharacterInPrompt ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <select 
                      value={characterOptions.gender} 
                      onChange={(e) => setCharacterOptions({...characterOptions, gender: e.target.value as any})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      <option value="female" className="text-gray-900">Female</option>
                      <option value="male" className="text-gray-900">Male</option>
                      <option value="non-binary" className="text-gray-900">Non-binary</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ethnicity</label>
                    <select 
                      value={characterOptions.ethnicity} 
                      onChange={(e) => setCharacterOptions({...characterOptions, ethnicity: e.target.value as any})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      <option value="caucasian" className="text-gray-900">Caucasian</option>
                      <option value="african-american" className="text-gray-900">African American</option>
                      <option value="hispanic" className="text-gray-900">Hispanic</option>
                      <option value="asian" className="text-gray-900">Asian</option>
                      <option value="middle-eastern" className="text-gray-900">Middle Eastern</option>
                      <option value="mixed" className="text-gray-900">Mixed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                    <select 
                      value={characterOptions.age} 
                      onChange={(e) => setCharacterOptions({...characterOptions, age: e.target.value as any})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      <option value="young-adult" className="text-gray-900">Young Adult (18-25)</option>
                      <option value="adult" className="text-gray-900">Adult (26-35)</option>
                      <option value="middle-aged" className="text-gray-900">Middle Aged (36-50)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Build</label>
                    <select 
                      value={characterOptions.build} 
                      onChange={(e) => setCharacterOptions({...characterOptions, build: e.target.value as any})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      <option value="slim" className="text-gray-900">Slim</option>
                      <option value="average" className="text-gray-900">Average</option>
                      <option value="athletic" className="text-gray-900">Athletic</option>
                      <option value="plus-size" className="text-gray-900">Plus Size</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hair Color</label>
                    <select 
                      value={characterOptions.hairColor} 
                      onChange={(e) => setCharacterOptions({...characterOptions, hairColor: e.target.value as any})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      <option value="brown" className="text-gray-900">Brown</option>
                      <option value="black" className="text-gray-900">Black</option>
                      <option value="blonde" className="text-gray-900">Blonde</option>
                      <option value="red" className="text-gray-900">Red</option>
                      <option value="gray" className="text-gray-900">Gray</option>
                      <option value="colorful" className="text-gray-900">Colorful</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Personality</label>
                    <select 
                      value={characterOptions.personality} 
                      onChange={(e) => setCharacterOptions({...characterOptions, personality: e.target.value as any})}
                      className="w-full p-2 border border-gray-300 rounded-lg text-gray-900"
                    >
                      <option value="enthusiastic" className="text-gray-900">Enthusiastic</option>
                      <option value="professional" className="text-gray-900">Professional</option>
                      <option value="friendly" className="text-gray-900">Friendly</option>
                      <option value="energetic" className="text-gray-900">Energetic</option>
                      <option value="calm" className="text-gray-900">Calm</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-gray-700 text-center">
                    Character description disabled. The AI will generate generic character references.
                  </p>
                </div>
              )}
            </Card>
          )}

          {/* Generate Button */}
          <div className="flex justify-between items-center">
            <Button 
              variant="outline"
              onClick={() => router.back()}
            >
              Back to Product
            </Button>
            
            <Button 
              onClick={handleGenerate}
              className="px-8 py-3"
              size="lg"
              disabled={isGenerating}
            >
              Generate {selectedSceneCount} Scenes in {ENHANCED_VIDEO_STYLES[selectedVideoStyle].name} Style
            </Button>
          </div>
        </div>
      )}

      {currentStep === 'generating' && (
        <div className="text-center py-16">
          <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-6"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Generating Enhanced Prompt Scenes</h2>
          <p className="text-gray-700 text-lg">
            Creating {selectedSceneCount} professional scenes in {ENHANCED_VIDEO_STYLES[selectedVideoStyle].name} style...
          </p>
        </div>
      )}

      {currentStep === 'result' && generatedScenes && (
        <div className="space-y-8">
          {/* Result Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{generatedScenes.title}</h2>
              <p className="text-gray-700 mt-1">{generatedScenes.description}</p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-2">
                {generatedScenes.videoStyle}
              </Badge>
              <p className="text-sm text-gray-700">{generatedScenes.totalDuration}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={handleCopyAllScenes}
            >
              {copied ? 'Copied!' : 'Copy All Scenes'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setCurrentStep('config');
                setGeneratedScenes(null);
                setError(null);
              }}
            >
              Generate New Scenes
            </Button>
            <Button 
              variant="outline"
              onClick={() => router.back()}
            >
              Back to Product
            </Button>
          </div>

          {/* JSON Content */}
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Generated Scene JSONs</h3>
              <p className="text-gray-700">Complete JSON data for each scene ready to use with Veo3</p>
            </div>
            
            {/* Individual Scene JSONs with complete data */}
            <div className="space-y-4">
              {generatedScenes.timeline.map((scene, index) => {
                // Merge timeline data with enhanced technical data
                const completeSceneData = {
                  // Timeline data
                  sequence: scene.sequence,
                  timestamp: scene.timestamp,
                  action: scene.action,
                  dialogue: scene.dialogue || 'No dialogue generated',
                  sounds: scene.sounds || 'No sounds generated',
                  negativePrompt: scene.negativePrompt || 'No negative prompt generated',
                  productDescription: scene.productDescription || 'No product description generated',
                  
                  // Enhanced technical data (if available)
                  ...(generatedScenes.enhancedScenes && generatedScenes.enhancedScenes[index] ? {
                    environment: generatedScenes.enhancedScenes[index].environment,
                    lighting: generatedScenes.enhancedScenes[index].lighting,
                    cameraSetup: generatedScenes.enhancedScenes[index].cameraSetup,
                    cameraMovement: generatedScenes.enhancedScenes[index].cameraMovement,
                    visualStyle: generatedScenes.enhancedScenes[index].visualStyle,
                    colorGrading: generatedScenes.enhancedScenes[index].colorGrading,
                    productAction: generatedScenes.enhancedScenes[index].productAction,
                    productPlacement: generatedScenes.enhancedScenes[index].productPlacement,
                    physicsRealism: generatedScenes.enhancedScenes[index].physicsRealism,
                    handAccuracy: generatedScenes.enhancedScenes[index].handAccuracy,

                    ...(generatedScenes.enhancedScenes[index].voiceCharacteristics && {
                      voiceCharacteristics: generatedScenes.enhancedScenes[index].voiceCharacteristics
                    }),
                    ...(generatedScenes.enhancedScenes[index].subtitlePrevention !== undefined && {
                      subtitlePrevention: generatedScenes.enhancedScenes[index].subtitlePrevention
                    })
                  } : {})
                };

                return (
                  <Card key={scene.sequence} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900">Scene {scene.sequence} - Complete JSON</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(JSON.stringify(completeSceneData, null, 2))}
                      >
                        Copy Scene JSON
                      </Button>
                    </div>
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-auto max-h-96 whitespace-pre-wrap text-gray-800 border">
                      {JSON.stringify(completeSceneData, null, 2)}
                    </pre>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 