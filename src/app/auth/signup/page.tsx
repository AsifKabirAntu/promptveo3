import { SignUpForm } from "@/components/auth/signup-form"
import Link from "next/link"
import { Logo } from "@/components/ui/logo"

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="flex min-h-screen">
        {/* Left Column - Sign Up Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <Link href="/" className="flex items-center justify-center space-x-2 mb-6">
                <Logo size={40} />
                <span className="text-2xl font-bold text-gray-900">PromptVeo3</span>
              </Link>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Start your creative journey
              </h2>
              <p className="text-gray-600">
                Join thousands of creators using structured prompts for Veo 3
              </p>
            </div>
            
            <SignUpForm />
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        {/* Right Column - Timeline Prompt Preview */}
        <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center p-8">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">See the Power of Structured Prompts</h2>
              <p className="text-gray-600">Explore how our timeline prompts create stunning Veo 3 videos</p>
            </div>
            
            {/* Timeline Prompt Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Timeline Prompt</span>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Featured</span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Epic Mountain Vista</h3>
              <p className="text-gray-600 text-sm mb-4">A breathtaking panoramic view of snow-capped mountain peaks bathed in golden morning light.</p>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <span className="text-xs text-gray-500">Camera</span>
                  <p className="text-sm font-medium">Wide establishing shot</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Lighting</span>
                  <p className="text-sm font-medium">Golden hour</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Motion</span>
                  <p className="text-sm font-medium">Slow forward push</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Style</span>
                  <p className="text-sm font-medium">Cinematic</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  {['mountains', 'epic', 'sunrise', 'nature'].map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View JSON →
                </button>
              </div>
            </div>
            
            {/* JSON Structure Preview */}
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">JSON Structure</span>
                <span className="text-xs text-gray-500">Veo 3 Ready</span>
              </div>
              <pre className="text-xs text-gray-300 overflow-x-auto">
{`{
  "title": "Epic Mountain Vista",
  "camera": "Wide establishing shot",
  "lighting": "Golden hour",
  "motion": "Slow forward push",
  "keywords": ["mountains", "epic", "sunrise"],
  "style": "Cinematic"
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center">
        <p className="text-sm text-gray-500">
          Need help? Contact us at{' '}
          <a href="mailto:info@promptveo3.com" className="text-blue-600 hover:text-blue-500">
            info@promptveo3.com
          </a>
        </p>
      </div>
    </div>
  )
} 