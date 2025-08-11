# 🚀 Stripe Payment Setup Guide (Updated for One-time Payments)

This guide will walk you through setting up Stripe payments for your PromptVeo3 one-time payment system.

## 📋 Prerequisites

- Stripe account (sign up at [stripe.com](https://stripe.com))
- Your PromptVeo3 app deployed on Vercel
- Access to your Supabase dashboard

## 🔧 Step 1: Stripe Dashboard Setup

### 1.1 Create Products and Prices

1. **Login to Stripe Dashboard** → [dashboard.stripe.com](https://dashboard.stripe.com)

2. **Create Pro One-time Product (PRIMARY):**
   - Go to **Products** → **Add Product**
   - Name: `PromptVeo3 Pro (One-time)`
   - Description: `Lifetime access to all prompts and features - Early Bird Special`
   - Pricing: `$29.00` (ONE-TIME payment, not recurring)
   - **Important**: Make sure pricing model is set to "One-time" not "Recurring"
   - Save the **Price ID** (starts with `price_`) - you'll need this

3. **Legacy Subscription Products (Optional - for backward compatibility):**
   - **Pro Monthly:** `$14.99/month` (keep existing if you have users)
   - **Pro Yearly:** `$120/year` (keep existing if you have users)

### 1.2 Configure Webhook Endpoint

1. **Go to Webhooks** → **Add endpoint** (or update existing)
2. **Endpoint URL:** `https://www.promptveo3.com/api/billing/webhook`
3. **Events to send:**
   - `checkout.session.completed` ⭐ (CRITICAL for one-time payments)
   - `customer.subscription.created` (legacy)
   - `customer.subscription.updated` (legacy)
   - `customer.subscription.deleted` (legacy)
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
STRIPE_PRO_ONETIME_PRICE_ID=price_your_onetime_price_id_here

# Legacy Price IDs (Optional - for backward compatibility)
STRIPE_PRO_MONTHLY_PRICE_ID=price_your_monthly_price_id_here
STRIPE_PRO_YEARLY_PRICE_ID=price_your_yearly_price_id_here
```

### 2.2 Vercel Production

Add the same environment variables to your Vercel project:

1. **Go to Vercel Dashboard** → Your project → **Settings** → **Environment Variables**
2. **Add each variable:**
   - `STRIPE_SECRET_KEY` (use sandbox key for testing, production key for live)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (use sandbox key for testing, production key for live)
   - `STRIPE_WEBHOOK_SECRET` (use sandbox webhook secret for testing)
   - `STRIPE_PRO_ONETIME_PRICE_ID` ⭐ **REQUIRED**
   - `STRIPE_PRO_MONTHLY_PRICE_ID` (optional - legacy)
   - `STRIPE_PRO_YEARLY_PRICE_ID` (optional - legacy)

## 🔧 Step 3: Database Setup

### 3.1 Subscription Table (Already exists)

The existing subscriptions table will work for one-time payments. One-time purchases are stored as:
- `subscription_id`: `onetime_{stripe_session_id}`
- `status`: `active`
- `plan`: `pro`
- `current_period_end`: `null` (indicates lifetime access)

## 🔧 Step 4: Testing

### 4.1 Test One-time Payment Flow

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Test the billing page:**
   - Go to `/dashboard/billing`
   - Click "Get Early Bird Deal" 
   - Use Stripe test card: `4242 4242 4242 4242`
   - Complete the checkout

3. **Verify webhook processing:**
   - Check your Vercel function logs
   - Verify user gets Pro access
   - Check database for subscription record

### 4.2 Test Cards (Sandbox Mode)

- **Success:** `4242 4242 4242 4242`
- **Declined:** `4000 0000 0000 0002`
- **Requires 3D Secure:** `4000 0000 0000 3220`

## 🚀 Step 5: Going Live

### 5.1 Switch to Production

1. **Update Stripe keys** in Vercel environment variables:
   - Replace `sk_test_` with `sk_live_`
   - Replace `pk_test_` with `pk_live_`

2. **Create production webhook** endpoint in Stripe Dashboard

3. **Test with real payment** (small amount first!)

### 5.2 Important Notes

- ✅ One-time payments = lifetime access
- ✅ No recurring billing
- ✅ Existing subscription users are grandfathered
- ✅ New users get $29 Early Bird pricing
- ⚠️ Test thoroughly before going live!

## 🛠️ Troubleshooting

### Common Issues:

1. **"Stripe products not configured"** → Check `STRIPE_PRO_ONETIME_PRICE_ID` is set
2. **Webhook not working** → Verify webhook endpoint URL and events
3. **User not getting Pro access** → Check function logs for webhook errors
4. **Payment succeeds but no access** → Verify database subscription record

### Debug Steps:

1. Check Vercel function logs: `vercel logs`
2. Check Stripe webhook delivery in dashboard
3. Check database subscription table
4. Verify environment variables are set correctly 