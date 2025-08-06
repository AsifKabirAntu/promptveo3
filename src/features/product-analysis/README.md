# Product Analysis Feature

## Overview
AI-powered product image analysis and prompt generation for creating professional product reveal videos.

## Architecture

```
src/features/product-analysis/
├── components/           # UI components
│   ├── ProductLibrary/
│   ├── ProductUpload/
│   ├── PromptWizard/
│   └── TimelineEditor/
├── hooks/               # Custom React hooks
├── services/            # API and business logic
├── types/               # TypeScript definitions
├── utils/               # Helper functions
└── styles/              # Feature-specific styles
```

## Database Schema

### user_products
- id (UUID, primary key)
- user_id (UUID, foreign key)
- name (TEXT)
- category (TEXT)
- image_url (TEXT)
- image_metadata (JSONB)
- analysis_data (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### product_analysis_sessions
- id (UUID, primary key)
- user_id (UUID, foreign key)
- product_id (UUID, foreign key)
- style_template_id (TEXT)
- generated_prompt (JSONB)
- analysis_cost (DECIMAL)
- created_at (TIMESTAMP)

## Key Features

1. **Product Library Management**
   - Upload and organize product images
   - Category-based organization
   - Search and filter capabilities

2. **AI Analysis Engine**
   - OpenRouter GPT-4o integration
   - Product feature extraction
   - Style-aware prompt generation

3. **Prompt Generation Wizard**
   - Multi-step guided flow
   - Real-time preview
   - Customizable templates

4. **Timeline Editor**
   - Visual sequence editing
   - Drag-and-drop interface
   - Audio timing controls

## Implementation Phases

### Phase 1: Foundation (Current)
- Database schema setup
- Basic UI components
- File upload infrastructure

### Phase 2: Core Features
- AI integration
- Prompt generation
- Timeline editing

### Phase 3: Enhancement
- Advanced styling
- Collaboration features
- Analytics dashboard 