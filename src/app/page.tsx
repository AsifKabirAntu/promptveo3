import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { PromptPreview } from "@/components/landing/prompt-preview"
import { VideoShowcase } from "@/components/landing/video-showcase"
import { Pricing } from "@/components/landing/pricing"
import { CTAFooter } from "@/components/landing/cta-footer"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Hero />
        <HowItWorks />
        <PromptPreview />
        <VideoShowcase />
        <Pricing />
        <CTAFooter />
      </main>
      <Footer />
    </>
  )
}
