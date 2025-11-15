# Planning Guide

Assistente Jurídico PJe - Your team of 100% autonomous AI agents powered by Gemini, operating 24/7 to automate and optimize your legal workflow from start to finish. A high-performance AI-powered suite of tools designed for law offices using Brazil's PJe (Electronic Judicial Process) system, featuring autonomous agents that analyze documents, draft petitions, organize files, transcribe media, calculate deadlines, and monitor court notifications.

**Experience Qualities**: 
1. **Professional & Trustworthy** - The interface must convey reliability and precision, essential for legal professionals handling critical cases and deadlines, with autonomous AI agents that work continuously in the background
2. **Efficient & Streamlined** - Every interaction should minimize clicks and cognitive load, enabling lawyers to process information and take action rapidly while AI agents handle repetitive tasks
3. **Intelligent & Insightful** - AI-powered autonomous agents should surface relevant information proactively, operating 24/7 to provide actionable insights that enhance decision-making without human intervention

**Complexity Level**: Complex Application (advanced functionality, authentication, multiple integrated modules)
  - This is a comprehensive legal practice management system with user authentication, real-time data processing, AI integration, document analysis, calendar management, financial tracking, and knowledge base features requiring sophisticated state management and data persistence.

## Essential Features

### 1. Quick Access Login System
- **Functionality**: Simplified authentication with pre-configured demo accounts (admin/admin123, demo/demo, usuario/123456)
- **Purpose**: Immediate access for demonstration and testing without complex setup
- **Trigger**: User clicks on quick access buttons or enters credentials manually
- **Progression**: Landing page → Quick access button click → Credential auto-fill → Authentication → Dashboard redirect
- **Success criteria**: User can access the system within 2 clicks, credentials persist across sessions

### 2. Dashboard (Meu Painel)
- **Functionality**: Centralized command center displaying appointments, fatal deadlines, pending tasks, and real-time autonomous AI agent activity with status monitoring for all active agents
- **Purpose**: Provide at-a-glance situational awareness of critical case information and showcase autonomous AI agents operating 24/7 in the background
- **Trigger**: Successful login or navigation menu selection
- **Progression**: Login → Dashboard load → Widget rendering (appointments, deadlines, tasks, AI agent status) → Real-time agent activity updates → Interactive card navigation
- **Success criteria**: All critical information visible without scrolling, deadline alerts prominent, AI agent status displayed with live activity feed, data updates in real-time

### 3. Process CRM (Acervo) - Kanban Board
- **Functionality**: Visual process management with drag-and-drop Kanban board for tracking cases through workflow stages
- **Purpose**: Enable intuitive visual organization of legal cases through their lifecycle
- **Trigger**: User navigates to "Acervo" section
- **Progression**: Navigation → Kanban board display → Drag card to new column → Auto-save state → Update process status → Reflect in dashboard
- **Success criteria**: Smooth drag-and-drop interactions, instant visual feedback, persistent state, filterable by case attributes

### 4. Expediente Panel (Smart Inbox)
- **Functionality**: AI-powered inbox for court notices with automatic analysis, summarization, action classification, and draft petition generation
- **Purpose**: Transform time-consuming document review into rapid triage and action planning
- **Trigger**: User opens Expedientes section or receives new court notice
- **Progression**: Notice arrival → AI analysis (Gemini) → Summary generation → Action classification → Pending document identification → Draft petition creation → User review and approval
- **Success criteria**: AI summary accuracy >90%, action suggestions contextually relevant, petition drafts require minimal editing

### 5. Batch Document Analysis
- **Functionality**: Extract structured information (CNJ number, parties, deadlines) from multiple pasted expediente texts simultaneously
- **Purpose**: Rapidly process multiple documents without manual data entry
- **Trigger**: User pastes multiple expediente texts into analysis tool
- **Progression**: Paste text → AI parsing → Data extraction → Structured table display → Export/save options
- **Success criteria**: Accurately parse 5+ documents simultaneously, extract all key fields, present in sortable table

### 6. Audio Transcription
- **Functionality**: Real-time microphone transcription or file upload of hearings and meetings with actionable summary generation
- **Purpose**: Convert spoken content into searchable, analyzable text with key points highlighted
- **Trigger**: User clicks record button or uploads audio file
- **Progression**: Audio input → Gemini transcription → Text display → Summary generation → Action item extraction → Save to case file
- **Success criteria**: Near real-time transcription, speaker distinction, accurate legal terminology, actionable summary

