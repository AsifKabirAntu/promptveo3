'use client'

import React from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StyleTemplate } from '../../types'
import { 
  Sparkles, 
  Play, 
  Camera, 
  Lightbulb, 
  Zap, 
  Eye,
  Check
} from 'lucide-react'

interface StyleTemplatePreviewProps {
  template: StyleTemplate
  isSelected?: boolean
  onSelect?: () => void
  onPreview?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export function StyleTemplatePreview({
  template,
  isSelected = false,
  onSelect,
  onPreview,
  size = 'md'
}: StyleTemplatePreviewProps) {
  const templateData = template.template_data as Record<string, any>

  const getAttributeIcon = (key: string) => {
    switch (key) {
      case 'camera': return <Camera className="w-3 h-3 text-blue-600" />
      case 'lighting': return <Lightbulb className="w-3 h-3 text-amber-500" />
      case 'effects': return <Zap className="w-3 h-3 text-purple-500" />
      case 'motion': return <Sparkles className="w-3 h-3 text-green-500" />
      default: return <Eye className="w-3 h-3 text-gray-500" />
    }
  }

  // Compact layout for modal use
  if (size === 'sm' || size === 'md') {
    return (
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected 
            ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
            : 'hover:border-gray-300'
        } p-3`}
        onClick={onSelect}
      >
        <div className="flex gap-3">
          {/* Left side: Image and selection status */}
          <div className="relative flex-shrink-0" style={{ width: '80px' }}>
            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute -top-1 -left-1 z-10 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
            
            {/* Preview image */}
            {template.preview_image_url ? (
              <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 shadow-sm">
                <img 
                  src={template.preview_image_url} 
                  alt={`${template.name} preview`}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center shadow-sm">
                <div className="text-center">
                  <Sparkles className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                  <p className="text-xs text-blue-500 font-medium">{template.name}</p>
                </div>
              </div>
            )}
            
            {/* Active status badge */}
            {template.is_active && (
              <div className="absolute top-1 right-1">
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 px-1 py-0">
                  <div className="w-1 h-1 bg-green-500 rounded-full mr-1" />
                  Active
                </Badge>
              </div>
            )}
          </div>
          
          {/* Right side: Content */}
          <div className="flex-1 flex flex-col justify-between">
            {/* Header */}
            <div>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#000000' }}>
                {template.name}
              </h3>
              <p className="text-xs mb-2" style={{ color: '#1d4ed8' }}>
                {template.description}
              </p>
              
              {/* Attributes grid - compact */}
              <div className="grid grid-cols-2 gap-y-1 gap-x-2 mb-2">
                {Object.entries(templateData).slice(0, 4).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-1">
                    {getAttributeIcon(key)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium capitalize" style={{ color: '#1d4ed8' }}>{key}</p>
                      <p className="text-xs truncate" style={{ color: '#000000' }}>{String(value)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-auto">
              <Button
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect?.()
                }}
                className={isSelected ? "bg-blue-600 hover:bg-blue-700 px-3 h-7 text-xs" : "px-3 h-7 text-xs"}
              >
                {isSelected ? "Selected" : "Select"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  // Original layout for larger sizes
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected 
          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
          : 'hover:border-gray-300'
      } p-4`}
      onClick={onSelect}
    >
      <div className="flex gap-4">
        {/* Left side: Image and selection status */}
        <div className="relative flex-shrink-0" style={{ width: '160px' }}>
          {/* Selection indicator */}
          {isSelected && (
            <div className="absolute -top-2 -left-2 z-10 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
              <Check className="w-5 h-5 text-white" />
            </div>
          )}
          
          {/* Preview image */}
          {template.preview_image_url ? (
            <div className="aspect-video rounded-lg overflow-hidden bg-gray-100 shadow-sm">
              <img 
                src={template.preview_image_url} 
                alt={`${template.name} preview`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center shadow-sm">
              <div className="text-center">
                <Sparkles className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <p className="text-xs text-blue-500 font-medium">{template.name}</p>
              </div>
            </div>
          )}
          
          {/* Active status badge */}
          {template.is_active && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 px-2 py-0.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1" />
                Active
              </Badge>
            </div>
          )}
        </div>
        
        {/* Right side: Content */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Header */}
          <div>
            <h3 className="text-lg font-semibold mb-1" style={{ color: '#000000' }}>
              {template.name}
            </h3>
            <p className="text-sm mb-3" style={{ color: '#1d4ed8' }}>
              {template.description}
            </p>
            
            {/* Attributes grid */}
            <div className="grid grid-cols-2 gap-y-2 gap-x-4 mb-4">
              {Object.entries(templateData).slice(0, 4).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2">
                  {getAttributeIcon(key)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium capitalize" style={{ color: '#1d4ed8' }}>{key}</p>
                    <p className="text-sm truncate" style={{ color: '#000000' }}>{String(value)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-3 mt-auto">
            <Button
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onSelect?.()
              }}
              className={isSelected ? "bg-blue-600 hover:bg-blue-700 px-6" : "px-6"}
            >
              {isSelected ? "Selected" : "Select Style"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

// Gallery component for displaying multiple templates
interface StyleTemplateGalleryProps {
  templates: StyleTemplate[]
  selectedId?: string
  onSelect: (template: StyleTemplate) => void
  onPreview?: (template: StyleTemplate) => void
  columns?: 1 | 2 | 3 | 4
  size?: 'sm' | 'md' | 'lg'
}

export function StyleTemplateGallery({
  templates,
  selectedId,
  onSelect,
  onPreview,
  columns = 2,
  size = 'md'
}: StyleTemplateGalleryProps) {
  return (
    <div className={size === 'sm' || size === 'md' ? 'grid gap-2' : 'grid gap-4'}>
      {templates.map((template) => (
        <StyleTemplatePreview
          key={template.id}
          template={template}
          isSelected={selectedId === template.id}
          onSelect={() => onSelect(template)}
          onPreview={() => onPreview?.(template)}
          size={size}
        />
      ))}
    </div>
  )
} 