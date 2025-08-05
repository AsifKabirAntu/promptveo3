# PromptVeo3 - Feature Documentation

## Overview

**PromptVeo3** is a modern web application designed to help creators generate, manage, and share cinematic prompts specifically engineered for Google's Veo 3 AI video generation platform. The app provides a comprehensive library of professional-grade prompts with advanced editing, customization, and export capabilities.

### Core Value Proposition
- **Curated Library**: Browse hundreds of professionally crafted cinematic prompts
- **Smart Editing**: Intuitive editor with live JSON preview for Veo 3 compatibility
- **Export Ready**: One-click JSON export in perfect Veo 3 format
- **Timeline Support**: Advanced timeline-based prompt creation for complex video sequences
- **Other Features**: Save favorites, remix prompts, and downlaod.

---

## 🎬 Core Features

### 1. Prompt Library & Browsing

#### Regular Prompts
Regular prompts contain structured cinematic elements:
- **Description**: Scene overview and concept
- **Style**: Visual aesthetic (e.g., "cinematic, photorealistic, 4K")
- **Camera**: Camera movement and positioning
- **Lighting**: Lighting setup and mood
- **Environment**: Scene setting and location
- **Elements**: Array of visual components and objects
- **Motion**: Movement and action descriptions
- **Ending**: Scene conclusion and final frame
- **Text**: Overlay text (usually "none")
- **Keywords**: Searchable tags and categories

#### Timeline Prompts
Advanced prompts with time-based sequences:
- **Base Style**: Overall visual treatment
- **Aspect Ratio**: Video dimensions (16:9, 1:1, etc.)
- **Scene Description**: Detailed scene setup
- **Camera Setup**: Camera positioning and movement
- **Lighting**: Lighting configuration
- **Negative Prompts**: What to avoid in generation
- **Timeline Sequence**: Array of time-stamped actions
  - Sequence number
  - Timestamp (e.g., "00:00-00:02")
  - Action description
  - Audio cues

### 2. Search & Filtering System

#### Advanced Search Capabilities
- **Text Search**: Full-text search across titles and descriptions
- **Category Filters**: Filter by content categories (Lifestyle, Creative, AI Robotics, etc.)
- **Style Filters**: Filter by visual styles and techniques
- **Timeline Filter**: Toggle between:
  - All prompts (regular + timeline)
  - Timeline prompts only
  - Regular prompts only

#### Smart Filtering
- Real-time search with instant results
- Keyword-based matching
- Case-insensitive search
- Multiple filter combinations

### 3. User Authentication & Authorization

#### Authentication System
- **Email/Password**: Standard account creation
- **Google OAuth**: Social login integration
- **Session Management**: Persistent login with secure token handling
- **Protected Routes**: Automatic redirection for unauthorized access

#### User Profiles
- **Profile Management**: Personal information and preferences
- **Usage Tracking**: Monitor prompt views, exports, and remixes
- **Subscription Status**: Track plan and billing information

### 4. Subscription & Billing System

#### Plan Tiers

**Free Plan**
- Browse all prompts in the library (unlimited viewing of prompt cards)
- View details for 4 specific prompts (2 regular + 2 timeline - fixed selection)
- Basic search and filters
- ❌ JSON export for Veo 3
- ❌ Save favorites
- ❌ Remix prompts
- ❌ Create custom prompts
- ❌ Can't view JSON of timeline prompts (even for the 2 viewable ones)

**Pro Plan ($14.99/month or $120/year)**
- ✅ Unlimited prompt access
- ✅ Browse entire prompt library
- ✅ Advanced search and filters
- ✅ JSON export for Veo 3
- ✅ Save to personal library
- ✅ Remix prompts
- ✅ Create custom prompts
- ✅ Priority support

#### Billing Features
- **Stripe Integration**: Secure payment processing
- **Subscription Management**: Upgrade, downgrade, cancel
- **Billing Portal**: Manage payment methods and invoices
- **Webhook Handling**: Real-time subscription status updates

---

## 🎯 Dashboard Features

### Navigation Structure

The dashboard provides organized access to all features:

