import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

const plans = [
  {
    name: "Open Beta",
    price: "Free",
    description: "Full access during beta period",
    features: [
      { name: "Unlimited prompt access", included: true },
      { name: "Browse entire prompt library", included: true },
      { name: "Advanced search and filters", included: true },
      { name: "Prompt remixing & editor", included: true },
      { name: "JSON export for Veo 3", included: true },
      { name: "Save to personal library", included: true },
      { name: "Create custom prompts", included: true },
    ],
    cta: "Start Creating",
    popular: true,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Free During Beta
          </h2>
          <p className="mt-4 text-lg text-gray-800">
            Get full access to all features while we are in beta
          </p>
        </div>

        <div className="mt-16 flex justify-center">
          <div className="w-full max-w-lg">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className="relative ring-2 ring-blue-600"
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="rounded-full bg-blue-600 px-3 py-1 text-sm font-medium text-white">
                    Beta Access
                  </div>
                </div>
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-blue-600">{plan.price}</span>
                  </div>
                  <CardDescription className="mt-2">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-gray-900">
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link href="/dashboard">
                    <Button className="w-full">
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-12 text-center text-sm text-gray-600">
          <p>🎉 All features free during beta period</p>
          <p className="mt-1">Help us improve PromptVeo3 with your feedback!</p>
        </div>
      </div>
    </section>
  )
} 