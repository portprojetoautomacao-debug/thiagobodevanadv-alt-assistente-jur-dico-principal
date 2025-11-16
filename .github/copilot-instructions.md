# Copilot Instructions for Assistente Jurídico PJe

This repository contains a legal management system built with React, TypeScript, and Vite. These instructions guide GitHub Copilot on how to work effectively with this codebase.

## Project Overview

**Assistente Jurídico PJe** is an intelligent legal management system for law offices, featuring:
- AI-powered legal assistant (Harvey Specter chatbot)
- Process management with Kanban board
- Deadline calculator for legal proceedings
- Google Calendar integration
- DJEN/DataJud integration for publication monitoring
- Financial management
- 7 autonomous AI agents working 24/7

## Technology Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui v4, Radix UI
- **Icons**: Phosphor Icons, Lucide React
- **State Management**: Spark KV (useKV hook from @github/spark)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Animation**: Framer Motion
- **AI**: Spark LLM (GPT-4)
- **OAuth**: Google OAuth 2.0 for authentication

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn UI components (DO NOT MODIFY - generated)
│   ├── Dashboard.tsx   # Main dashboard
│   ├── ProcessCRM.tsx  # Kanban process management
│   ├── AIAgents.tsx    # AI agents panel
│   ├── GoogleAuth.tsx  # Google OAuth authentication
│   └── ...             # Other feature components
├── hooks/              # Custom React hooks
│   └── use-autonomous-agents.ts  # AI agents logic
├── lib/
│   ├── config.ts       # Centralized configuration (environment variables)
│   ├── utils.ts        # Utility functions
│   └── djen-api.test.ts # API tests
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev              # Runs on http://localhost:5173

# Build for production
npm run build            # TypeScript compilation + Vite build

# Preview production build
npm run preview

# Lint code
npm run lint             # Run ESLint

# Optimize dependencies
npm run optimize
```

## Code Style and Conventions

### TypeScript
- **Strict null checks enabled** - Always handle null/undefined cases
- Use type inference where possible, explicit types for function parameters and return values
- Prefer interfaces over types for object shapes
- Use const assertions for literal types

### React
- **Functional components only** - No class components
- Use React hooks (useState, useEffect, useCallback, useMemo, etc.)
- Custom hooks should start with `use` prefix
- Component file names in PascalCase matching component name
- Props interfaces named with `Props` suffix (e.g., `DashboardProps`)

### Naming Conventions
- **Components**: PascalCase (e.g., `ProcessCRM.tsx`, `AIAgents.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `use-autonomous-agents.ts`)
- **Utilities**: camelCase (e.g., `utils.ts`)
- **Types/Interfaces**: PascalCase (e.g., `ProcessData`, `UserProfile`)
- **Constants**: UPPER_SNAKE_CASE

### Component Structure
```tsx
// Imports
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// Types/Interfaces
interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

// Component
export function MyComponent({ title, onAction }: MyComponentProps) {
  // Hooks
  const [state, setState] = useState();
  
  // Handlers
  const handleClick = () => {
    // logic
  };
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

### Path Aliases
- Use `@/` for imports from `src/` directory
- Example: `import { Button } from '@/components/ui/button'`

## Security Requirements

⚠️ **CRITICAL SECURITY RULES** - Never violate these:

1. **Never commit credentials or secrets**
   - OAuth credentials go in `.env` (already in `.gitignore`)
   - Never hardcode API keys, client IDs, or secrets
   - Use environment variables via `src/lib/config.ts`

2. **Environment Variables**
   - Prefix with `VITE_` for client-side access
   - Reference example: `.env.example`
   - Required variables:
     ```
     VITE_GOOGLE_CLIENT_ID=
     VITE_GOOGLE_API_KEY=
     VITE_REDIRECT_URI=
     VITE_APP_ENV=
     ```

3. **OAuth Security**
   - Different credentials for dev/production
   - Never share credentials in comments, documentation, or code
   - See `OAUTH_SETUP.md` for setup instructions

4. **Dependency Security**
   - Run `npm audit` before adding dependencies
   - Keep dependencies updated
   - Review package permissions

## Testing

### Test Structure
- Test files use `.test.ts` or `.test.tsx` extension
- Place tests adjacent to the code they test
- Example: `src/lib/djen-api.test.ts`

### Running Tests
Currently minimal test infrastructure. When adding tests:
- Use a testing library compatible with Vite (e.g., Vitest)
- Follow existing test patterns in `djen-api.test.ts`
- Test critical business logic and utilities

## Building and Linting

### Build Process
1. TypeScript compilation: `tsc -b --noCheck`
2. Vite build: `vite build`
3. Output: `dist/` directory (ignored by git)

### Linting
- ESLint 9 with flat config
- React hooks rules enforced
- React refresh rules enforced
- Run before committing: `npm run lint`

### Type Checking
- TypeScript strict null checks enabled
- Module resolution: bundler mode
- No emit (Vite handles compilation)

## State Management

### Spark KV Storage
- Use `useKV` hook from `@github/spark` for persistent state
- Client-side storage for processes, user data, settings
- No backend required for basic features

### Example Usage
```tsx
import { useKV } from '@github/spark';