1. **Explore Library** (`/dashboard`) - Main prompt browsing interface
2. **Favorites** (`/dashboard/favorites`) - Saved prompts collection
3. **My Prompts** (`/dashboard/my-prompts`) - User-created prompts
4. **Create Prompt** (`/dashboard/create`) - Prompt creation interface
5. **Billing** (`/dashboard/billing`) - Subscription and payment management
6. **Account** (`/dashboard/account`) - Profile and settings

### Main Library Interface

#### Display Features
- **Grid Layout**: Card-based prompt display
- **Live Preview**: Hover effects and quick preview
- **Infinite Scroll**: Load more prompts as needed
- **Responsive Design**: Optimized for all screen sizes

#### Prompt Cards
Each prompt card displays:
- Title and category
- Brief description preview
- Visual style indicators
- Action buttons (view, favorite, remix)
- Timeline badge for timeline prompts

### 5. Prompt Creation & Editing

#### Regular Prompt Editor
- **Form-based Interface**: Structured input fields for all prompt components
- **Element Management**: Add/remove elements with dynamic lists
- **Keyword System**: Tag-based keyword management
- **Live JSON Preview**: Real-time preview of export format
- **Validation**: Ensure all required fields are completed

#### Timeline Prompt Editor
- **Timeline Builder**: Visual sequence creation interface
- **Step Management**: Add, remove, and reorder timeline steps
- **Timestamp Controls**: Precise timing configuration
- **Audio Integration**: Audio cue management for each step
- **Negative Prompts**: Anti-pattern specification

#### Remix Functionality
- **One-click Remixing**: Duplicate and modify existing prompts
- **Attribution**: Track remix relationships
- **Template System**: Start from existing successful prompts

### 6. Favorites System

#### Save & Organize
- **Cross-type Favorites**: Save both regular and timeline prompts
- **Quick Access**: Dedicated favorites page
- **Toggle Interface**: Easy add/remove from any prompt view
- **Search Favorites**: Filter and search within saved prompts

#### Database Design
- **Unified System**: Single table for all favorite types
- **Referential Integrity**: Validation for prompt existence
- **User Isolation**: Row-level security for privacy

### 7. Export & Integration

#### JSON Export Features
- **Veo 3 Optimized**: Perfect format for Google Veo 3
- **Instant Download**: One-click export to local files
- **Clean Format**: Properly structured JSON with correct fields
- **Filename Generation**: Auto-generated descriptive filenames

#### Export Formats
**Regular Prompts Export:**
```json
{
  "description": "Scene description",
  "style": "cinematic, photorealistic",
  "camera": "camera movement",
  "lighting": "lighting setup",
  "environment": "scene setting",
  "elements": ["element1", "element2"],
  "motion": "movement description",
  "ending": "scene conclusion",
  "text": "none",
  "keywords": ["keyword1", "keyword2"]
}
```

**Timeline Prompts Export:**
```json
{
  "title": "Prompt title",
  "description": "Detailed description",
  "category": "Content category",
  "base_style": "Overall visual style",
  "aspect_ratio": "16:9",
  "scene_description": "Scene setup",
  "camera_setup": "Camera configuration",
  "lighting": "Lighting description",
  "negative_prompts": ["avoid1", "avoid2"],
  "timeline": [
    {
      "sequence": 1,
      "timestamp": "00:00-00:02",
      "action": "Action description",
      "audio": "Audio cues"
    }
  ]
}
```

---

## 💾 Technical Architecture

### Frontend Framework
- **Next.js 14**: React framework with App Router
- **TypeScript**: Full type safety throughout
- **Tailwind CSS**: Utility-first styling
- **Radix UI**: Accessible component library
- **Lucide React**: Modern icon library

### Backend Services
- **Supabase**: PostgreSQL database with real-time features
- **Supabase Auth**: Authentication and user management
- **Row Level Security**: Database-level access control
- **Real-time Subscriptions**: Live data updates

### State Management
- **React Context**: Auth and subscription state
- **Local State**: Component-level state management
- **Client-side Caching**: Optimized data fetching (can be disabled)

### Payment Integration
- **Stripe**: Payment processing and subscription management
- **Webhooks**: Real-time billing event handling
- **Customer Portal**: Self-service billing management

---

## 🗄️ Database Schema

### Core Tables

