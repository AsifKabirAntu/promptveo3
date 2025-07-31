import { Heart, Eye, Copy, ExternalLink, Edit } from "lucide-react"
import { Prompt } from "@/types/prompt"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { truncateText } from "@/lib/utils"
import Link from "next/link"

interface PromptCardProps {
  prompt: Prompt
  onFavorite?: (id: string) => void
  onExport?: (id: string) => void
  isFavorited?: boolean
  showActions?: boolean
}

export function PromptCard({ 
  prompt, 
  onFavorite, 
  onExport, 
  isFavorited = false,
  showActions = true 
}: PromptCardProps) {
  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{prompt.title}</CardTitle>
            <CardDescription className="line-clamp-2">
              {truncateText(prompt.description, 120)}
            </CardDescription>
          </div>
          {prompt.is_featured && (
            <Badge variant="default" className="ml-2">
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary">{prompt.category}</Badge>
            {prompt.style.split(', ').slice(0, 2).map((style, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {style}
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-700">
            <div className="flex items-center space-x-3">
              <span className="flex items-center">
                <Heart className="w-4 h-4 mr-1" />
                {prompt.likes_count}
              </span>
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {prompt.usage_count}
              </span>
            </div>
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFavorite?.(prompt.id)}
              className={isFavorited ? "text-red-500 border-red-500" : ""}
            >
              <Heart className={`w-4 h-4 mr-1 ${isFavorited ? "fill-current" : ""}`} />
              {isFavorited ? "Favorited" : "Favorite"}
            </Button>
            
            <Link href={`/prompts/${prompt.id}`} passHref>
              <Button variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-1" />
                View
              </Button>
            </Link>
            
            <Link href={`/dashboard/editor?remix=${prompt.id}`} passHref>
              <Button variant="default" size="sm">
                <Edit className="w-4 h-4 mr-1" />
                Remix
              </Button>
            </Link>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport?.(prompt.id)}
            >
              <Copy className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 