### 7. Deadline Calculator with AI Reasoning
- **Functionality**: Calculate procedural deadlines (CPC, CLT) considering holidays and context with step-by-step audit trail
- **Purpose**: Eliminate deadline calculation errors with transparent AI reasoning
- **Trigger**: User selects deadline type, enters base date and parameters
- **Progression**: Input parameters → AI analysis (Gemini 2.5 Pro) → Step-by-step calculation → Holiday consideration → Final deadline display → Reasoning explanation
- **Success criteria**: 100% accuracy on deadline calculations, clear reasoning trail, handles edge cases (holidays, weekends)

### 8. National Database Queries (Datajud & DJEN)
- **Functionality**: Direct integration with Brazil's judicial databases for official case status and electronic gazette searches
- **Purpose**: Centralize external data retrieval without leaving the platform
- **Trigger**: User enters case number (Datajud) or lawyer name/OAB number (DJEN)
- **Progression**: Query input → API call → Data retrieval → Formatted display → Save to case history
- **Success criteria**: Fast response times (<3s), formatted results, error handling for invalid queries

### 9. Integrated Calendar (Agenda)
- **Functionality**: Comprehensive calendar for appointments, hearings, and deadlines with monthly view and event management
- **Purpose**: Centralize all time-sensitive legal activities in one view
- **Trigger**: User navigates to calendar or adds new event
- **Progression**: Calendar view → Add/edit event → Set reminders → Sync with case data → Display in dashboard
- **Success criteria**: Intuitive event creation, visual distinction between event types, reminder notifications

### 10. Financial Management
- **Functionality**: Revenue and expense tracking linked to cases with visual dashboards and AI-powered document data extraction
- **Purpose**: Maintain financial oversight connected to case profitability
- **Trigger**: User logs transaction or uploads financial document
- **Progression**: Transaction entry/document upload → AI extraction → Categorization → Case linking → Dashboard update → Report generation
- **Success criteria**: Clear income/expense visualization, accurate AI extraction, case-level profitability analysis

### 11. Knowledge Base (RAG System)
- **Functionality**: Index office documents (petitions, doctrine, notes) and conversational interface to query the knowledge base
- **Purpose**: Transform institutional knowledge into instantly accessible conversational resource
- **Trigger**: User uploads documents or asks question in chat interface
- **Progression**: Document upload → Embedding generation → ChromaDB storage → User query → Semantic search → Context retrieval → AI response with sources
- **Success criteria**: Relevant results in <2s, source attribution, contextual answers, support for legal document formats

## Edge Case Handling

- **Authentication Failures**: Clear error messages with retry options and demo credential reminders
- **AI Service Unavailable**: Graceful degradation to manual entry with queue for retry when service restores
- **Empty States**: Helpful onboarding prompts guiding users to first actions (e.g., "Add your first case")
- **Network Interruptions**: Offline indicators, local state preservation, auto-sync when reconnected
- **Invalid Date Calculations**: Validation warnings, suggested corrections, manual override option
- **Missing Case Data**: Smart defaults, optional field handling, progressive disclosure of advanced features
- **Large File Uploads**: Progress indicators, chunk upload, file size warnings
- **Concurrent Editing**: Last-write-wins with notification, version history for critical documents

## Design Direction

The design should evoke confidence, precision, and modern professionalism - feelings essential for legal software. It should feel serious yet approachable, with a minimal interface that prioritizes information density without clutter. The aesthetic should mirror high-end SaaS platforms (think Notion meets Linear) with Brazilian legal industry credibility through subtle formal touches.

## Color Selection

**Triadic** color scheme - combining deep judicial blue, energetic action orange, and professional neutral grays to balance trust, energy, and sophistication.

- **Primary Color**: Deep Judicial Blue `oklch(0.35 0.08 250)` - Communicates trust, authority, and legal tradition. Used for navigation, primary actions, and branding.
- **Secondary Colors**: 
  - Warm Charcoal `oklch(0.25 0.01 280)` - Professional depth for secondary UI elements and text
  - Cool Gray `oklch(0.55 0.02 260)` - Muted backgrounds and borders
- **Accent Color**: Bright Action Orange `oklch(0.68 0.15 45)` - Urgency and calls-to-action, perfect for deadline alerts and primary buttons. Creates visual energy against the conservative blues.
- **Foreground/Background Pairings**:
  - Background (Light Gray `oklch(0.98 0.005 260)`): Dark Text `oklch(0.20 0.01 280)` - Ratio 14.2:1 ✓
  - Card (White `oklch(1 0 0)`): Dark Text `oklch(0.20 0.01 280)` - Ratio 15.8:1 ✓
  - Primary (Deep Blue `oklch(0.35 0.08 250)`): White Text `oklch(1 0 0)` - Ratio 8.9:1 ✓
  - Secondary (Warm Charcoal `oklch(0.25 0.01 280)`): White Text `oklch(1 0 0)` - Ratio 12.6:1 ✓
  - Accent (Action Orange `oklch(0.68 0.15 45)`): Dark Text `oklch(0.20 0.01 280)` - Ratio 7.8:1 ✓
  - Muted (Cool Gray `oklch(0.95 0.01 260)`): Medium Text `oklch(0.45 0.02 260)` - Ratio 6.2:1 ✓

