# Automated Email Campaign System 🤖

This guide explains how to use the **automated email campaign system** that tracks sent emails and can run daily until all 1000 users receive the price drop announcement.

## 🎯 How It Works

### The Problem
- Resend free plan: 100 emails/day
- You have 1000 users
- Takes 10 days to reach everyone
- Need to avoid sending duplicates

### The Solution
**Automated tracking system** that:
1. ✅ Tracks who has received emails in Supabase
2. ✅ Only sends to users who haven't received the campaign yet  
3. ✅ Respects daily limits (95/day, saving 5 for other emails)
4. ✅ Can run daily automatically via cron/GitHub Actions
5. ✅ Provides real-time progress and statistics

---

## 🚀 Quick Start

### Step 1: Set Up Database Tracking

Run the SQL migration to create the tracking table:

```bash
# Option 1: Via psql
psql -h your-supabase-host -U postgres -d postgres -f database/email-campaigns.sql

# Option 2: In Supabase Dashboard
# Copy the content of database/email-campaigns.sql
# Paste into Supabase SQL Editor and run
```

This creates:
- `email_campaigns` table (tracks sent emails)
- `email_campaign_stats` view (real-time statistics)

### Step 2: Test the System

Send yourself a test email first:

```bash
npm run test-price-email
```

### Step 3: Run Daily Campaign

**Manual (run yourself each day):**
```bash
npm run send-price-campaign
```

**Automated (GitHub Actions - runs daily at 10 AM EST):**
See "GitHub Actions Automation" section below.

---

## 📊 How The Tracking Works

### First Run
```
Day 1:
- Checks database: 0 users sent
- Sends to first 95 users
- Records all 95 in database
- Shows: "905 users remaining, 10 days left"
```

### Subsequent Runs
```
Day 2:
- Checks database: 95 users already sent
- Sends to next 95 users (users 96-190)
- Records these 95 in database
- Shows: "810 users remaining, 9 days left"

Day 3:
- Checks database: 190 users already sent
- Sends to next 95 users (users 191-285)
- And so on...
```

### Completion
```
Day 11:
- Checks database: 950 users already sent
- Sends to final 50 users
- Shows: "Campaign complete! All 1000 users reached."
```

---

## 🔧 Configuration Options

Edit `scripts/send-price-campaign-auto.ts`:

```typescript
// Campaign identifier (change for different campaigns)
const CAMPAIGN_NAME = 'price-drop-jan-2026'

// Daily sending limit
const DAILY_LIMIT = 95 // Free plan: leaves 5 for other emails

// Batch size (for rate limiting)
const BATCH_SIZE = 50 // Send 50, wait, send 45

// Delay between batches
const DELAY_BETWEEN_BATCHES = 5000 // 5 seconds

// From email (must be verified in Resend)
const FROM_EMAIL = 'info@promptveo3.com'
const FROM_NAME = 'PromptVeo3 Team'
```

---

## 🤖 GitHub Actions Automation

### Setup (One-time)

1. **Add Secrets to GitHub:**
   - Go to: Settings → Secrets and variables → Actions
   - Add these secrets:
     - `RESEND_API_KEY` - Your Resend API key
     - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase URL
     - `SUPABASE_SERVICE_ROLE_KEY` - Your service role key

2. **Enable GitHub Actions:**
   - Go to: Actions tab in your repo
   - Enable workflows if disabled

3. **The workflow will run automatically every day at 10 AM EST**

### Manual Trigger

You can also trigger manually:
1. Go to: Actions → Daily Email Campaign
2. Click "Run workflow"
3. Click green "Run workflow" button

### Monitor Progress

1. Go to: Actions tab
2. Click on the latest "Daily Email Campaign" run
3. View logs to see:
   - How many emails were sent
   - Success/failure rates
   - Remaining users
   - Estimated days left

---

## 📈 Campaign Statistics

### View Real-Time Stats

Run this in Supabase SQL Editor:

```sql
SELECT * FROM email_campaign_stats 
WHERE campaign_name = 'price-drop-jan-2026';
```

You'll see:
```
campaign_name         | price-drop-jan-2026
total_sent           | 95
successful           | 94
failed              | 1
opened              | 18
clicked             | 3
first_sent          | 2026-01-23 15:00:00
last_sent           | 2026-01-23 15:05:00
open_rate           | 19.15%
click_rate          | 3.19%
```

### View Individual Sends

```sql
SELECT 
  user_email,
  status,
  sent_at,
  opened_at,
  clicked_at,
  error_message
FROM email_campaigns
WHERE campaign_name = 'price-drop-jan-2026'
ORDER BY sent_at DESC
LIMIT 100;
```

---

## 🔄 Running Multiple Campaigns

To run a different campaign:

1. **Change the campaign name** in `scripts/send-price-campaign-auto.ts`:
```typescript
const CAMPAIGN_NAME = 'follow-up-feb-2026' // New campaign
```

2. **Update the email content** (optional):
```typescript
const getEmailHTML = (userName?: string) => `
  <!-- Your new email template -->
`
```

