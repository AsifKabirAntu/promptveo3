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
      { name: "View 4 prompts", included: true },
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
    price: "$29",
    period: " one-time",
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
    cta: "Get Early Bird Deal",
    popular: true,
    originalPrice: "$79",
    savings: "Early Bird Special",
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
            Pricing that scales with your output
          </h2>
          <p className="mt-4 text-base sm:text-lg text-gray-800">
            Start free. Upgrade when you’re ready to move faster and ship more.
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
                  {plan.originalPrice && (
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-2xl text-gray-500 line-through">{plan.originalPrice}</span>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        {plan.savings}
                      </Badge>
                    </div>
                  )}
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && (
                    <span className="text-lg text-gray-600">{plan.period}</span>
                  )}
                </div>
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