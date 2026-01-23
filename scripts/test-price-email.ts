/**
 * Test Email Script - Send one test email
 * 
 * Run: npm run test-price-email
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

const FROM_EMAIL = 'info@promptveo3.com' // Update this!
const FROM_NAME = 'PromptVeo3 Team'
const TEST_EMAIL = 'asifkabir008@gmail.com' // Update this to your email!

const getEmailHTML = (userName?: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Special Pricing Announcement - PromptVeo3</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px 40px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">New Pricing Update</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              ${userName ? `<p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hi ${userName},</p>` : ''}
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                We wanted to let you know about an update to our Pro plan pricing.
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                We've adjusted our Pro plan pricing from <span style="text-decoration: line-through; color: #9ca3af;">$49</span> to:
              </p>
              
              <!-- Price Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td align="center" style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #2563eb; border-radius: 12px; padding: 30px;">
                    <div style="font-size: 48px; font-weight: bold; color: #2563eb; margin: 0 0 10px;">$14.99</div>
                    <div style="color: #1e40af; font-size: 18px; font-weight: 600;">One-time payment • Lifetime access</div>
                  </td>
                </tr>
              </table>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                This includes unlimited access to:
              </p>
              
              <!-- Features List -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 0 0 30px;">
                <tr>
                  <td>
                    <div style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #10b981; font-size: 18px; margin-right: 8px;">✓</span>
                      <span style="color: #374151; font-size: 15px;">1000+ structured Veo 3 prompts</span>
                    </div>
                    <div style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #10b981; font-size: 18px; margin-right: 8px;">✓</span>
                      <span style="color: #374151; font-size: 15px;">JSON export for seamless integration</span>
                    </div>
                    <div style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #10b981; font-size: 18px; margin-right: 8px;">✓</span>
                      <span style="color: #374151; font-size: 15px;">Remix and customize any prompt</span>
                    </div>
                    <div style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
                      <span style="color: #10b981; font-size: 18px; margin-right: 8px;">✓</span>
                      <span style="color: #374151; font-size: 15px;">Save unlimited favorites</span>
                    </div>
                    <div style="padding: 12px 0;">
                      <span style="color: #10b981; font-size: 18px; margin-right: 8px;">✓</span>
                      <span style="color: #374151; font-size: 15px;">Advanced search and filters</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="https://promptveo3.com/dashboard/billing" 
                       style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
                      Upgrade to Pro Now →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                Upgrade anytime to get lifetime access to all Pro features.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0 0 15px; text-align: center;">
                Questions? Reply to this email or visit our <a href="https://promptveo3.com" style="color: #2563eb; text-decoration: none;">website</a>.
              </p>
              <p style="color: #9ca3af; font-size: 12px; line-height: 1.6; margin: 0; text-align: center;">
                © 2026 PromptVeo3. All rights reserved.<br>
                This is a test email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

async function main() {
  console.log('📧 Sending test email...\n')
  
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set')
  }
  
  console.log(`From: ${FROM_NAME} <${FROM_EMAIL}>`)
  console.log(`To: ${TEST_EMAIL}`)
  console.log(`Subject: 🎉 Special Offer: Pro Plan Now Just $14.99 (Limited Time!)\n`)
  
  const { data, error } = await resend.emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: TEST_EMAIL,
    subject: '[TEST] New pricing for PromptVeo3 Pro - Now $14.99',
    html: getEmailHTML('Test User'),
    tags: [
      { name: 'campaign', value: 'price-drop-test' }
    ]
  })
  
  if (error) {
    console.error('❌ Failed to send test email:', error)
    process.exit(1)
  }
  
  console.log('✅ Test email sent successfully!')
  console.log(`📬 Email ID: ${data?.id}`)
  console.log('\nCheck your inbox and verify:')
  console.log('  1. Email arrives (check spam folder too)')
  console.log('  2. Design looks good on desktop and mobile')
  console.log('  3. All links work')
  console.log('  4. No typos or formatting issues\n')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Test failed:', error.message)
    process.exit(1)
  })
