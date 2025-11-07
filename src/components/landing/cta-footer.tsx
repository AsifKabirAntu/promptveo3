import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function CTAFooter() {
  return (
    <section className="bg-blue-600">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to create stunning videos?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Get full access to 1000+ prompts and all features. Start creating professional Veo 3 videos today.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link href="/auth/signup">
              <Button 
                variant="secondary" 
                size="lg"
                className="whitespace-nowrap"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
} 