## Font Selection

Typography should convey clarity and professionalism while maintaining excellent readability for dense legal text. **Inter** for UI elements (clean, modern, excellent at small sizes) and **Lora** for longer document content (serif adds formality and reduces eye strain).

- **Typographic Hierarchy**: 
  - H1 (Page Titles): Inter Bold / 32px / -0.02em letter spacing / 1.2 line height
  - H2 (Section Headers): Inter SemiBold / 24px / -0.01em letter spacing / 1.3 line height
  - H3 (Card Titles): Inter Medium / 18px / 0em letter spacing / 1.4 line height
  - Body (UI Text): Inter Regular / 15px / 0em letter spacing / 1.5 line height
  - Small (Metadata): Inter Regular / 13px / 0.01em letter spacing / 1.4 line height
  - Document Body: Lora Regular / 16px / 0em letter spacing / 1.7 line height

## Animations

Animations should be purposeful and subtle - reinforcing spatial relationships and state changes without drawing attention away from content. The balance leans toward functional clarity over decorative flourish, appropriate for professional legal software.

- **Purposeful Meaning**: Motion communicates state transitions (loading, success, error), spatial navigation (modal appearance, drawer slides), and data updates (new notification pulse). Movement is conservative, reinforcing the platform's reliability.
- **Hierarchy of Movement**: Critical alerts (deadline warnings) deserve attention-grabbing animation (gentle pulse). Navigation and state changes use smooth, quick transitions (200-300ms). Background updates are nearly imperceptible (fade-in only).

## Component Selection

- **Components**: 
  - **Navigation**: Sidebar (collapsible) with navigation-menu for multi-level sections
  - **Authentication**: Card with Input fields, Button (primary), and quick-access Button variants
  - **Dashboard**: Grid of Card components with Badge for status indicators, Progress bars for metrics
  - **Kanban Board**: Custom drag-and-drop with Card for process items, utilizing react-beautiful-dnd pattern
  - **Forms**: Form components with Input, Textarea, Select, Calendar (date-picker), Switch for toggles
  - **Data Display**: Table for batch analysis results, Tabs for multi-view sections, Accordion for collapsible details
  - **Modals**: Dialog for confirmations, Sheet (drawer) for detailed item views
  - **Notifications**: Toast (sonner) for ephemeral feedback, Alert for persistent warnings
  - **AI Features**: Custom chat interface with ScrollArea, skeleton loaders during AI processing
  - **Calendar**: Custom calendar grid using date-fns with Popover for event details

- **Customizations**: 
  - Kanban drag preview with elevated shadow and slight rotation
  - Process status badges with custom colors (aguardando: yellow, em-andamento: blue, concluído: green)
  - AI analysis loading state with animated gradient background
  - Deadline calculator with step-by-step accordion showing reasoning
  - Custom audio waveform visualization for transcription

- **States**: 
  - Buttons: Subtle scale-down on active (0.98), distinct hover with background darken, disabled with reduced opacity and cursor-not-allowed
  - Inputs: Focus ring in primary color, error state with destructive border and icon, success with accent border
  - Cards: Hover lift (shadow increase), selected state with primary border
  - Drag items: Opacity 0.5 while dragging, smooth transform transitions

- **Icon Selection**: 
  - @phosphor-icons/react throughout for consistency
  - Navigation: House, Briefcase, Tray, FileText, MicrophoneStage, Calculator, Database, Calendar, CurrencyCircleDollar, Books, Gear
  - Actions: Plus, MagnifyingGlass, Download, Upload, Trash, PencilSimple
  - Status: CheckCircle, Warning, Clock, Info, X
  - AI: Sparkle, Robot, Lightning for AI-powered features

- **Spacing**: 
  - Container padding: px-6 py-4 (24px/16px)
  - Section gaps: gap-6 (24px) for major sections, gap-4 (16px) for related items, gap-2 (8px) for tight groups
  - Card internal spacing: p-6 for content area, p-4 for compact cards
  - Form field spacing: space-y-4 for field groups, space-y-2 for label-input pairs

- **Mobile**: 
  - Sidebar collapses to bottom navigation bar on mobile (<768px)
  - Kanban board switches to vertical scrolling list view with status filter dropdown
  - Table switches to stacked card layout with key fields prominent
  - Multi-column layouts collapse to single column with prioritized information first
  - Touch-friendly button sizes (min 44x44px) with increased padding on mobile
  - Calendar switches to agenda list view with expandable day sections
