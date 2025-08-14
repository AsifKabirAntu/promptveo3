import Link from 'next/link'
import { ArrowRight, BookOpen, Zap } from 'lucide-react'

interface BlogCTAProps {
  primaryText?: string
  primaryHref?: string
  secondaryText?: string
  secondaryHref?: string
}

export function BlogCTA({ 
  primaryText = "Explore the PromptVeo3 library",
  primaryHref = "/dashboard",
  secondaryText = "Get Started Free",
  secondaryHref = "/auth/signin"
}: BlogCTAProps) {
  return (
    <section className="my-16 relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 via-white to-blue-50 border border-gray-200 p-8 md:p-12">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-grid" />
      
      {/* Floating Elements */}
      <div className="absolute top-4 right-8 w-16 h-16 bg-blue-100/50 rounded-full blur-xl" />
      <div className="absolute bottom-8 left-12 w-20 h-20 bg-purple-100/50 rounded-full blur-xl" />
      
      <div className="relative">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800 mb-6">
            <Zap className="w-4 h-4 mr-2" />
            Ready to level up your Veo 3 game?
          </div>
          
          {/* Main Content */}
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Want 700+ structured prompts you can remix?
          </h3>
          
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of creators using our proven prompt library to create professional Veo 3 videos consistently.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* Primary CTA */}
            <Link 
              href={primaryHref}
              className="group inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              {primaryText}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            {/* Secondary CTA */}
            <Link 
              href={secondaryHref}
              className="group inline-flex items-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border border-gray-300 hover:bg-gray-50 transition-all duration-300"
            >
              {secondaryText}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          {/* Social Proof */}
          <div className="mt-8 flex items-center justify-center text-gray-500 text-sm">
            <div className="flex items-center">
              <div className="flex -space-x-2 mr-3">
                <img 
                  src="/avatars/creator-1.jpg" 
                  alt="Creator profile" 
                  className="w-8 h-8 rounded-full border-2 border-gray-200 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%234F46E5'/%3E%3Ctext x='16' y='20' text-anchor='middle' fill='white' font-family='Arial' font-size='14' font-weight='bold'%3EA%3C/text%3E%3C/svg%3E"
                  }}
                />
                <img 
                  src="/avatars/creator-2.jpg" 
                  alt="Creator profile" 
                  className="w-8 h-8 rounded-full border-2 border-gray-200 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23EC4899'/%3E%3Ctext x='16' y='20' text-anchor='middle' fill='white' font-family='Arial' font-size='14' font-weight='bold'%3EB%3C/text%3E%3C/svg%3E"
                  }}
                />
                <img 
                  src="/avatars/creator-3.jpg" 
                  alt="Creator profile" 
                  className="w-8 h-8 rounded-full border-2 border-gray-200 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%2310B981'/%3E%3Ctext x='16' y='20' text-anchor='middle' fill='white' font-family='Arial' font-size='14' font-weight='bold'%3EC%3C/text%3E%3C/svg%3E"
                  }}
                />
                <img 
                  src="/avatars/creator-4.jpg" 
                  alt="Creator profile" 
                  className="w-8 h-8 rounded-full border-2 border-gray-200 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23F59E0B'/%3E%3Ctext x='16' y='20' text-anchor='middle' fill='white' font-family='Arial' font-size='14' font-weight='bold'%3ED%3C/text%3E%3C/svg%3E"
                  }}
                />
              </div>
              <span>Join 1,000+ creators</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 