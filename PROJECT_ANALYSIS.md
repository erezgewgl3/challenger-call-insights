
# Sales Whisperer - Project Analysis: Current State & Structure

## Project Overview
Sales Whisperer is an AI-powered sales enablement tool built with React, TypeScript, Tailwind CSS, and Supabase. It analyzes sales call transcripts using the Challenger Sales methodology to provide actionable insights and coaching recommendations.

## Technology Stack
- **Frontend**: React 18.3.1 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Edge Functions)
- **Authentication**: Supabase Auth
- **State Management**: React Query + Zustand
- **Routing**: React Router DOM
- **AI Integration**: OpenAI + Anthropic (Claude)
- **PDF Export**: html2canvas + jsPDF

## Complete File Structure

### `/src` Directory Structure

```
src/
├── App.tsx                           # Main app component with routing
├── index.css                         # Global styles and design system
├── main.tsx                          # Application entry point
├── vite-env.d.ts                     # Vite type definitions
├── components/                       # Reusable UI components
│   ├── ui/                          # Base UI components (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── separator.tsx
│   │   ├── sonner.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── tooltip.tsx
│   │   └── LoadingSpinner.tsx        # Custom loading component
│   ├── admin/                       # Admin-specific components
│   │   └── SystemMonitor.tsx         # System health monitoring
│   ├── analysis/                    # Analysis view components
│   │   ├── NewAnalysisView.tsx       # Main analysis display component
│   │   ├── SalesIntelligenceView.tsx # Alternative analysis view
│   │   ├── HeroSection.tsx          # Hero section of analysis
│   │   ├── BattlePlanSection.tsx    # Battle plan recommendations
│   │   ├── StakeholderNavigation.tsx # Stakeholder mapping
│   │   └── ExpandableSections.tsx   # Collapsible content sections
│   ├── auth/                        # Authentication components
│   │   ├── AuthGuard.tsx            # Route protection for authenticated users
│   │   ├── AdminGuard.tsx           # Route protection for admin users
│   │   ├── LoginForm.tsx            # User login interface
│   │   └── RegisterForm.tsx         # User registration interface
│   ├── layout/                      # Layout components
│   │   └── AdminLayout.tsx          # Admin dashboard layout wrapper
│   └── prompts/                     # Prompt management components
│       ├── SimplePromptEditor.tsx   # Simplified prompt creation/editing
│       ├── PromptEditor.tsx         # Advanced prompt editor (259 lines)
│       ├── PromptCard.tsx           # Individual prompt display card
│       ├── PromptTester.tsx         # Prompt testing interface
│       ├── SearchFilterControls.tsx # Search and filter controls
│       ├── EmptySearchState.tsx     # Empty state for search results
│       ├── BulkOperationsToolbar.tsx # Bulk operations interface
│       ├── PromptMetricsCards.tsx   # Metrics display cards
│       ├── PromptControlsSection.tsx # Control section for prompts
│       └── VariableInserter.tsx     # Variable insertion helper
├── hooks/                           # Custom React hooks
│   ├── useAuth.tsx                  # Authentication state management
│   ├── usePrompts.ts                # Prompt management hooks (252 lines)
│   ├── usePromptManagement.ts       # Complex prompt management logic
│   ├── useAnalysisStatus.ts         # Real-time analysis status tracking
│   ├── useUploadFlow.ts             # File upload workflow management
│   ├── useAnalysisFlow.ts           # Analysis workflow management
│   └── usePDFExport.ts              # PDF export functionality (218 lines)
├── pages/                           # Top-level page components
│   ├── Index.tsx                    # Landing/home page
│   ├── WelcomeDashboard.tsx         # Main user dashboard
│   ├── AdminDashboard.tsx           # Admin overview page (201 lines)
│   ├── PromptManagement.tsx         # Prompt management page (266 lines)
│   ├── TranscriptAnalysis.tsx       # Analysis results page
│   └── NotFound.tsx                 # 404 error page
├── lib/                             # Utility libraries
│   ├── supabase.ts                  # Supabase client configuration
│   └── utils.ts                     # General utility functions
├── services/                        # Business logic services
│   └── authService.ts               # Authentication service layer
├── constants/                       # Application constants
│   └── auth.ts                      # Authentication-related constants
├── types/                           # TypeScript type definitions
│   └── prompt.ts                    # Prompt-related type definitions
└── integrations/                    # External service integrations
    └── supabase/                    # Supabase integration
        └── types.ts                 # Database type definitions
```

