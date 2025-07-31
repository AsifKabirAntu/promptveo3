"use client"

import { useState, useEffect } from "react"
import { Search, Plus, FileText, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { getUserPrompts, deleteUserPrompt, type UserPrompt } from "@/lib/user-prompts-client"

export default function MyPromptsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<'all' | 'regular' | 'timeline'>('all')
  const [userPrompts, setUserPrompts] = useState<UserPrompt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUserPrompts() {
      try {
        setLoading(true)
        const prompts = await getUserPrompts()
        setUserPrompts(prompts)
      } catch (error) {
        console.error('Error loading user prompts:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserPrompts()
  }, [])

  const filteredPrompts = userPrompts.filter((prompt: UserPrompt) => {
    const matchesSearch = !searchQuery || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = selectedType === 'all' || prompt.prompt_type === selectedType

    return matchesSearch && matchesType
  })

  const handleDelete = async (promptId: string) => {
    if (confirm("Are you sure you want to delete this prompt?")) {
      const success = await deleteUserPrompt(promptId)
      if (success) {
        setUserPrompts((prev: UserPrompt[]) => prev.filter((p: UserPrompt) => p.id !== promptId))
      }
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
                My Prompts
                <FileText className="w-8 h-8 text-blue-500" />
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and edit your created prompts
              </p>
            </div>
            
            <Link href="/dashboard/create">
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Create New Prompt
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-6 mb-8">
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search your prompts..."
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
            Found {filteredPrompts.length} {filteredPrompts.length === 1 ? 'prompt' : 'prompts'}
          </p>
        </div>

        {/* Prompts Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your prompts...</p>
          </div>
        ) : filteredPrompts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.map((prompt) => (
              <Card key={prompt.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">
                        {prompt.category}
                      </Badge>
                                             {prompt.prompt_type === 'timeline' && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-0">
                          Timeline
                        </Badge>
                      )}
                      {!prompt.is_public && (
                        <Badge variant="outline" className="border-orange-200 text-orange-700">
                          Private
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg leading-tight">
                    {prompt.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {prompt.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>{formatDate(new Date(prompt.created_at))}</span>
                    <div className="flex items-center gap-3">
                      <span>{prompt.likes_count} likes</span>
                      <span>{prompt.usage_count} uses</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link 
                      href={prompt.prompt_type === 'timeline' 
                        ? `/dashboard/editor?remix-timeline=${prompt.id}` 
                        : `/dashboard/editor?remix=${prompt.id}`
                      }
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Edit className="w-3 h-3" />
                        Edit
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDelete(prompt.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No prompts found</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Try adjusting your search or filters"
                : "Start creating your first prompt"}
            </p>
            <Link href="/dashboard/create">
              <Button variant="outline" className="rounded-full gap-2">
                <Plus className="w-4 h-4" />
                Create Your First Prompt
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
} 