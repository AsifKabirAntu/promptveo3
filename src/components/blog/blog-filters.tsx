import { useState } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { BlogCategory } from '@/types/blog'
import { BlogFilters as BlogFiltersType } from '@/types/blog'

interface BlogFiltersProps {
  categories: BlogCategory[]
  filters: BlogFiltersType
  onFiltersChange: (filters: BlogFiltersType) => void
  searchTerm: string
  onSearchChange: (term: string) => void
}

export function BlogFilters({ 
  categories, 
  filters, 
  onFiltersChange, 
  searchTerm, 
  onSearchChange 
}: BlogFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleCategoryChange = (categoryId: string) => {
    onFiltersChange({
      ...filters,
      category: categoryId === 'all' ? undefined : categoryId
    })
  }

  const handleFeaturedToggle = () => {
    onFiltersChange({
      ...filters,
      featured: !filters.featured
    })
  }

  const clearFilters = () => {
    onFiltersChange({})
    onSearchChange('')
  }

  const hasActiveFilters = filters.category || filters.featured || searchTerm

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
          >
            <X className="h-4 w-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-xl shadow-lg ring-1 ring-gray-200 overflow-hidden">
        {/* Categories */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Categories</h4>
          <div className="space-y-2">
            <label className="flex items-center group cursor-pointer">
              <input
                type="radio"
                name="category"
                value="all"
                checked={!filters.category}
                onChange={() => handleCategoryChange('all')}
                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                All Categories
              </span>
            </label>
            {categories.map((category) => (
              <label key={category.id} className="flex items-center group cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  value={category.id}
                  checked={filters.category === category.id}
                  onChange={() => handleCategoryChange(category.id)}
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
                  {category.name}
                </span>
                <span className={`ml-auto text-xs px-2 py-1 rounded-full ${category.color}`}>
                  {category.slug}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Featured Filter */}
        <div className="p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Content Type</h4>
          <label className="flex items-center group cursor-pointer">
            <input
              type="checkbox"
              checked={filters.featured || false}
              onChange={handleFeaturedToggle}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-3 text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
              Featured articles only
            </span>
            <span className="ml-auto text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
              ⭐ Premium
            </span>
          </label>
        </div>
      </div>

      {/* Quick Tags */}
      <div className="bg-white rounded-xl shadow-lg ring-1 ring-gray-200 p-6">
        <h4 className="text-sm font-medium text-gray-900 mb-4">Popular Tags</h4>
        <div className="flex flex-wrap gap-2">
          {['veo3', 'tutorial', 'pro-tips', 'beginners', 'advanced'].map((tag) => (
            <button
              key={tag}
              onClick={() => onFiltersChange({ ...filters, tag })}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 ${
                filters.tag === tag
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
        >
          <Filter className="h-4 w-4" />
          {isExpanded ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>
    </div>
  )
} 