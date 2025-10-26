import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { PromptPreview } from "@/components/landing/prompt-preview"
import { VideoShowcase } from "@/components/landing/video-showcase"
import { CommunityPreview } from "@/components/landing/community-preview"
import { FAQ } from "@/components/landing/faq"
import { Pricing } from "@/components/landing/pricing"
import { CTAFooter } from "@/components/landing/cta-footer"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { FluxFrameInlineAd } from "@/components/ads/FluxFrameInlineAd"

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen">
        <Hero />
        <HowItWorks />
        
        {/* FluxFrame Ad #1 - After How It Works */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <FluxFrameInlineAd />
          </div>
        </section>
        
        <PromptPreview />
        <VideoShowcase />
        <CommunityPreview />
        
        {/* FluxFrame Ad #2 - After Community Preview */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <FluxFrameInlineAd />
          </div>
        </section>
        
        <FAQ />
        <Pricing />
        <CTAFooter />
      </main>
      <Footer />
    </>
  )
}
