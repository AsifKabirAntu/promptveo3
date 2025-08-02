# 🚀 Stripe Subscription Setup Guide

This guide will walk you through setting up Stripe payments for your PromptVeo3 subscription system.

## 📋 Prerequisites

- Stripe account (sign up at [stripe.com](https://stripe.com))
- Your PromptVeo3 app deployed on Vercel
- Access to your Supabase dashboard

## 🔧 Step 1: Stripe Dashboard Setup

### 1.1 Create Products and Prices

1. **Login to Stripe Dashboard** → [dashboard.stripe.com](https://dashboard.stripe.com)

2. **Create Pro Monthly Product:**
   - Go to **Products** → **Add Product**
   - Name: `PromptVeo3 Pro Monthly`
   - Description: `Unlimited access to all prompts and features`
   - Pricing: `$14.99/month`
   - Save the **Price ID** (starts with `price_`)

3. **Create Pro Yearly Product:**
   - Go to **Products** → **Add Product**
   - Name: `PromptVeo3 Pro Yearly`
   - Description: `Unlimited access to all prompts and features (annual)`
   - Pricing: `$120/year`
   - Save the **Price ID** (starts with `price_`)

### 1.2 Configure Webhook Endpoint

1. **Go to Webhooks** → **Add endpoint**
2. **Endpoint URL:** `https://www.promptveo3.com/api/billing/webhook`
3. **Events to send:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. **Save the webhook** and copy the **Signing Secret** (starts with `whsec_`)

### 1.3 Get API Keys

1. **Go to Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_`)
3. Copy your **Secret key** (starts with `sk_`)

## 🔧 Step 2: Environment Variables

### 2.1 Local Development (.env.local)

Create a `.env.local` file in your project root with:

```bash
# Stripe Configuration (Sandbox Keys)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Product Price IDs
STRIPE_PRO_MONTHLY_PRICE_ID=price_your_monthly_price_id_here
STRIPE_PRO_YEARLY_PRICE_ID=price_your_yearly_price_id_here
```

### 2.2 Vercel Production

Add the same environment variables to your Vercel project:

1. **Go to Vercel Dashboard** → Your project → **Settings** → **Environment Variables**
2. **Add each variable:**
   - `STRIPE_SECRET_KEY` (use sandbox key for now)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (use sandbox key for now)
   - `STRIPE_WEBHOOK_SECRET` (use sandbox webhook secret)
   - `STRIPE_PRO_MONTHLY_PRICE_ID`
   - `STRIPE_PRO_YEARLY_PRICE_ID`

## 🔧 Step 3: Database Setup

### 3.1 Create Subscriptions Table

Run this SQL in your Supabase SQL editor:

```sql
-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subscription_id TEXT NOT NULL,
  status TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);
```

## 🔧 Step 4: Testing

### 4.1 Local Testing

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test the billing page:**
   - Go to `/dashboard/billing`
   - Should show your current plan (Free)
   - Click "Upgrade to Pro" buttons

3. **Test feature gating:**
   - Try to favorite a prompt (should show paywall)
   - Try to remix a prompt (should show paywall)
   - Try to view JSON in timeline prompts (should show paywall)
   - Try to create a new prompt (should show paywall)

### 4.2 Production Testing

1. **Deploy to Vercel:**
   ```bash
   git add .
   git commit -m "Add Stripe subscription system"
   git push
   ```

2. **Test in production:**
   - Visit your live site
   - Test all the same features as local testing

## 🔧 Step 5: Going Live

When ready for real payments:

1. **Switch to Live mode** in Stripe Dashboard
2. **Get new Live keys** (starts with `sk_live_` and `pk_live_`)
3. **Update Vercel environment variables** with live keys
4. **Create new webhook** with live endpoint
5. **Test with real payment methods**

## 🎯 Current Status

✅ **Completed:**
- Stripe API integration
- Subscription management system
- Feature gating for free users
- Paywall components
- Billing page
- Webhook handling

🔄 **In Progress:**
- Environment variable setup
- Testing in localhost

📋 **Next Steps:**
1. Add your Stripe keys to `.env.local`
2. Test the billing page locally
3. Verify all paywall features work
4. Deploy to production

## 🆘 Troubleshooting

### Common Issues:

1. **"Neither apiKey nor config.authenticator provided"**
   - Make sure `STRIPE_SECRET_KEY` is set in `.env.local`

2. **Billing page shows blank**
   - Check that all Stripe environment variables are set
   - Verify the Stripe keys are correct

3. **Paywall not showing**
   - Check that `useAuth` is properly imported
   - Verify subscription features are being calculated correctly

4. **Webhook not working**
   - Make sure webhook URL is correct
   - Verify webhook secret is set
   - Check Stripe dashboard for webhook delivery status

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify all environment variables are set
3. Test with Stripe's test card numbers
4. Check Stripe dashboard for webhook events

**Test Card Numbers:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002` 