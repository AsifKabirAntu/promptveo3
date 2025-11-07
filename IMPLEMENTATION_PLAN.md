# 🚀 PromptVeo3 Updates Implementation Plan

## Overview
This document outlines the implementation plan for two major updates to PromptVeo3:
1. **Paywall Community Prompts** - Add paywall to Veo3 prompt text in community section
2. **Update Pricing** - Change Pro plan from $29 to $49 (remove $79 reference)

---

## 📋 Update 1: Paywall Community Prompts

### Current State
- Community prompts are **completely free** to view
- Users can see:
  - ✅ Video thumbnails
  - ✅ Titles and descriptions
  - ✅ Full Veo3 prompt text
  - ✅ Tags and metadata
  - ✅ Copy and download buttons

### Target State
- Community prompts will be **partially paywalled**
- **Free users** can see:
  - ✅ Video thumbnails
  - ✅ Titles and descriptions
  - ✅ Tags and metadata
  - ❌ Veo3 prompt text (PAYWALLED)
  - ❌ Copy/Download buttons (PAYWALLED)
- **Pro users** can see:
  - ✅ Everything (full access)

### Files to Modify

#### 1. **Public Community Detail Page** (`src/app/community/[id]/page.tsx`)
- **Lines 389-520**: Veo3 Prompt section
- **Changes needed**:
  - Add paywall check before displaying prompt text
  - Show paywall component for free users
  - Hide Copy/Download buttons for free users
  - Keep video, title, description, tags visible for all users

#### 2. **Dashboard Community Detail Page** (`src/app/dashboard/community/[id]/page.tsx`)
- **Lines 282-309**: Prompt Text Card
- **Changes needed**:
  - Add paywall check before displaying prompt text
  - Show paywall component for free users
  - Hide Copy button for free users
  - Keep video, title, description visible for all users

#### 3. **Community Prompt Cards** (`src/components/dashboard/explore-library.tsx`)
- **Lines 47-152**: CommunityPromptCard component
- **Changes needed**:
  - Cards remain visible (no changes needed)
  - Only detail pages will be paywalled

### Implementation Steps

1. **Import necessary components**:
   ```typescript
   import { useAuth } from '@/components/auth/auth-provider'
   import { Paywall } from '@/components/ui/paywall'
   ```

2. **Add auth check**:
   ```typescript
   const { user, features, subscription } = useAuth()
   const isPro = subscription?.plan === 'pro' || features.canViewAllPrompts
   ```

3. **Wrap prompt content with conditional rendering**:
   ```typescript
   {isPro ? (
     // Show full prompt content
   ) : (
     // Show paywall
     <Paywall 
       title="Unlock Community Prompts"
       description="Upgrade to Pro to access full Veo3 prompts from our community"
       feature="view community prompts"
     />
   )}
   ```

### Testing Checklist
- [ ] Free user cannot see Veo3 prompt text
- [ ] Free user sees paywall with upgrade button
- [ ] Free user can still see video, title, description, tags
- [ ] Pro user can see full prompt text
- [ ] Pro user can copy/download prompts
- [ ] Paywall appears on both public and dashboard pages

---

## 💰 Update 2: Update Pricing ($29 → $49)

### Current State
- Pro plan: **$29** one-time
- Original price shown: **$79** (crossed out)
- "Early Bird" badge displayed

### Target State
- Pro plan: **$49** one-time
- Remove $79 reference completely
- Keep or update "Early Bird" badge (your choice)

### Files to Modify

#### 1. **Landing Page Pricing** (`src/components/landing/pricing.tsx`)
- **Line 26**: `price: "$29"` → `price: "$49"`
- **Line 40**: Remove or update `originalPrice: "$79"`
- **Line 41**: Update or remove `savings: "Early Bird"`

#### 2. **Paywall Component** (`src/components/ui/paywall.tsx`)
- **Line 93**: Remove `<span className="text-lg text-gray-500 line-through">$79</span>`
- **Line 94-96**: Remove "Early Bird" badge
- **Line 99**: `$29` → `$49`

#### 3. **Billing Page** (`src/app/dashboard/billing/page.tsx`)
- **Line 207**: `$29` → `$49`
- **Line 244**: Remove `<span className="text-xl text-gray-500 line-through">$79</span>`
- **Line 249**: `$29` → `$49`
- **Line 337**: `$29.00` → `$49.00`

#### 4. **Subscription Library** (`src/lib/subscriptions.ts`)
- **Line 219**: `return '$29'` → `return '$49'`

### Stripe Configuration Changes (YOUR ACTION REQUIRED)

⚠️ **IMPORTANT: You need to do this in Stripe Dashboard**

#### Step 1: Create New Price in Stripe
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** → Find "PromptVeo3 Pro (One-time)"
3. Click **Add another price**
4. Set price to: **$49.00**
5. Make sure it's **One-time** payment (not recurring)
6. **Save** and copy the new **Price ID** (starts with `price_`)

#### Step 2: Update Environment Variables

**In Vercel Dashboard:**
1. Go to your project → **Settings** → **Environment Variables**
2. Find `STRIPE_PRO_ONETIME_PRICE_ID`
3. Update the value to your new **$49 Price ID**
4. **Redeploy** your application

