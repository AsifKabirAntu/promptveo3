"use client"

import { useState, useRef } from 'react'
import { X, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ProductUploadForm, SUPPORTED_IMAGE_FORMATS, MAX_IMAGE_SIZE } from '../../types'
import { uploadProduct } from '../../services/api'
import { toast } from 'sonner'

interface ProductUploadModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

export function ProductUploadModal({ open, onClose, onSuccess }: ProductUploadModalProps) {
  const [formData, setFormData] = useState<ProductUploadForm>({
    name: '',
    category: 'Uncategorized',
    file: null
  })
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Function to create compressed preview thumbnail
  const createCompressedPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      
      img.onload = () => {
        // Set target dimensions (max 300px width/height while maintaining aspect ratio)
        const maxSize = 300
        let { width, height } = img
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height
            height = maxSize
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.8)) // 80% quality
      }
      
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!SUPPORTED_IMAGE_FORMATS.includes(file.type as any)) {
      toast.error('Please select a valid image file (JPEG, PNG, or WebP)')
      return
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error('File size must be less than 10MB')
      return
    }

    setFormData(prev => ({ ...prev, file }))
    
    // Create compressed preview
    try {
      const compressedPreview = await createCompressedPreview(file)
      setPreview(compressedPreview)
    } catch (error) {
      console.error('Error creating preview:', error)
      // Fallback to original if compression fails
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }

    // Auto-set product name from filename if empty
    if (!formData.name) {
      const nameWithoutExt = file.name.split('.').slice(0, -1).join('.')
      setFormData(prev => ({ ...prev, name: nameWithoutExt }))
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      await handleFileSelect(files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.file || !formData.name) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setUploading(true)
      await uploadProduct(formData, formData.file)
      toast.success('Product uploaded successfully!')
      onSuccess()
      handleReset()
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload product. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleReset = () => {
    setFormData({ name: '', category: 'Uncategorized', file: null })
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white shadow-2xl">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-gray-900">
              Upload Product
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-gray-600">
            Upload a product image to start creating PromptVeo3 AI-powered reveal videos
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                dragOver
                  ? 'border-blue-400 bg-blue-50'
                  : formData.file
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 bg-gray-50 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
            >
              {preview ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={preview}
                      alt="Preview"
                      className="max-h-48 max-w-full rounded-lg shadow-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute -top-2 -right-2 bg-white"
                      onClick={() => {
                        setPreview(null)
                        setFormData(prev => ({ ...prev, file: null }))
                        if (fileInputRef.current) fileInputRef.current.value = ''
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {formData.file && (
                    <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                      <Badge variant="outline" className="bg-white">
                        {formData.file.type.split('/')[1].toUpperCase()}
                      </Badge>
                      <span>{formatFileSize(formData.file.size)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <ImageIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900 mb-1">
                      Drop your image here, or{' '}
                      <button
                        type="button"
                        className="text-blue-600 hover:text-blue-700 underline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        browse
                      </button>
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports JPEG, PNG, WebP up to 10MB
                    </p>
                  </div>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept={SUPPORTED_IMAGE_FORMATS.join(',')}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) await handleFileSelect(file)
                }}
                className="hidden"
              />
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Product Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter product name"
                  className="bg-white"
                  required
                />
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">PromptVeo3 Analysis</p>
                  <p>
                    After uploading, our AI will analyze your product image to understand its features, 
                    colors, and characteristics. This helps generate better reveal video prompts.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!formData.file || !formData.name || uploading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Product
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 