## Key React Components Analysis

### Authentication System
**Location**: `src/components/auth/`

1. **AuthGuard.tsx** - Route protection wrapper
   - Protects routes requiring authentication
   - Redirects unauthenticated users to login

2. **AdminGuard.tsx** - Admin route protection
   - Ensures only admin users access admin routes
   - Falls back to regular user dashboard for non-admins

3. **LoginForm.tsx** - User authentication interface
   - Email/password login form
   - Integration with Supabase Auth

4. **RegisterForm.tsx** - User registration interface
   - New user signup functionality
   - Invite token validation system

### Admin Dashboard Components
**Location**: `src/components/admin/` and `src/pages/AdminDashboard.tsx`

**AdminDashboard.tsx** (201 lines):
```typescript
// Main admin overview with:
// - System metrics cards (Users, Prompts, Analyses, Health)
// - Navigation to prompt management
// - System status indicators
// - Analytics tab with SystemMonitor integration
// - Professional card-based layout
```

**SystemMonitor.tsx**:
```typescript
// Real-time system monitoring component
// - Performance metrics
// - Health indicators  
// - Usage analytics
```

### Prompt Management System
**Location**: `src/components/prompts/` and `src/pages/PromptManagement.tsx`

**PromptManagement.tsx** (266 lines):
```typescript
// Comprehensive prompt management interface featuring:
// - Active prompt display section
// - All prompt versions listing
// - Search and filter capabilities
// - Bulk operations (select, delete, export, duplicate)
// - Create/edit/test prompt functionality
// - Metrics cards showing system status
```

**Key Prompt Components**:
- **SimplePromptEditor.tsx** - Streamlined prompt creation/editing
- **PromptEditor.tsx** (259 lines) - Advanced editor with testing capabilities
- **PromptTester.tsx** - Real-time prompt testing interface
- **BulkOperationsToolbar.tsx** - Multi-select operations

### Analysis Display System
**Location**: `src/components/analysis/`

**NewAnalysisView.tsx** (578 lines):
```typescript
// Main analysis results component featuring:
// - Hero section with deal heat, decision maker, buying signals
// - Battle plan with AI recommendations and email follow-up
// - Stakeholder navigation and mapping
// - Expandable sections for detailed insights
// - PDF export functionality with professional layout
// - Smart priority system with auto-expansion
// - Mobile-responsive design
```

**Supporting Analysis Components**:
- **HeroSection.tsx** - Key metrics and deal overview
- **BattlePlanSection.tsx** - Actionable recommendations
- **StakeholderNavigation.tsx** - Contact mapping and roles
- **ExpandableSections.tsx** - Detailed conversation intelligence

## Routing Configuration
**Location**: `src/App.tsx`

```typescript
// Current route structure:
<Routes>
  <Route path="/" element={<Index />} />                    // Landing page
  <Route path="/login" element={<LoginForm />} />           // Authentication
  <Route path="/register" element={<RegisterForm />} />     // Registration
  
  // Protected routes (AuthGuard)
  <Route path="/dashboard" element={<WelcomeDashboard />} />
  <Route path="/analysis/:transcriptId" element={<TranscriptAnalysis />} />
  
  // Admin routes (AdminGuard)  
  <Route path="/admin" element={<AdminDashboard />} />
  <Route path="/admin/prompts" element={<PromptManagement />} />
  
  <Route path="*" element={<NotFound />} />                 // 404 handler
</Routes>
```

## Current PDF Export Implementation
**Location**: `src/hooks/usePDFExport.ts` (218 lines)

### Current Status
The PDF export system has been recently enhanced with professional-quality output:

