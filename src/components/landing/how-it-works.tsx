import { Search, Edit, Download, Play } from "lucide-react"

const steps = [
  {
    icon: Search,
    title: "Browse Prompts",
    description: "Explore our curated library of cinematic prompts designed specifically for Veo 3."
  },
  {
    icon: Edit,
    title: "Customize & Remix",
    description: "Edit prompts to match your vision using our intuitive editor with live JSON preview."
  },
  {
    icon: Download,
    title: "Export JSON",
    description: "Download your prompts in the perfect JSON format ready for Veo 3 integration."
  },
  {
    icon: Play,
    title: "Create Videos",
    description: "Use your prompts in Veo 3 to generate stunning, professional-quality videos."
  }
]

export function HowItWorks() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-gray-800">
            From prompt discovery to video creation in four simple steps
          </p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="text-center">
                  <div className="relative">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-8 left-full w-full">
                        <div className="h-0.5 bg-gray-200 relative">
                          <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    {step.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
} 