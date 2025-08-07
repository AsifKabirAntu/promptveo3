import { Check, X, Crown, Zap, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const plans = [
  {
    name: "Free",
    price: "Free",
    description: "Perfect for getting started",
    features: [
      { name: "3 prompts per category", included: true },
      { name: "Browse prompt library", included: true },
      { name: "Basic search and filters", included: true },
      { name: "JSON export for Veo 3", included: false },
      { name: "Save favorites", included: false },
      { name: "Remix prompts", included: false },
      { name: "Create custom prompts", included: false },
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    price: "$14.99",
    period: "/month",
    description: "Unlock unlimited access",
    features: [
      { name: "Unlimited prompt access", included: true },
      { name: "Browse entire prompt library", included: true },
      { name: "Advanced search and filters", included: true },
      { name: "JSON export for Veo 3", included: true },
      { name: "Save to personal library", included: true },
      { name: "Remix prompts", included: true },
      { name: "Create custom prompts", included: true },
      { name: "Priority support", included: true },
    ],
    cta: "Upgrade to Pro",
    popular: true,
    yearlyPrice: "$120/year",
    yearlySavings: "Save 33%",
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-4 text-lg text-gray-800">
            Choose the plan that works best for your creative workflow
          </p>
        </div>

        <div className="mt-16 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.popular ? 'ring-2 ring-blue-600 shadow-lg' : 'border-gray-200'}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl flex items-center justify-center space-x-2">
                  {plan.popular && <Crown className="h-5 w-5 text-blue-600" />}
                  <span>{plan.name}</span>
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-lg text-gray-600">{plan.period}</span>
                  )}
                </div>
                {plan.yearlyPrice && (
                  <div className="mt-2">
                    <div className="text-sm text-gray-600">
                      or <span className="font-semibold">{plan.yearlyPrice}</span>
                    </div>
                    <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
                      {plan.yearlySavings}
                    </Badge>
                  </div>
                )}
                <CardDescription className="mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${feature.included ? 'text-gray-900' : 'text-gray-500'}`}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <Link href={plan.name === "Free" ? "/auth/signup" : "/dashboard/billing"}>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-900 hover:bg-gray-800'}`}
                  >
                    {plan.popular && <Zap className="h-4 w-4 mr-2" />}
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-gray-600">
          <p>✨ Start free, upgrade anytime</p>
        </div>
      </div>
    </section>
  )
} 