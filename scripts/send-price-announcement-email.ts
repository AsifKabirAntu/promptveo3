/**
 * Mass Email Campaign Script - Price Drop Announcement
 * 
 * This script sends a promotional email to all users about the new $14.99 pricing.
 * Uses Resend API with rate limiting and batch processing.
 * 
 * Setup:
 * 1. npm install resend
 * 2. Add RESEND_API_KEY to your .env.local
 * 3. Verify your domain in Resend dashboard
 * 4. Run: npm run send-price-email
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Configuration
const BATCH_SIZE = 50 // Resend allows 100/hour on free plan, 50 is safe
const DELAY_BETWEEN_BATCHES = 60000 // 1 minute delay between batches
const FROM_EMAIL = 'info@promptveo3.com' // Change this to your verified domain
const FROM_NAME = 'PromptVeo3 Team'

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role to bypass RLS
)

const resend = new Resend(process.env.RESEND_API_KEY!)

// Email HTML Template
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
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">🎉 Special Pricing Alert!</h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              ${userName ? `<p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">Hi ${userName},</p>` : ''}
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                We have some <strong>exciting news</strong> for you! 🎊
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                For a <strong>limited time only</strong>, we've dropped our Pro plan pricing from <span style="text-decoration: line-through; color: #9ca3af;">$49</span> to just:
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
                That's a <strong style="color: #2563eb;">70% savings!</strong> Get unlimited access to:
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
                ⏰ This is a limited-time offer. Lock in your lifetime access today!
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
                <a href="https://promptveo3.com/unsubscribe?email={{email}}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
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

// Plain text version
const getEmailText = (userName?: string) => `
${userName ? `Hi ${userName},\n\n` : ''}We have exciting news! 🎉

For a limited time only, we've dropped our Pro plan pricing from $49 to just $14.99!

That's a 70% savings for lifetime access to:
✓ 1000+ structured Veo 3 prompts
✓ JSON export for seamless integration
✓ Remix and customize any prompt
✓ Save unlimited favorites
✓ Advanced search and filters

Upgrade now: https://promptveo3.com/dashboard/billing

This is a limited-time offer. Lock in your lifetime access today!

Questions? Reply to this email or visit https://promptveo3.com

© 2026 PromptVeo3. All rights reserved.
Unsubscribe: https://promptveo3.com/unsubscribe
`

async function getAllUsers() {
  console.log('📥 Fetching all users from Supabase...')
  
  const { data, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }
  
  const users = data.users
    .filter(user => user.email && user.email_confirmed_at) // Only confirmed emails
    .map(user => ({
      email: user.email!,
      name: user.user_metadata?.full_name || user.user_metadata?.name || undefined,
      id: user.id
    }))
  
  console.log(`✅ Found ${users.length} users with confirmed emails`)
  return users
}

async function sendEmailBatch(users: Array<{ email: string; name?: string; id: string }>) {
  const results = {
    sent: 0,
    failed: 0,
    errors: [] as Array<{ email: string; error: string }>
  }
  
  for (const user of users) {
    try {
      const { data, error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: user.email,
        subject: '🎉 Special Offer: Pro Plan Now Just $14.99 (Limited Time!)',
        html: getEmailHTML(user.name),
        text: getEmailText(user.name),
        tags: [
          { name: 'campaign', value: 'price-drop-2026' },
          { name: 'user_id', value: user.id }
        ]
      })
      
      if (error) {
        console.error(`❌ Failed to send to ${user.email}:`, error)
        results.failed++
        results.errors.push({ email: user.email, error: error.message })
      } else {
        console.log(`✅ Sent to ${user.email} (ID: ${data?.id})`)
        results.sent++
      }
      
      // Small delay between individual emails (100ms)
      await new Promise(resolve => setTimeout(resolve, 100))
      
    } catch (error: any) {
      console.error(`❌ Exception sending to ${user.email}:`, error.message)
      results.failed++
      results.errors.push({ email: user.email, error: error.message })
    }
  }
  
  return results
}

async function main() {
  console.log('🚀 Starting Price Drop Email Campaign\n')
  
  // Validate environment variables
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set in environment variables')
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials are not set in environment variables')
  }
  
  console.log('✅ Environment variables validated\n')
  
  // Get all users
  const allUsers = await getAllUsers()
  
  if (allUsers.length === 0) {
    console.log('⚠️  No users found to email')
    return
  }
  
  console.log(`\n📧 Preparing to send ${allUsers.length} emails in batches of ${BATCH_SIZE}\n`)
  
  // Split into batches
  const batches = []
  for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
    batches.push(allUsers.slice(i, i + BATCH_SIZE))
  }
  
  console.log(`📦 Created ${batches.length} batches\n`)
  
  // Send confirmation prompt
  console.log('⚠️  CONFIRMATION REQUIRED')
  console.log(`You are about to send ${allUsers.length} emails`)
  console.log(`From: ${FROM_NAME} <${FROM_EMAIL}>`)
  console.log(`Subject: 🎉 Special Offer: Pro Plan Now Just $14.99 (Limited Time!)`)
  console.log('\nPress Ctrl+C to cancel, or the script will continue in 10 seconds...\n')
  
  await new Promise(resolve => setTimeout(resolve, 10000))
  
  // Process batches
  const totalResults = {
    sent: 0,
    failed: 0,
    errors: [] as Array<{ email: string; error: string }>
  }
  
  for (let i = 0; i < batches.length; i++) {
    const batchNum = i + 1
    console.log(`\n📤 Processing batch ${batchNum}/${batches.length} (${batches[i].length} emails)`)
    
    const batchResults = await sendEmailBatch(batches[i])
    
    totalResults.sent += batchResults.sent
    totalResults.failed += batchResults.failed
    totalResults.errors.push(...batchResults.errors)
    
    console.log(`\n✅ Batch ${batchNum} complete: ${batchResults.sent} sent, ${batchResults.failed} failed`)
    
    // Wait between batches (except for the last one)
    if (i < batches.length - 1) {
      console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds before next batch...\n`)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }
  
  // Final summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 CAMPAIGN SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total emails: ${allUsers.length}`)
  console.log(`✅ Successfully sent: ${totalResults.sent}`)
  console.log(`❌ Failed: ${totalResults.failed}`)
  console.log(`Success rate: ${((totalResults.sent / allUsers.length) * 100).toFixed(2)}%`)
  
  if (totalResults.errors.length > 0) {
    console.log('\n⚠️  Failed emails:')
    totalResults.errors.forEach(({ email, error }) => {
      console.log(`  - ${email}: ${error}`)
    })
  }
  
  console.log('\n✅ Campaign complete!')
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Campaign failed:', error.message)
    process.exit(1)
  })
