/**
 * Automated Email Campaign Script - With Tracking
 * 
 * This script:
 * - Tracks who has already received emails
 * - Only sends to users who haven't received the campaign yet
 * - Can be run daily until all users are reached
 * - Respects rate limits (100/day on free plan)
 * 
 * Setup:
 * 1. Run database migration: psql < database/email-campaigns.sql
 * 2. Set RESEND_API_KEY in .env.local
 * 3. Run: npm run send-price-campaign
 * 
 * For automation:
 * - Run this script daily via cron or GitHub Actions
 * - It will automatically continue from where it left off
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env.local file
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Configuration
const CAMPAIGN_NAME = 'price-drop-jan-2026' // Unique identifier for this campaign
const DAILY_LIMIT = 95 // Free plan: 100/day, leaving 5 for other emails
const BATCH_SIZE = 50 // Send in smaller batches
const DELAY_BETWEEN_BATCHES = 5000 // 5 seconds between batches (we have daily limit, so no need for 1 min)
const FROM_EMAIL = 'info@promptveo3.com'
const FROM_NAME = 'PromptVeo3 Team'

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const resend = new Resend(process.env.RESEND_API_KEY!)

// Email HTML Template (same as before)
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
                © 2026 PromptVeo3. All rights reserved.
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
`

async function getUsersNotSentYet() {
  console.log('📥 Fetching users who haven\'t received this campaign yet...')
  
  // Get all users with confirmed emails
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
  
  if (authError) {
    throw new Error(`Failed to fetch users: ${authError.message}`)
  }
  
  const allUsers = authData.users
    .filter(user => user.email && user.email_confirmed_at)
    .map(user => ({
      email: user.email!,
      name: user.user_metadata?.full_name || user.user_metadata?.name || undefined,
      id: user.id
    }))
  
  console.log(`✅ Found ${allUsers.length} users with confirmed emails`)
  
  // Get users who already SUCCESSFULLY received this campaign (exclude failed emails for retry)
  const { data: sentData, error: sentError } = await supabase
    .from('email_campaigns')
    .select('user_email')
    .eq('campaign_name', CAMPAIGN_NAME)
    .eq('status', 'sent') // Only exclude successful sends, retry failed ones
  
  if (sentError && sentError.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
    console.warn('⚠️  Warning fetching sent emails:', sentError.message)
    console.log('💡 Assuming no emails sent yet (table might not exist)')
  }
  
  const sentEmails = new Set(sentData?.map(r => r.user_email) || [])
  console.log(`📧 Successfully sent to ${sentEmails.size} users (failed emails will be retried)`)
  
  // Filter out users who already received the email
  const usersToSend = allUsers.filter(user => !sentEmails.has(user.email))
  
  console.log(`🎯 Remaining users to send: ${usersToSend.length}`)
  
  return usersToSend
}

async function trackEmailSent(userId: string, userEmail: string, resendId: string | undefined, status: 'sent' | 'failed', errorMessage?: string) {
  try {
    await supabase.from('email_campaigns').insert({
      campaign_name: CAMPAIGN_NAME,
      user_id: userId,
      user_email: userEmail,
      status: status,
      resend_email_id: resendId,
      error_message: errorMessage
    })
  } catch (error: any) {
    console.error(`⚠️  Failed to track email for ${userEmail}:`, error.message)
    // Don't throw - we don't want tracking failures to stop the campaign
  }
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
        subject: 'New pricing for PromptVeo3 Pro - Now $14.99',
        html: getEmailHTML(user.name),
        text: getEmailText(user.name),
        tags: [
          { name: 'campaign', value: CAMPAIGN_NAME },
          { name: 'user_id', value: user.id }
        ]
      })
      
      if (error) {
        console.error(`❌ Failed to send to ${user.email}:`, error)
        results.failed++
        results.errors.push({ email: user.email, error: error.message })
        await trackEmailSent(user.id, user.email, undefined, 'failed', error.message)
      } else {
        console.log(`✅ Sent to ${user.email} (Resend ID: ${data?.id})`)
        results.sent++
        await trackEmailSent(user.id, user.email, data?.id, 'sent')
      }
      
      // Delay between emails to respect rate limit (2 req/sec = 500ms minimum)
      // Using 600ms to be safe (1.67 emails/sec)
      await new Promise(resolve => setTimeout(resolve, 600))
      
    } catch (error: any) {
      console.error(`❌ Exception sending to ${user.email}:`, error.message)
      results.failed++
      results.errors.push({ email: user.email, error: error.message })
      await trackEmailSent(user.id, user.email, undefined, 'failed', error.message)
    }
  }
  
  return results
}

async function getCampaignStats() {
  const { data, error } = await supabase
    .from('email_campaign_stats')
    .select('*')
    .eq('campaign_name', CAMPAIGN_NAME)
    .single()
  
  if (error) return null
  return data
}

async function main() {
  console.log('🚀 Starting Automated Email Campaign\n')
  console.log(`📋 Campaign: ${CAMPAIGN_NAME}`)
  console.log(`📊 Daily Limit: ${DAILY_LIMIT} emails\n`)
  
  // Validate environment
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not set')
  }
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase credentials are not set')
  }
  
  // Get users who haven't received the campaign yet
  const usersToSend = await getUsersNotSentYet()
  
  if (usersToSend.length === 0) {
    console.log('\n✅ Campaign complete! All users have received the email.')
    
    // Show final stats
    const stats = await getCampaignStats()
    if (stats) {
      console.log('\n📊 Final Campaign Statistics:')
      console.log('='.repeat(60))
      console.log(`Total sent: ${stats.total_sent}`)
      console.log(`Successful: ${stats.successful}`)
      console.log(`Failed: ${stats.failed}`)
      console.log(`Success rate: ${((stats.successful / stats.total_sent) * 100).toFixed(2)}%`)
      if (stats.opened > 0) {
        console.log(`\nOpened: ${stats.opened} (${stats.open_rate}%)`)
        console.log(`Clicked: ${stats.clicked} (${stats.click_rate}%)`)
      }
    }
    
    return
  }
  
  // Limit to daily quota
  const todaysBatch = usersToSend.slice(0, DAILY_LIMIT)
  const remaining = usersToSend.length - todaysBatch.length
  
  console.log(`📤 Sending to ${todaysBatch.length} users today`)
  if (remaining > 0) {
    console.log(`📅 ${remaining} users will be sent tomorrow (run this script again)`)
  }
  console.log()
  
  // Split into smaller batches
  const batches = []
  for (let i = 0; i < todaysBatch.length; i += BATCH_SIZE) {
    batches.push(todaysBatch.slice(i, i + BATCH_SIZE))
  }
  
  console.log(`📦 Processing ${batches.length} batches\n`)
  
  // Process batches
  const totalResults = {
    sent: 0,
    failed: 0,
    errors: [] as Array<{ email: string; error: string }>
  }
  
  for (let i = 0; i < batches.length; i++) {
    const batchNum = i + 1
    console.log(`📤 Batch ${batchNum}/${batches.length} (${batches[i].length} emails)`)
    
    const batchResults = await sendEmailBatch(batches[i])
    
    totalResults.sent += batchResults.sent
    totalResults.failed += batchResults.failed
    totalResults.errors.push(...batchResults.errors)
    
    console.log(`✅ Batch ${batchNum}: ${batchResults.sent} sent, ${batchResults.failed} failed\n`)
    
    // Wait between batches
    if (i < batches.length - 1) {
      console.log(`⏳ Waiting ${DELAY_BETWEEN_BATCHES / 1000} seconds...\n`)
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TODAY\'S SUMMARY')
  console.log('='.repeat(60))
  console.log(`Attempted: ${todaysBatch.length}`)
  console.log(`✅ Sent: ${totalResults.sent}`)
  console.log(`❌ Failed: ${totalResults.failed}`)
  console.log(`Success rate: ${((totalResults.sent / todaysBatch.length) * 100).toFixed(2)}%`)
  
  if (remaining > 0) {
    console.log(`\n📅 Run this script again tomorrow to send to ${remaining} more users`)
    console.log(`Estimated days remaining: ${Math.ceil(remaining / DAILY_LIMIT)}`)
  } else {
    console.log('\n🎉 All users have been sent emails!')
  }
  
  if (totalResults.errors.length > 0) {
    console.log(`\n⚠️  ${totalResults.errors.length} errors occurred:`)
    totalResults.errors.slice(0, 5).forEach(({ email, error }) => {
      console.log(`  - ${email}: ${error}`)
    })
    if (totalResults.errors.length > 5) {
      console.log(`  ... and ${totalResults.errors.length - 5} more`)
    }
  }
  
  console.log('\n✅ Run complete!')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Campaign failed:', error.message)
    process.exit(1)
  })