3. **Run the campaign:**
```bash
npm run send-price-campaign
```

The system will start fresh for the new campaign name!

---

## 🛠️ Troubleshooting

### "Table email_campaigns doesn't exist"

Run the migration:
```bash
psql -f database/email-campaigns.sql
```

Or copy `database/email-campaigns.sql` into Supabase SQL Editor.

### "All users already received email"

Check the database:
```sql
SELECT COUNT(*) FROM email_campaigns 
WHERE campaign_name = 'price-drop-jan-2026';
```

To reset (⚠️ USE WITH CAUTION):
```sql
DELETE FROM email_campaigns 
WHERE campaign_name = 'price-drop-jan-2026';
```

### "Rate limit exceeded"

- Free plan: 100/day limit
- Wait 24 hours for reset
- Or upgrade to paid plan

### Emails not being tracked

Check Service Role permissions:
```sql
GRANT ALL ON email_campaigns TO service_role;
```

---

## 📅 Daily Schedule

If using free plan (100/day):

| Day | Users Sent | Total Sent | Remaining |
|-----|------------|------------|-----------|
| 1   | 95         | 95         | 905       |
| 2   | 95         | 190        | 810       |
| 3   | 95         | 285        | 715       |
| 4   | 95         | 380        | 620       |
| 5   | 95         | 475        | 525       |
| 6   | 95         | 570        | 430       |
| 7   | 95         | 665        | 335       |
| 8   | 95         | 760        | 240       |
| 9   | 95         | 855        | 145       |
| 10  | 95         | 950        | 50        |
| 11  | 50         | 1000       | **0** ✅  |

---

## 💰 Upgrade to Send Faster

### Resend Plans

| Plan | Price | Emails/Day | Days for 1000 |
|------|-------|------------|---------------|
| Free | $0 | 100 | 11 days |
| Growth | $20/mo | 50,000 | **1 day** |

To send all 1000 in one day:
1. Upgrade to Resend Growth plan
2. Change `DAILY_LIMIT` to `1000`
3. Run the script once

---

## ✅ Best Practices

### 1. **Run at Optimal Times**
- **Best**: Tuesday-Thursday, 10 AM - 2 PM
- **Good**: Monday-Friday, 9 AM - 5 PM
- **Avoid**: Weekends, late evenings

Default GitHub Action time: 10 AM EST (modify in `.github/workflows/email-campaign-daily.yml`)

### 2. **Monitor Open Rates**
Check after first 100 sends:
- **Good**: 20%+ open rate
- **Poor**: <10% open rate

If poor, improve subject line before continuing.

### 3. **Check Spam Reports**
Monitor Resend Dashboard:
- **Healthy**: <0.1% spam reports
- **Warning**: >0.5% spam reports

If high, review email content.

### 4. **Respond to Replies**
Users might reply with questions - check your inbox daily!

---

## 🔐 Security Notes

1. **Never commit** API keys or secrets
2. **Use GitHub Secrets** for automation
3. **Service role key** should only be used in secure scripts
4. **Rotate keys** every 90 days

---

## 📊 Expected Results

### Email Metrics (Industry Average)

| Metric | Expected | Your Goal |
|--------|----------|-----------|
| Delivery Rate | 95%+ | 98%+ |
| Open Rate | 15-25% | 20%+ |
| Click Rate | 2-5% | 3%+ |
| Conversion | 1-3% | 2%+ |

### Revenue Projection

For 1000 users at 2% conversion rate:
- **20 conversions** × $14.99 = **$299.80**
- Covers Resend paid plan + profit!

---

## 🚨 Emergency Stop

To pause the campaign:

### Option 1: Disable GitHub Action
1. Go to: `.github/workflows/email-campaign-daily.yml`
2. Comment out the `schedule` section
3. Commit and push

### Option 2: Change Daily Limit
```typescript
const DAILY_LIMIT = 0 // Stops all sending
```

### Option 3: Mark All as Sent
```sql
-- Insert dummy records (they won't be sent again)
INSERT INTO email_campaigns (campaign_name, user_id, user_email, status)
SELECT 
  'price-drop-jan-2026',
  id,
  email,
  'paused'
FROM auth.users
WHERE email NOT IN (
  SELECT user_email FROM email_campaigns 
  WHERE campaign_name = 'price-drop-jan-2026'
);
```

---

## 📞 Support

**Issues?**
- Check Resend Dashboard for delivery status
- View Supabase logs for database errors  
- Check GitHub Actions logs for automation issues

**Questions?**
- Review this guide
- Check `EMAIL_CAMPAIGN_SETUP.md`
- Consult Resend documentation

---

## ✨ Summary

```bash
# Setup (once)
npm install resend
psql -f database/email-campaigns.sql

# Test (once)
npm run test-price-email

# Run daily (manual)
npm run send-price-campaign

# Or set up GitHub Actions for full automation
# It will run daily at 10 AM EST automatically!
```

**Result:** All 1000 users receive emails over 11 days (free plan) or 1 day (paid plan), with zero duplicates and full tracking! 🎉
