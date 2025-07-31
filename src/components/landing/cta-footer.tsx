"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { subscribeToNewsletter } from "@/lib/email-subscriptions"

export function CTAFooter() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      toast.error("Please enter your email address")
      return
    }

    setIsSubmitting(true)

    try {
      const result = await subscribeToNewsletter(email)
      
      if (result.success) {
        toast.success("Successfully subscribed to our newsletter!")
        setEmail("")
      } else {
        toast.error(result.error || "Failed to subscribe. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting email:", error)
      toast.error("Something went wrong. Please try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

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
          
          <form onSubmit={handleEmailSubmit} className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 max-w-md mx-auto">
            <Input 
              type="email" 
              placeholder="Enter your email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="bg-white"
              required
            />
            <Button 
              type="submit" 
              variant="secondary" 
              className="whitespace-nowrap"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subscribing...
                </>
              ) : (
                <>
                  Join Beta
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          
          <p className="mt-4 text-sm text-blue-200">
            No spam. Unsubscribe at any time.
          </p>
        </div>
      </div>
    </section>
  )
} 