#### `prompts` - Regular prompts
- Full prompt data with arrays for elements and keywords
- User ownership and public/private controls
- Feature flags and usage statistics

#### `timeline_prompts` - Timeline-based prompts
- JSONB timeline data for complex sequences
- Extended metadata for video production
- Same ownership and visibility model

#### `user_prompts` - User-created prompts
- Unified table for both prompt types
- Type discrimination field
- Personal library management

#### `favorites` - User favorites
- Cross-reference table for saved prompts
- Support for both prompt types
- Unique constraints for data integrity

#### `profiles` - User profiles
- Extended user information
- Subscription plan tracking
- Usage analytics

#### `subscriptions` - Billing data
- Stripe integration data
- Subscription status and periods
- Payment method information

### Security Features
- **Row Level Security (RLS)**: Database-level access control
- **Authentication Integration**: Seamless auth.users() integration
- **Policy-based Access**: Granular permission system
- **Data Isolation**: Users can only access their own data

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/exchange-code` - OAuth code exchange
- `GET /auth/callback` - OAuth callback handling

### Data Access
- `GET /api/prompts` - Fetch prompts with filtering
- `GET /api/clear-cache` - Cache management

### Billing
- `POST /api/billing/checkout` - Create Stripe checkout session
- `GET /api/billing/portal` - Access customer portal
- `POST /api/billing/webhook` - Handle Stripe webhooks

---

## 🚀 Performance Features

### Optimization Strategies
- **Server-side Rendering**: Fast initial page loads
- **Client-side Caching**: Reduced API calls (configurable)
- **Image Optimization**: Next.js automatic image handling
- **Code Splitting**: Lazy loading for optimal bundles

### Cache Management
- **Configurable TTL**: Adjustable cache duration
- **Manual Cache Clearing**: User-controlled cache invalidation
- **Real-time Updates**: Live data synchronization

---

## 🔐 Security Features

### Data Protection
- **HTTPS Only**: Secure data transmission
- **Cookie Security**: HttpOnly and secure cookies
- **CSRF Protection**: Built-in Next.js protection
- **Input Validation**: Client and server-side validation

### User Privacy
- **Data Isolation**: Users can only access their own data
- **Soft Deletion**: Preserve data integrity on account deletion
- **Audit Trails**: Track user actions and changes

---

## 📱 Responsive Design

### Device Support
- **Desktop**: Full-featured interface
- **Tablet**: Optimized touch interface
- **Mobile**: Compact, touch-friendly design
- **PWA Ready**: Progressive web app capabilities

### Accessibility
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: ARIA labels and semantic HTML
- **Color Contrast**: WCAG compliant color schemes
- **Focus Management**: Clear focus indicators

---

## 🛠️ Developer Features

### Development Tools
- **TypeScript**: Full type safety
- **ESLint**: Code quality enforcement
- **Hot Reload**: Fast development iteration
- **Environment Management**: Secure config handling

### Data Management
- **Migration Scripts**: Database schema management
- **Seed Data**: Development data population
- **Backup Scripts**: Data protection utilities
- **Analytics**: Usage tracking and insights

---

## 📊 Analytics & Monitoring

### Usage Tracking
- **Prompt Views**: Track prompt engagement
- **Export Activity**: Monitor JSON downloads
- **User Behavior**: Understand feature usage
- **Performance Metrics**: Monitor app performance

### Business Intelligence
- **Subscription Metrics**: Track plan conversions
- **Content Performance**: Popular prompts and categories
- **User Retention**: Engagement analytics
- **Revenue Tracking**: Billing and payment analytics

---

## 🚀 Future Roadmap

### Planned Features
- **Collaborative Editing**: Team prompt creation
- **Advanced Analytics**: Detailed usage insights
- **API Access**: Developer API for integrations
- **Mobile App**: Native iOS/Android applications
- **Video Preview**: Direct Veo 3 integration for previews

### Enhancement Areas
- **AI-Powered Suggestions**: Smart prompt recommendations
- **Template Library**: Pre-built prompt templates
- **Version Control**: Prompt versioning and history
- **Community Features**: Rating and review system

---

*This documentation covers the current state of PromptVeo3 as of the latest codebase analysis. The application is actively developed with regular feature additions and improvements.* 