**In Local Development (.env.local):**
```bash
# Update this line:
STRIPE_PRO_ONETIME_PRICE_ID=price_YOUR_NEW_49_DOLLAR_PRICE_ID
```

#### Step 3: Test Payment Flow
1. Test checkout with new price
2. Verify webhook processes correctly
3. Confirm user gets Pro access
4. Check Stripe dashboard for successful payment

### Implementation Steps

1. **Update all price references** in code files (listed above)
2. **Create new Stripe price** ($49)
3. **Update environment variables** with new Price ID
4. **Remove $79 references** from all files
5. **Test thoroughly** before deploying

### Testing Checklist
- [ ] Landing page shows $49
- [ ] Paywall shows $49
- [ ] Billing page shows $49
- [ ] No $79 references anywhere
- [ ] Stripe checkout shows $49
- [ ] Payment processes successfully
- [ ] User gets Pro access after payment

---

## 🎯 Implementation Order

### Phase 1: Code Changes (I will do this)
1. ✅ Implement community prompt paywall
2. ✅ Update all price references to $49
3. ✅ Remove $79 references
4. ✅ Test locally

### Phase 2: Stripe Configuration (YOU need to do this)
1. ⚠️ Create new $49 price in Stripe Dashboard
2. ⚠️ Copy new Price ID
3. ⚠️ Update Vercel environment variables
4. ⚠️ Update local .env.local

### Phase 3: Testing (We both test)
1. Test community paywall (free vs pro users)
2. Test payment flow with new price
3. Verify webhook processing
4. Check all pages for correct pricing

### Phase 4: Deployment
1. Push code changes
2. Verify environment variables are set
3. Deploy to production
4. Monitor for issues

---

## 📝 Your Action Items

### Before I Start Coding:
- [ ] Confirm you want to proceed with both updates
- [ ] Confirm $49 is the final price (no going back after Stripe setup)
- [ ] Decide if you want to keep "Early Bird" badge or remove it

### After I Complete Coding:
- [ ] Create new $49 price in Stripe Dashboard
- [ ] Update `STRIPE_PRO_ONETIME_PRICE_ID` in Vercel
- [ ] Update `STRIPE_PRO_ONETIME_PRICE_ID` in .env.local
- [ ] Test payment flow
- [ ] Approve deployment

---

## ⚠️ Important Notes

1. **Existing Pro Users**: Will NOT be affected. They keep their $29 lifetime access.

2. **Stripe Price Change**: Once you create the new $49 price and update the environment variable, all new checkouts will use $49.

3. **No Refunds**: Make sure $49 is your final price before going live.

4. **Testing**: Test with Stripe test mode first before switching to live mode.

5. **Community Paywall**: This will affect ALL community prompts. Make sure this is what you want.

---

## ✅ IMPLEMENTATION COMPLETE!

**All code changes have been implemented:**
1. ✅ Community prompt paywall - DONE
2. ✅ Pricing updated to $49 - DONE
3. ✅ $79 references removed - DONE
4. ✅ "Early Bird" badges removed - DONE
5. ✅ Build successful - DONE

---

## 📝 NEXT STEPS (Your Action Required)

### Step 1: Update Stripe Product Price
1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Products**
2. Find your "PromptVeo3 Pro (One-time)" product
3. **Edit the existing price** from $29 to **$49**
4. Save the changes

**Important:** Since you're updating the existing product price (not creating a new one), you **DO NOT** need to change any environment variables. The existing `STRIPE_PRO_ONETIME_PRICE_ID` will automatically use the new $49 price.

### Step 2: Test the Changes
1. Test locally first (optional):
   ```bash
   npm run dev
   ```
   - Visit community prompts as a free user (should see paywall)
   - Visit community prompts as a pro user (should see full content)
   - Check pricing page shows $49
   - Check billing page shows $49

2. Deploy to production:
   ```bash
   git add .
   git commit -m "Update: Paywall community prompts & change pricing to $49"
   git push origin main
   ```

### Step 3: Verify in Production
- [ ] Community prompts show paywall for free users
- [ ] Community prompts accessible for pro users
- [ ] All pricing shows $49 (no $29 or $79 anywhere)
- [ ] Stripe checkout shows $49
- [ ] New purchases grant Pro access

---

## 📊 Summary of Changes

### Files Modified:
1. **Community Paywall:**
   - `src/app/community/[id]/page.tsx` - Public community detail page
   - `src/app/dashboard/community/[id]/page.tsx` - Dashboard community detail page

2. **Pricing Updates:**
   - `src/components/landing/pricing.tsx` - Landing page pricing
   - `src/components/ui/paywall.tsx` - Paywall component
   - `src/app/dashboard/billing/page.tsx` - Billing page
   - `src/lib/subscriptions.ts` - Subscription utilities

3. **Configuration:**
   - `tsconfig.json` - Excluded fluxframe directory
   - `next.config.mjs` - Added webpack config to ignore fluxframe

### What Free Users See Now:
- ✅ Community prompt videos
- ✅ Community prompt titles & descriptions
- ✅ Community prompt tags & metadata
- ❌ Veo3 prompt text (PAYWALLED)
- ❌ Copy/Download buttons (PAYWALLED)

### What Pro Users See:
- ✅ Everything (full access)

---

## 🎉 All Done!

Your code is ready. Just update the Stripe price and deploy! 🚀

