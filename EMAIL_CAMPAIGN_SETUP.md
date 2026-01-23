# Email Campaign Setup Guide - $14.99 Price Drop

This guide will help you send a mass email campaign to all 1000 users in your Supabase database announcing the new pricing.

## 📋 Prerequisites

1. **Resend Account** (free tier works great)
2. **Verified Domain** in Resend
3. **Supabase Service Role Key**

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Resend

```bash
npm install resend
```

### Step 2: Sign up for Resend

1. Go to [https://resend.com](https://resend.com)
2. Sign up for free (allows 100 emails/day, 3,000/month)
3. For 1000 users, you can:
   - **Option A**: Send over 10 days (100/day on free plan)
   - **Option B**: Upgrade to paid plan ($20/month for 50,000 emails)

### Step 3: Verify Your Domain

1. Go to Resend Dashboard → **Domains**
2. Click **Add Domain**
3. Add your domain (e.g., `promptveo3.com`)
4. Add the DNS records they provide to your domain registrar:
   - **SPF** record
   - **DKIM** record
   - **DMARC** record (optional but recommended)
5. Wait for verification (usually 5-30 minutes)

**Alternative**: Use Resend's free test domain `onboarding.resend.dev` (but may have lower deliverability)

### Step 4: Get API Key

1. Go to Resend Dashboard → **API Keys**
2. Click **Create API Key**
3. Name it: `PromptVeo3 Campaign`
4. Copy the API key (starts with `re_`)

### Step 5: Add Environment Variables

Add to your `.env.local`:

```env
# Resend API Key
RESEND_API_KEY=re_your_api_key_here

# Make sure you have these (you should already)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 6: Update Email Configuration

Edit `scripts/send-price-announcement-email.ts`:

```typescript
// Line 18: Change this to your verified domain
const FROM_EMAIL = 'team@promptveo3.com' // ← Update this!
const FROM_NAME = 'PromptVeo3 Team'
```

---

## 📧 Sending the Campaign

### Test First (Highly Recommended!)

Send a test email to yourself:

```bash
npm run test-price-email
```

This sends one email to a test address to verify everything looks good.

### Send to All Users

When you're ready to send to all 1000 users:

```bash
npm run send-price-email
```

**The script will:**
1. Fetch all users with confirmed emails from Supabase
2. Show you a 10-second confirmation countdown
3. Send emails in batches of 50 (to avoid rate limits)
4. Wait 1 minute between batches
5. Show real-time progress
6. Provide a final summary with success/failure rates

**Estimated Time:**
- Free plan (100/day): ~10 days
- Paid plan: ~30 minutes (with batching)

---

## ✅ Best Practices

### 1. **Test First**
Always send to yourself or a small test group first!

### 2. **Check Spam Score**
Use [Mail Tester](https://www.mail-tester.com) to check your email before sending

### 3. **Monitor Deliverability**
Check Resend Dashboard for:
- Delivery rate
- Bounce rate
- Spam complaints

### 4. **Respect Unsubscribes**
The email includes an unsubscribe link. You should implement this endpoint.

### 5. **Timing Matters**
Best times to send:
- **Tuesday-Thursday**
- **10 AM - 2 PM** in recipient's timezone
- Avoid Mondays (inbox overload) and Fridays (weekend mode)

---

## 🎨 Customizing the Email

The email template is in `scripts/send-price-announcement-email.ts`:

### Change the Subject Line
```typescript
subject: '🎉 Special Offer: Pro Plan Now Just $14.99 (Limited Time!)',
```

### Modify the Content
Edit the `getEmailHTML()` function (line 27)

### Update Colors/Branding
Look for these in the HTML:
- Blue: `#2563eb` (your primary color)
- Green checkmarks: `#10b981`

---

## 📊 Resend Pricing Plans

| Plan | Price | Emails/Month | Best For |
|------|-------|-------------|----------|
| Free | $0 | 3,000 | Testing, small campaigns |
| Growth | $20 | 50,000 | One-time campaigns |
| Business | $80 | 250,000 | Regular campaigns |

**Recommendation for 1000 users:**
- **One-time campaign**: Free plan over 10 days OR Growth plan for $20 (instant)
- **Regular campaigns**: Growth plan at $20/month

---

## 🔧 Troubleshooting

### "RESEND_API_KEY is not set"
- Check your `.env.local` file
- Make sure it's in the project root
- Restart your terminal/IDE

### "Failed to fetch users"
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase project status
- Ensure auth.users table has users

### "Domain not verified"
- Check DNS records in your domain registrar
- Wait 30 minutes for propagation
- Use `onboarding.resend.dev` as temporary alternative

### High Bounce Rate
- Users might have invalid emails
- Check Supabase for email_confirmed_at
- Clean your email list regularly

### Low Open Rate
- Improve subject line (use A/B testing)
- Send during optimal times
- Verify sender domain reputation

---

## 📈 Expected Results

Based on industry standards for promotional emails:

| Metric | Expected | Good | Excellent |
|--------|----------|------|-----------|
| Delivery Rate | 95%+ | 98%+ | 99%+ |
| Open Rate | 15-20% | 25-30% | 35%+ |
| Click Rate | 2-3% | 5-7% | 10%+ |
| Conversion | 1-2% | 3-5% | 7%+ |

**For 1000 users:**
- ~950 delivered
- ~200 opens (20%)
- ~30 clicks (3%)
- ~10-20 conversions (1-2%)

---

## 🔐 Security Notes

1. **Never commit** your Resend API key to git
2. Use `.env.local` (already in `.gitignore`)
3. Service role key should only be used in secure scripts
4. Regularly rotate API keys

---

## 📞 Support

**Resend Support:**
- Docs: [https://resend.com/docs](https://resend.com/docs)
- Email: support@resend.com
- Discord: [Join here](https://discord.gg/resend)

**Questions?**
Check the script comments or Resend documentation.

---

## ✨ After Sending

1. Monitor Resend Dashboard for delivery stats
2. Track conversions in your Stripe dashboard
3. Respond to any customer replies promptly
4. Plan follow-up campaigns based on results

Good luck with your campaign! 🚀