const [processes, setProcesses] = useKV('processes', []);
```

## UI Components

### shadcn/ui Components
- Located in `src/components/ui/`
- **DO NOT modify** these files directly
- Regenerate using shadcn CLI if needed
- Customize via Tailwind classes in parent components

### Tailwind CSS
- Version 4 with `@tailwindcss/vite` plugin
- Custom theme in `tailwind.config.js`
- Use utility classes, avoid custom CSS when possible
- Responsive design: mobile-first approach

## Common Patterns

### Form Validation
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  field: z.string().min(1, 'Required'),
});

const form = useForm({
  resolver: zodResolver(schema),
});
```

### API Calls
- Use `fetch` API or libraries compatible with Vite
- Handle loading, error, and success states
- Use React Query for complex data fetching

### Error Handling
- Use Error Boundaries for component errors
- See `ErrorFallback.tsx` for reference
- Provide user-friendly error messages
- Log errors for debugging

## Integration Points

### Google OAuth
- Authentication via `GoogleAuth.tsx`
- Config in `src/lib/config.ts`
- Documentation: `OAUTH_SETUP.md`

### Google Calendar
- Bidirectional sync
- Documentation: `GOOGLE_CALENDAR_INTEGRATION.md`

### DJEN/DataJud
- Legal publication monitoring
- Documentation: `DJEN_DOCUMENTATION.md`

### AI Features
- Spark LLM integration for chatbot
- Autonomous agents system
- See `AIAgents.tsx` and `use-autonomous-agents.ts`

## Documentation Files

- `PRD.md` - Product requirements
- `README.md` - Setup and overview
- `SECURITY.md` - Security policies
- `OAUTH_SETUP.md` - OAuth configuration guide
- `GOOGLE_CALENDAR_INTEGRATION.md` - Calendar integration
- `DJEN_DOCUMENTATION.md` - DJEN API integration
- `QUICKSTART.md` - Quick start guide

## Making Changes

### Before Starting
1. Read relevant documentation files
2. Understand the feature area
3. Check existing patterns in similar components
4. Review security requirements

### When Adding Features
1. Follow existing component structure
2. Use TypeScript strictly
3. Add proper error handling
4. Update types in `types.ts` if needed
5. Test in development mode
6. Ensure responsive design
7. Document complex logic

### When Fixing Bugs
1. Identify root cause
2. Add tests if missing
3. Fix with minimal changes
4. Verify fix doesn't break other features
5. Test edge cases

### When Refactoring
1. Maintain existing functionality
2. Keep changes focused and small
3. Update related documentation
4. Ensure types remain accurate
5. Test thoroughly

## Git Workflow

### Commits
- Clear, descriptive commit messages
- Reference issue numbers when applicable
- Keep commits focused and atomic

### Files to Ignore
Already in `.gitignore`:
- `node_modules/`
- `dist/`
- `.env`
- `*.local`
- Editor configs
- `packages/` (for workspaces)

### Files NOT to Commit
- Environment files (`.env`)
- Build artifacts (`dist/`, `dist-ssr/`)
- Dependency directories (`node_modules/`)
- Editor-specific files
- Credentials or secrets

## Performance Considerations

- Lazy load heavy components
- Use React.memo for expensive renders
- Optimize images and assets
- Keep bundle size minimal
- Use code splitting where appropriate

## Accessibility

- Use semantic HTML
- Include ARIA labels where needed
- Ensure keyboard navigation works
- Test with screen readers
- Maintain sufficient color contrast

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020 target
- No IE11 support required

## Questions or Issues?

- Check relevant documentation files first
- Review existing similar code
- Ensure security guidelines are followed
- Test changes thoroughly before committing
