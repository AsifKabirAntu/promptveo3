# Product Analysis Usage Limits Implementation

## Overview

This implementation adds usage limits and paywall functionality to the product analysis feature, restricting photo uploads and prompt generation based on user subscription plans.

## Usage Limits

### Free Plan
- **1 photo upload** per month
- **1 prompt generation** per month
- **Cannot delete** uploaded photos

### Pro Plan
- **20 photo uploads** per month
- **40 prompt generations** per month
- **Can delete** uploaded photos

## Implementation Details

### Database Schema

#### New Table: `user_product_usage`
Tracks monthly usage per user:
```sql
CREATE TABLE user_product_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  month_year DATE NOT NULL, -- First day of month (e.g., 2024-01-01)
  uploads_used INTEGER DEFAULT 0,
  prompts_generated INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, month_year)
);
```

#### Database Functions
- `get_or_create_monthly_usage(user_uuid)` - Gets or creates current month usage record
- `increment_upload_usage(user_uuid)` - Increments upload count
- `increment_prompt_generation_usage(user_uuid)` - Increments prompt count
- `can_user_upload(user_uuid, user_plan)` - Checks if user can upload
- `can_user_generate_prompt(user_uuid, user_plan)` - Checks if user can generate prompts

### TypeScript Implementation

#### Types (`src/features/product-analysis/types/usage.ts`)
```typescript
interface UsageLimits {
  maxUploads: number
  maxPrompts: number
  uploadsUsed: number
  promptsUsed: number
  uploadsRemaining: number
  promptsRemaining: number
  canUpload: boolean
  canGeneratePrompt: boolean
}
```

#### API Service (`src/features/product-analysis/services/usage-api.ts`)
- `getUserUsageLimits()` - Gets current usage limits for user
- `canUserUpload()` - Checks upload permissions
- `canUserGeneratePrompt()` - Checks prompt generation permissions
- `canUserDeleteProduct()` - Checks delete permissions (Pro only)
- `incrementUploadUsage()` - Tracks upload usage
- `incrementPromptGenerationUsage()` - Tracks prompt generation usage

#### React Hook (`src/features/product-analysis/hooks/useProductUsage.ts`)
Manages usage data for UI components:
```typescript
const { limits, canDelete, loading, error, refreshUsage } = useProductUsage()
```

### UI Components Updates

#### ProductLibrary Component
- **Usage Stats Card**: Shows monthly limits and current usage
- **Upload Button**: Disabled when limit reached, shows paywall
- **Grid Props**: Passes delete permissions to product cards

#### ProductCard Component
- **Delete Button**: Hidden for free users with "Pro required" message
- **Conditional Actions**: Based on user permissions

#### PromptGenerationWizard Component
- **Usage Check**: Validates before generating prompts
- **Paywall Integration**: Shows upgrade prompt when limit reached

### API Routes Updates

#### Upload Product (`src/features/product-analysis/services/api.ts`)
```typescript
// Check limits before upload
const canUpload = await canUserUpload()
if (!canUpload) {
  throw new Error('Upload limit reached...')
}

// Track usage after successful upload
await incrementUploadUsage()
```

#### Generate Prompt (`src/app/api/product-analysis/generate-prompt/route.ts`)
```typescript
// Check limits before generation
const { data: canGenerate } = await supabase.rpc('can_user_generate_prompt', {
  user_uuid: product.user_id,
  user_plan: userPlan
})

// Track usage after successful generation
await supabase.rpc('increment_prompt_generation_usage', {
  user_uuid: product.user_id
})
```

### Paywall Integration

#### Upload Paywall
Triggered when:
- Free user tries to upload after reaching limit (1 photo)
- Shows upgrade message for 20 uploads per month

#### Prompt Generation Paywall
Triggered when:
- User tries to generate prompt after reaching limit
- Shows upgrade message for 40 prompts per month

#### Delete Restriction
- Free users see "Pro required" instead of delete button
- No paywall modal needed (passive restriction)

## Usage Tracking Logic

### Monthly Reset
- Usage resets automatically on the 1st of each month
- Database stores first day of month (e.g., 2024-01-01)
- Functions automatically create new records for new months

### Counting Rules
1. **Upload Counting**: Incremented immediately after successful upload
2. **Prompt Counting**: Incremented after successful prompt generation
3. **Delete Impact**: Deleting a photo does NOT restore upload count
4. **Error Handling**: Usage tracking failures don't break core functionality

### Subscription Integration
- Fetches user plan from `profiles.plan` or `subscriptions.plan`
- Defaults to 'free' if no subscription found
- Real-time limit checking based on current subscription status

## Setup Instructions

### 1. Database Migration
```bash
npm run setup-product-usage-tracking
```

### 2. Environment Variables
Ensure these are set:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### 3. Database Functions
Run the SQL file to create functions:
```sql
-- Located in: database/product-analysis-usage-tracking.sql
```

## Testing

### Manual Testing Scenarios

1. **Free User Upload Limit**:
   - Upload 1 photo ✓
   - Try to upload 2nd photo → Paywall shown

2. **Free User Prompt Limit**:
   - Generate 1 prompt ✓
   - Try to generate 2nd prompt → Paywall shown

3. **Free User Delete Restriction**:
   - Try to delete photo → "Pro required" message

4. **Pro User Higher Limits**:
   - Upload up to 20 photos ✓
   - Generate up to 40 prompts ✓
   - Delete photos ✓

5. **Monthly Reset**:
   - Usage counts reset on 1st of new month

### Database Testing
```sql
-- Check usage for a user
SELECT * FROM user_product_usage WHERE user_id = 'user-uuid';

-- Test functions
SELECT get_or_create_monthly_usage('user-uuid');
SELECT can_user_upload('user-uuid', 'free');
```

## Security Considerations

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own usage data
- Server-side validation in API routes

### Client vs Server Validation
- Client-side checks for UX (immediate feedback)
- Server-side enforcement in API routes (security)
- Database functions provide final validation layer

### Usage Tracking Integrity
- Atomic operations for usage increments
- Error handling prevents data corruption
- Audit trail via timestamps

## Performance Considerations

### Database Indexing
```sql
CREATE INDEX idx_user_product_usage_user_month ON user_product_usage(user_id, month_year);
```

### Caching Strategy
- React hook caches usage data
- Refresh triggered after uploads/generations
- Monthly data is relatively stable

### Query Optimization
- Single query for usage + subscription data
- Efficient RPC functions for limit checking
- Minimal database round trips

## Monitoring & Analytics

### Usage Metrics to Track
- Upload/prompt usage by plan type
- Paywall conversion rates
- Feature adoption rates
- Monthly active users by plan

### Error Monitoring
- Usage tracking failures
- Limit check errors
- Database function performance

## Future Enhancements

### Potential Improvements
1. **Usage History**: Track historical usage data
2. **Usage Warnings**: Notify users approaching limits
3. **Overage Handling**: Allow temporary overages with billing
4. **Team Plans**: Shared usage pools for organizations
5. **Usage Analytics**: Dashboard for users to track usage

### Extensibility
- Easy to add new usage types (e.g., downloads, shares)
- Configurable limits via database settings
- Support for custom billing cycles 