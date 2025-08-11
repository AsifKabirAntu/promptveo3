'use client';

import React, { useState, useEffect } from 'react';
import { UserProduct, ENHANCED_VIDEO_STYLES, MultiSceneGenerationRequest, MultiSceneGenerationResponse } from '@/features/product-analysis/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Paywall } from '@/components/ui/paywall';
import { canUserGeneratePrompt } from '@/features/product-analysis/services/usage-api';

interface EnhancedPromptWizardProps {
  product: UserProduct;
  onClose: () => void;
}

export function EnhancedPromptWizard({ product, onClose }: EnhancedPromptWizardProps) {
  const [currentStep, setCurrentStep] = useState<'config' | 'generating' | 'result'>('config');
  const [selectedVideoStyle, setSelectedVideoStyle] = useState<string>('cinematic');
  const [selectedSceneCount, setSelectedSceneCount] = useState<number>(3);
  const [customRequirements, setCustomRequirements] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedScenes, setGeneratedScenes] = useState<MultiSceneGenerationResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [showPaywall, setShowPaywall] = useState(false);

  const sceneCountOptions = [2, 3, 4, 5, 6];
  const videoStyles = Object.values(ENHANCED_VIDEO_STYLES);

  const handleGenerate = async () => {
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
        customRequirements: customRequirements || undefined
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

  if (showPaywall) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <Paywall 
            feature="Enhanced Prompt Generation"
            description="Generate multiple scenes with professional video styles"
            onClose={() => setShowPaywall(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Enhanced Prompt Generation</h2>
              <p className="text-gray-700 mt-1">Create multi-scene video prompts with professional styles</p>
            </div>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            {currentStep === 'config' && (
              <div className="p-6 space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                {/* Product Info */}
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Product: {product.name}</h3>
                  <p className="text-sm text-gray-700">
                    Type: {product.analysis_data?.productType || 'Not analyzed'} | 
                    Features: {product.analysis_data?.features?.join(', ') || 'Not analyzed'}
                  </p>
                </Card>

                {/* Scene Count Selection */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-100">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Number of Scenes</h3>
                    <p className="text-gray-600">Each scene will be 8 seconds (Veo3 requirement)</p>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-3">
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
                          p-4 rounded-lg border-2 transition-all duration-300 text-center
                          ${selectedSceneCount === count 
                            ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200' 
                            : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                          }
                        `}>
                          <div className={`text-xl font-bold mb-1 ${
                            selectedSceneCount === count ? 'text-white' : 'text-gray-900'
                          }`}>
                            {count}
                          </div>
                          <div className={`text-xs font-medium ${
                            selectedSceneCount === count ? 'text-blue-100' : 'text-gray-600'
                          }`}>
                            {count * 8}s total
                          </div>
                          <div className={`text-xs mt-1 ${
                            selectedSceneCount === count ? 'text-blue-200' : 'text-gray-500'
                          }`}>
                            {count === 2 ? 'Quick' : 
                             count === 3 ? 'Balanced' :
                             count === 4 ? 'Detailed' :
                             count === 5 ? 'Complete' : 'Full'}
                          </div>
                        </div>
                        
                        {selectedSceneCount === count && (
                          <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs font-bold">
                            ✓
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                      Selected: <span className="font-semibold text-blue-600">{selectedSceneCount} scenes</span> 
                      {' • '}
                      <span className="font-semibold text-blue-600">{selectedSceneCount * 8} seconds</span> total
                    </p>
                  </div>
                </div>

                {/* Video Style Selection */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Video Style</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {videoStyles.map((style) => (
                      <Card
                        key={style.id}
                        className={`p-4 cursor-pointer transition-colors ${
                          selectedVideoStyle === style.id
                            ? 'ring-2 ring-blue-500 bg-blue-50'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedVideoStyle(style.id)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{style.name}</h4>
                          <Badge variant="secondary">{style.duration}s per scene</Badge>
                        </div>
                        <p className="text-sm text-gray-700 mb-3">{style.description}</p>
                        
                        <div className="space-y-2">
                          <div>
                            <span className="text-xs font-medium text-green-700">Preferred:</span>
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
                              <span className="text-xs font-medium text-red-700">Avoids:</span>
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
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Custom Requirements */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Custom Requirements (Optional)</h3>
                  <textarea
                    value={customRequirements}
                    onChange={(e) => setCustomRequirements(e.target.value)}
                    placeholder="e.g., Focus on camera system, include hands-on demonstration, emphasize premium materials..."
                    className="w-full p-3 border rounded-lg resize-none"
                    rows={3}
                  />
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerate}
                  className="w-full"
                  size="lg"
                  disabled={isGenerating}
                >
                  Generate {selectedSceneCount} Scenes in {ENHANCED_VIDEO_STYLES[selectedVideoStyle].name} Style
                </Button>
              </div>
            )}

            {currentStep === 'generating' && (
              <div className="p-6 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Enhanced Prompt Scenes</h3>
                <p className="text-gray-700">
                  Creating {selectedSceneCount} professional scenes in {ENHANCED_VIDEO_STYLES[selectedVideoStyle].name} style...
                </p>
              </div>
            )}

            {currentStep === 'result' && generatedScenes && (
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{generatedScenes.title}</h3>
                      <p className="text-gray-700">{generatedScenes.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-2">
                        {generatedScenes.videoStyle}
                      </Badge>
                      <p className="text-sm text-gray-700">{generatedScenes.totalDuration}</p>
                    </div>
                  </div>

                  <Button 
                    onClick={handleCopyAllScenes}
                    className="mb-4"
                  >
                    {copied ? 'Copied!' : 'Copy All Scenes'}
                  </Button>
                </div>

                {/* JSON Content */}
                <div className="space-y-4">
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">Generated Scene JSONs</h4>
                    <p className="text-gray-700">Complete JSON data for each scene ready to use with Veo3</p>
                  </div>
                  
                  {/* Individual Scene JSONs with complete data */}
                  <div className="space-y-3">
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
                        <Card key={scene.sequence} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900">Scene {scene.sequence} - Complete JSON</h5>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCopy(JSON.stringify(completeSceneData, null, 2))}
                            >
                              Copy Scene JSON
                            </Button>
                          </div>
                          <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-64 whitespace-pre-wrap text-gray-800 border">
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

          {/* Footer Actions */}
          {currentStep === 'result' && (
            <div className="border-t p-6">
              <div className="flex justify-between">
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
                <Button onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 