import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
            <p className="mt-2 text-gray-600">Last updated: July 2025</p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>1. Acceptance of Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  By accessing and using PromptVeo3 (the "Service"), you agree to be bound by these Terms of Service. 
                  If you do not agree to these terms, please do not use the Service.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>2. Description of Service</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  PromptVeo3 provides tools to create, manage, and share cinematic prompts for Veo 3 and other 
                  AI-powered video generation platforms. Our platform includes prompt templates, editing tools, 
                  and community features.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>3. User Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  To access certain features, you may be required to create an account. You agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Keep your login credentials secure</li>
                  <li>Be responsible for all activity under your account</li>
                  <li>Provide accurate and complete information</li>
                  <li>Notify us of any unauthorized use immediately</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>4. Acceptable Use</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  You agree not to use the Service to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Post or create content that is harmful, offensive, or inappropriate</li>
                  <li>Gain unauthorized access to systems or data</li>
                  <li>Interfere with or disrupt the platform</li>
                  <li>Use the service for unauthorized commercial purposes</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>5. Intellectual Property</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  All content, features, and functionality of PromptVeo3 are owned by PromptVeo3 and protected 
                  under international intellectual property laws.
                </p>
                <p className="text-gray-700">
                  You retain ownership of your created content but grant PromptVeo3 a non-exclusive, worldwide 
                  license to use, display, and distribute it in connection with the service.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>6. Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  Your privacy matters. Please review our Privacy Policy to understand how we collect, use, 
                  and protect your information.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>7. Payments and Subscriptions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Some features may require a paid subscription or one-time payment. By purchasing, you agree that:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-gray-700">
                  <li>All fees are non-refundable unless required by law</li>
                  <li>We may change pricing with prior notice</li>
                  <li>Subscriptions auto-renew unless canceled</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>8. Disclaimers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  The service is provided "as is" without warranties of any kind. We do not guarantee uninterrupted, 
                  secure, or error-free service. We are not liable for outputs generated by third-party AI tools 
                  using our prompts.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>9. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  PromptVeo3 will not be liable for indirect, incidental, special, consequential, or punitive 
                  damages, including loss of data, profits, or use, arising from your use of the service.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>10. Termination</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  We may suspend or terminate your account at any time without prior notice if you violate these 
                  terms. Upon termination, your right to use the service will end immediately.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>11. Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  We reserve the right to modify these terms at any time. If changes are significant, we will 
                  notify users. Continued use of the service after changes constitutes acceptance of the new terms.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>12. Governing Law</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  These terms are governed by and construed in accordance with the laws of England and Wales, 
                  without regard to conflict of law principles.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>13. Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">
                  For any questions or concerns, please contact us at:
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