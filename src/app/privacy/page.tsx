import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="mt-2 text-gray-600">Last updated: July 2025</p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Introduction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  PromptVeo3 ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy 
                  explains how we collect, use, and safeguard your personal information when you use our website 
                  and services.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>1. Information We Collect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  We collect the following types of information:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">a. Account Information</h4>
                    <ul className="list-disc pl-6 space-y-1 text-gray-700">
                      <li>Name</li>
                      <li>Email address</li>
                      <li>Password (encrypted)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">b. Usage Data</h4>
                    <ul className="list-disc pl-6 space-y-1 text-gray-700">
                      <li>IP address</li>
                      <li>Browser type</li>
                      <li>Pages visited</li>
                      <li>Actions performed within the app</li>
                      <li>Device and system data</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">c. Prompts & Content</h4>
                    <ul className="list-disc pl-6 space-y-1 text-gray-700">
                      <li>Text prompts you create</li>
                      <li>Templates you save or remix</li>
                      <li>Favorites, collections, and download activity</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. How We Use Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  We use your data to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Provide and maintain the PromptVeo3 platform</li>
                  <li>Personalize your user experience</li>
                  <li>Improve our features and user interface</li>
                  <li>Communicate with you about updates, support, or marketing (you can opt out)</li>
                  <li>Ensure legal compliance and prevent misuse</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. Third-Party Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  We may share limited information with trusted third parties, such as:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Analytics (e.g. Google Analytics, Vercel Insights)</li>
                  <li>Authentication (e.g. Google OAuth)</li>
                  <li>Hosting and infrastructure (e.g. Supabase, Vercel)</li>
                </ul>
                <p className="text-gray-700">
                  We never sell or rent your personal information.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Cookies and Tracking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  We use cookies and similar technologies to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Keep you logged in</li>
                  <li>Understand usage patterns</li>
                  <li>Improve performance</li>
                </ul>
                <p className="text-gray-700">
                  You can manage cookies in your browser settings.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Data Retention</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  We retain your information only as long as needed to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Provide services</li>
                  <li>Comply with legal obligations</li>
                  <li>Improve the platform</li>
                </ul>
                <p className="text-gray-700">
                  You may request account deletion at any time.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Your Rights (UK & GDPR)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  As a UK-based user, you have the right to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Access, update, or delete your personal data</li>
                  <li>Withdraw consent</li>
                  <li>Object to certain data uses</li>
                  <li>Lodge a complaint with the Information Commissioner's Office (ICO)</li>
                </ul>
                <p className="text-gray-700">
                  To exercise any of these rights, email us at info@promptveo3.com.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  PromptVeo3 is not intended for users under the age of 13. We do not knowingly collect 
                  data from children.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  We take reasonable measures to protect your data, including encryption, access controls, 
                  and secure hosting. However, no method is 100% secure.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Changes to This Policy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  We may update this policy from time to time. When we do, we'll notify you by updating 
                  the "Last Updated" date and, if significant, by email or in-app notice.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  If you have any questions or concerns about this Privacy Policy, contact us at:
                </p>
                <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                  <p className="text-gray-700">
                    <strong>Email:</strong> info@promptveo3.com
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
} 