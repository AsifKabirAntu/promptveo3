import Script from "next/script"

const faqs = [
  {
    question: "What is PromptVeo3?",
    answer:
      "PromptVeo3 is a library of professionally structured prompts engineered for Veo 3. You can browse, remix, and export JSON prompts to generate cinematic AI videos quickly.",
  },
  {
    question: "How do the prompts work with Veo 3?",
    answer:
      "Each prompt follows a consistent JSON structure including description, style, camera, lighting, environment, motion, and keywords. You can copy or download the JSON and use it directly in your Veo 3 workflow.",
  },
  {
    question: "Do you offer free and pro plans?",
    answer:
      "Yes. Free users can explore the library and test prompts. Pro users get unlimited access to all prompts, advanced features, and priority updates.",
  },
  {
    question: "Can I customize the prompts?",
    answer:
      "Absolutely. Prompts are designed to be remixable—change the style, camera, or specific elements to match your creative direction while keeping a reliable structure.",
  },
  {
    question: "What kind of videos can I generate?",
    answer:
      "From room transformations and product reveals to timeline concepts and cinematic scenes. Our showcase features real Veo 3 outputs generated from these prompts.",
  },
  {
    question: "How do I get started?",
    answer:
      "Click Get Pro to create an account. Then explore the library, copy or download JSON prompts, and start generating videos in Veo 3.",
  },
]

function buildFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  }
}

export function FAQ() {
  const jsonLd = buildFaqJsonLd()

  return (
    <section id="faq" className="relative overflow-hidden py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="absolute inset-0 bg-grid-black/[0.02] bg-grid" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12">
          <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 mb-4">
            FAQ
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 lg:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about using structured prompts with Veo 3.
          </p>
        </div>

        <div className="max-w-3xl mx-auto divide-y divide-gray-200 rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          {faqs.map((item, idx) => (
            <details key={idx} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 sm:px-6 py-4 sm:py-5">
                <h3 className="text-left text-sm sm:text-base font-semibold text-gray-900">
                  {item.question}
                </h3>
                <span className="ml-4 inline-flex h-6 w-6 items-center justify-center rounded-md bg-gray-100 text-gray-600 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="px-4 sm:px-6 pb-5 text-sm text-gray-700 leading-relaxed">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* SEO: FAQPage structured data */}
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  )
} 