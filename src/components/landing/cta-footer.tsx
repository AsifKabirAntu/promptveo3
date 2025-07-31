import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
            Join our beta and get full access to all features. Help us build the future of AI video prompts.
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email" 
              className="bg-white"
            />
            <Link href="/dashboard">
              <Button variant="secondary" className="whitespace-nowrap">
                Join Beta
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <p className="mt-4 text-sm text-blue-200">
            No spam. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  )
} 