**Key Features**:
- A4 landscape format for optimal readability
- Multi-page support for long analyses
- Professional header with title and generation date
- High-resolution capture (2x scaling)
- Badge alignment fixes for proper layout
- Clean filename generation from transcript titles

**Recent Improvements Made**:
1. **Layout Optimization**: Temporary width adjustment (1400px) during capture ensures consistent layout
2. **DOM Manipulation**: Direct styling of cloned elements to fix badge and flex container alignment
3. **Multi-page Logic**: Intelligent page splitting for long content with proper headers
4. **Professional Formatting**: Clean title extraction, proper margins, and branded headers

### Current PDF Export Workflow
```typescript
// 1. Prepare element for capture
element.style.width = '1400px' // Temporary fixed width

// 2. High-quality capture with html2canvas
const canvas = await html2canvas(element, {
  scale: 2,
  backgroundColor: '#f8fafc',
  onclone: (clonedDoc, clonedElement) => {
    // Fix badge alignment and text rendering
  }
})

// 3. Create professional PDF with jsPDF
const pdf = new jsPDF({
  orientation: 'landscape',
  format: 'a4'
})

// 4. Add header and content
pdf.text(title, 15, 20)
pdf.addImage(imgData, 'PNG', 10, 35, contentWidth, scaledHeight)

// 5. Generate clean filename and save
const filename = `${cleanTitle}_analysis_${timestamp}.pdf`
pdf.save(filename)
```

## Database Schema Overview
**Supabase Integration**: 
- Users table with role-based access (sales_user, admin)
- Prompts table with versioning and activation system
- Transcripts table for uploaded content
- RLS (Row Level Security) enforced throughout

**Key Functions**:
- `activate_single_prompt()` - System-wide prompt activation
- `get_active_prompt()` - Retrieve currently active prompt
- `handle_new_user()` - Auto-create user profiles

## State Management Architecture

### Authentication State
- **Provider**: `useAuth` hook with React Context
- **Features**: Role-based access, session management, auto-enhancement of user roles

### Data Fetching
- **React Query**: All server state management
- **Key Queries**: prompts, transcripts, analysis status
- **Real-time**: Supabase subscriptions for analysis updates

### UI State  
- **Zustand**: Client-side state for upload flows, analysis progress
- **Hooks**: Specialized hooks for complex workflows (upload, analysis)

## Key Dependencies
```json
{
  "@supabase/supabase-js": "^2.50.2",
  "@tanstack/react-query": "^5.56.2", 
  "html2canvas": "^1.4.1",
  "jspdf": "^3.0.1",
  "react-router-dom": "^6.26.2",
  "lucide-react": "^0.462.0",
  "sonner": "^1.5.0"
}
```

## Current Development Focus

### Recent PDF Export Refinements
The team has been iterating on PDF export quality with three major improvement cycles:

1. **Initial Implementation**: Basic PDF generation with html2canvas + jsPDF
2. **Quality Enhancement**: Improved text crispness (3x scaling), badge alignment fixes
3. **Professional Layout**: A4 landscape format, multi-page support, branded headers

### Outstanding Issues to Address
- Badge alignment in complex flex layouts may need further refinement
- Text rendering consistency across different browsers
- File size optimization for large analyses
- Potential memory issues with very long transcripts

### Next Development Priorities
1. Complete the PDF export refinements for production quality
2. Implement user management system in admin dashboard
3. Add real-time collaboration features
4. Enhance AI analysis with more sophisticated prompting

## File Size Considerations
Several files have grown quite large and may benefit from refactoring:
- `NewAnalysisView.tsx` (578 lines) - Consider breaking into smaller components
- `PromptManagement.tsx` (266 lines) - Could split management logic
- `PromptEditor.tsx` (259 lines) - Separate editor from testing functionality  
- `usePrompts.ts` (252 lines) - Split into focused hooks
- `usePDFExport.ts` (218 lines) - Consider separating configuration from logic

This structure represents a mature MVP with comprehensive admin tooling, sophisticated analysis views, and professional PDF export capabilities ready for production deployment.
