import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Logo } from "@/components/ui/logo"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-grid" />
      
      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-20 lg:py-24 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800 mb-6 sm:mb-8 gap-2">
            <Logo size={24} />
            Now available for Veo 3
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
            <span className="block leading-[1.1]">Structured prompts,</span>
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-[1.2]">
              engineered for Veo 3
            </span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-800 sm:text-xl">
            Ship high‑quality Veo 3 videos 10x faster with structured JSON prompts. 
            Product reveals, room transformations, timelines, ads, and more. Browse, remix, and export perfect JSON with zero guesswork.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-gray-700 sm:text-lg">
            Browse our library of 1000+ ready‑to‑use Veo 3 prompts.
          </p>
          
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="px-6 sm:px-8 w-full sm:w-auto">
                Explore 1000+ Prompts
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            
            <Link href="#pricing">
              <Button variant="outline" size="lg" className="px-6 sm:px-8 w-full sm:w-auto">
                Get Pro
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 sm:mt-16">
            <div className="relative rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:rounded-2xl lg:p-4">
              <div className="aspect-video rounded-lg overflow-hidden">
                <img 
                  src="/landing.png" 
                  alt="PromptVeo3 Platform Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
} 