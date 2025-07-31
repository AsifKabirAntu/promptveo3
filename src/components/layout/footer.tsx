import Link from "next/link"
import { Logo } from "@/components/ui/logo"

const navigation = {
  product: [
    { name: "Features", href: "#" },
    { name: "Pricing", href: "#pricing" },
    { name: "Browse Prompts", href: "/dashboard" },
  ],
  company: [
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-gray-900" aria-labelledby="footer-heading">
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
                          <div className="flex items-center space-x-2">
                <Logo size={32} />
                <span className="text-xl font-bold text-white">PromptVeo3</span>
              </div>
            <p className="text-gray-300 text-base">
              Professional cinematic prompts engineered for Veo 3. 
              Create stunning videos with our structured JSON templates.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-8 xl:col-span-2 xl:mt-0 xl:justify-end">
            <div className="md:grid md:grid-cols-2 md:gap-8 md:justify-end">
              <div>
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
                  Product
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {navigation.product.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-base text-gray-300 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase">
                  Company
                </h3>
                <ul role="list" className="mt-4 space-y-4">
                  {navigation.company.map((item) => (
                    <li key={item.name}>
                      <Link href={item.href} className="text-base text-gray-300 hover:text-white">
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-800 pt-8">
          <p className="text-base text-gray-300 xl:text-center">
            &copy; 2025 PromptVeo3. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
} 