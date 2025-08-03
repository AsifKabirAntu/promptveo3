"use client"

import { useState, useEffect } from "react"
import { Heart, Search, Filter, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UnifiedPromptCard } from "@/components/unified-prompt-card"
import { PromptSideSheet } from "@/components/prompt-side-sheet"
import Link from "next/link"
import { getFavorites } from "@/lib/favorites"
import type { UnifiedPrompt } from "@/lib/favorites"

export default function FavoritesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<'all' | 'regular' | 'timeline'>('all')
  const [favoritePrompts, setFavoritePrompts] = useState<UnifiedPrompt[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPrompt, setSelectedPrompt] = useState<UnifiedPrompt | null>(null)
  const [sideSheetOpen, setSideSheetOpen] = useState(false)

  useEffect(() => {
    async function loadFavorites() {
      try {
        setLoading(true)
        const favorites = await getFavorites()
        setFavoritePrompts(favorites)
      } catch (error) {
        console.error('Error loading favorites:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()

    // Also refresh when the user focuses back on the page
    const handleFocus = () => {
      loadFavorites()
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const filteredPrompts = favoritePrompts.filter(prompt => {
    const matchesSearch = !searchQuery || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = selectedType === 'all' || prompt.type === selectedType

    return matchesSearch && matchesType
  })

  const handleViewPrompt = (prompt: UnifiedPrompt) => {
    setSelectedPrompt(prompt)
    setSideSheetOpen(true)
  }

  const handleCloseSideSheet = () => {
    setSideSheetOpen(false)
    // Delay clearing the prompt to allow animation to complete
    setTimeout(() => setSelectedPrompt(null), 300)
  }

  const refreshFavorites = async () => {
    try {
      const favorites = await getFavorites()
      setFavoritePrompts(favorites)
    } catch (error) {
      console.error('Error refreshing favorites:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                Favorite Prompts
                <Heart className="w-8 h-8 text-red-500 fill-current" />
              </h1>
              <p className="text-gray-600 mt-2">
                Your collection of saved prompts for quick access
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-6 mb-8">
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search your favorites..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg rounded-2xl bg-white shadow-sm border-gray-200 hover:border-gray-300 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Type Filter */}
          <div className="flex gap-3">
            <Button
              variant={selectedType === 'all' ? "default" : "outline"}
              onClick={() => setSelectedType('all')}
              className="rounded-full"
            >
              All Prompts
            </Button>
            <Button
              variant={selectedType === 'regular' ? "default" : "outline"}
              onClick={() => setSelectedType('regular')}
              className="rounded-full"
            >
              Regular Prompts
            </Button>
            <Button
              variant={selectedType === 'timeline' ? "default" : "outline"}
              onClick={() => setSelectedType('timeline')}
              className="rounded-full"
            >
              Timeline Prompts
            </Button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            Found {filteredPrompts.length} favorite {filteredPrompts.length === 1 ? 'prompt' : 'prompts'}
          </p>
        </div>

        {/* Prompts Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your favorites...</p>
          </div>
        ) : filteredPrompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <UnifiedPromptCard
                key={`${prompt.type}-${prompt.id}`}
                prompt={prompt}
                onViewPrompt={handleViewPrompt}
                onFavoriteToggle={refreshFavorites}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
              <Heart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Start adding prompts to your favorites from the library"}
            </p>
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-full">
                Browse Library
              </Button>
            </Link>
          </div>
        )}

        {/* Side Sheet */}
        <PromptSideSheet 
          prompt={selectedPrompt}
          open={sideSheetOpen}
          onClose={handleCloseSideSheet}
        />
      </div>
    </div>
  )
} 