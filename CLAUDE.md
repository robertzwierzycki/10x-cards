# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

10xCards is an AI-powered flashcard generation application built with Astro 5, React 19, and TypeScript. The application automatically generates educational flashcards from user-provided text using LLM models (gpt-4o-mini), implements spaced repetition for learning, and provides full CRUD operations for deck and flashcard management.

## Development Commands

```bash
# Development
npm run dev           # Start development server on port 3000
npm run build         # Build for production (SSR with Node adapter)
npm run preview       # Preview production build

# Code Quality
npm run lint          # Run ESLint checks
npm run lint:fix      # Auto-fix ESLint issues
npm run format        # Format code with Prettier

# Testing
npm test             # Run tests in watch mode
npm run test:run     # Run tests once
npm run test:ui      # Open Vitest UI
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# E2E Testing
npm run test:e2e     # Run Playwright E2E tests
npm run test:e2e:ui  # Open Playwright test UI
npm run test:e2e:debug # Debug Playwright tests
npm run test:e2e:report # Show Playwright test report
```

## Architecture Overview

### Rendering Strategy
- **Server-Side Rendering (SSR)** with Node.js adapter in standalone mode
- File-based routing via `src/pages/` directory
- Hybrid component model: Astro components for static content, React for interactive features

### Core Modules (from PRD)

1. **Authentication (AUTH)** - Supabase-based user management
2. **Deck Management (DECK)** - CRUD operations for flashcard decks
3. **Manual Flashcards (CARD-M)** - Manual creation and editing
4. **AI Generator (AI-GEN)** - GPT-4o-mini integration with 1000 character limit
5. **Study Mode (STUDY)** - Spaced repetition algorithm implementation

### Database Schema Considerations

Flashcards should include an `is_ai_generated` boolean flag to track generation source for metrics.

### API Design Pattern

When implementing API routes in `src/pages/api/`:
- Use uppercase HTTP method exports: `export async function POST()`, `export async function GET()`
- Add `export const prerender = false` for dynamic routes
- Use Zod for request validation
- Access Supabase via `context.locals.supabase` (set up in middleware)
- Return structured JSON responses with appropriate status codes

### Component Architecture

**Astro Components** (`.astro`):
- Use for layouts, static pages, and server-rendered content
- Direct file system access and zero client JavaScript by default

**React Components** (`.tsx`):
- Use for interactive UI elements requiring client-side state
- Import with `client:load`, `client:idle`, or `client:visible` directives
- Utilize shadcn/ui components from `src/components/ui/`
- Apply class-variance-authority for variant styling

### State Management Patterns

- Server state: Managed through Supabase queries in API routes
- Client state: React hooks for local component state
- Form state: Use React Hook Form for complex forms with Zod validation
- Global client state: Use Zustand for state management (preferred over Context API)

#### Zustand Configuration

```typescript
// src/stores/example.store.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface StoreState {
  // State
  decks: Deck[];
  currentDeck: Deck | null;
  // Actions
  setDecks: (decks: Deck[]) => void;
  setCurrentDeck: (deck: Deck | null) => void;
}

export const useStore = create<StoreState>()(
  devtools((set) => ({
    decks: [],
    currentDeck: null,
    setDecks: (decks) => set({ decks }),
    setCurrentDeck: (deck) => set({ currentDeck: deck }),
  }))
);
```

#### React Hook Form with Zod

```typescript
// Form validation example
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  front: z.string().min(1, 'Front text is required'),
  back: z.string().min(1, 'Back text is required'),
});

type FormData = z.infer<typeof schema>;

// In component
const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

### Error Handling Strategy

```typescript
// API Routes
try {
  // Validate input with Zod
  const validated = schema.parse(body);
  // Process request
} catch (error) {
  if (error instanceof z.ZodError) {
    return new Response(JSON.stringify({ error: "Validation failed", details: error.errors }), { status: 400 });
  }
  // Log to monitoring service
  return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
}

// Client Components
// Use error boundaries for React components
// Display user-friendly error messages
// Implement retry mechanisms for failed API calls
```

## AI Integration Notes

### GPT-4o-mini Configuration

- Maximum input: 1000 characters (enforce client-side truncation)
- Response parsing: Expect structured JSON with front/back pairs
- Error handling: Implement exponential backoff for rate limits
- Prompt engineering: System prompt should emphasize educational quality and conciseness

### Performance Requirements

- P95 response time for AI generation: < 5 seconds
- Implement loading states and progress indicators
- Consider response streaming for better UX

## Styling Guidelines

### Tailwind CSS v4 Usage

- Design tokens defined in `src/styles/global.css` using OKLch color space
- Semantic color variables: `--primary`, `--secondary`, `--accent`, `--destructive`
- Use `cn()` utility from `src/lib/utils.ts` for className composition
- Responsive design: Mobile-first with Tailwind breakpoints
- Dark mode: Prepared with CSS variables, implement with class or data attribute

### Component Styling Pattern

```typescript
// Example with variants
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "base-classes",
  {
    variants: {
      size: {
        sm: "size-sm-classes",
        md: "size-md-classes",
      },
    },
  }
);
```

## Environment Variables

Required environment variables (define in `.env.local`, type in `src/env.d.ts`):

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
OPENROUTER_API_KEY=your_openrouter_key  # For GPT-4o-mini access
```

## Testing Strategy

### Unit & Integration Testing (Vitest)

**Configuration**: `vitest.config.ts`
- Environment: jsdom for React component testing
- Coverage threshold: 80% for lines, functions, branches, and statements
- Test files: `*.{test,spec}.{ts,tsx}` in `src/` and `tests/unit/`, `tests/integration/`
- Setup file: `src/test/setup.ts` (configures MSW, testing-library, and browser API mocks)

**Key Testing Libraries**:
- `@testing-library/react` - React component testing
- `@testing-library/jest-dom` - Additional DOM matchers
- `@testing-library/user-event` - User interaction simulation
- `msw` (Mock Service Worker) - API mocking for tests
- `happy-dom` / `jsdom` - DOM implementation for Node.js

**Testing Patterns**:
```typescript
// Component testing example
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';

describe('Component', () => {
  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<Component />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Result')).toBeInTheDocument();
  });
});
```

### E2E Testing (Playwright)

**Configuration**: `playwright.config.ts`
- Test directory: `tests/e2e/`
- Browser: Chromium/Desktop Chrome only
- Base URL: http://localhost:3000
- Features: Screenshots on failure, video retention on failure, trace on retry
- Parallel execution enabled (except in CI)
- Automatic dev server startup before tests

**Best Practices**:
- Use Page Object Model for maintainable tests
- Leverage `@axe-core/playwright` for accessibility testing
- Use locators for resilient element selection

### MSW (Mock Service Worker)

The project uses MSW for API mocking in tests. Server is configured in `src/test/mocks/server.ts` with handlers in `src/test/mocks/handlers/`.

## CI/CD Pipeline

### GitHub Actions Workflow

**File**: `.github/workflows/ci.yml`

**Trigger Events**:
- Pull requests to `master` branch
- Pushes to `master` and `develop` branches

**Jobs Architecture** (Parallel → Sequential):

1. **Parallel Jobs** (run simultaneously):
   - **Lint Check** (`lint`): Runs ESLint validation
   - **Type Check** (`typecheck`): TypeScript compilation check

2. **Sequential Job** (after parallel jobs succeed):
   - **Test & Build** (`test-and-build`):
     - Runs unit tests with coverage
     - Builds the project
     - Uploads coverage reports
     - Uploads build artifacts
     - Posts coverage summary to PR comments

**Environment Variables Required in CI**:
```yaml
SUPABASE_URL
SUPABASE_KEY
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY
OPENROUTER_API_KEY
```

**Node Version**: Managed via `.nvmrc` file (v22.14.0)

**CI Features**:
- Coverage reporting with lcov-reporter
- Artifact retention (coverage: 30 days, build: 7 days)
- PR comment with test results and coverage summary
- Uses `npm ci` for deterministic dependency installation

## Code Quality Standards

### TypeScript Configuration
- Strict mode enabled
- Path alias: `@/*` maps to `./src/*`
- JSX: React configuration

### ESLint Rules
- TypeScript-ESLint strict rules
- React Compiler validation
- React Hooks enforcement
- JSX accessibility (a11y) checks
- Prettier integration

### Git Hooks (Husky + lint-staged)

**Configuration**: `package.json` lint-staged section
- **TypeScript/TSX/Astro files**: Auto-lint with ESLint on commit
- **JSON/CSS/Markdown files**: Auto-format with Prettier on commit

```json
{
  "lint-staged": {
    "*.{ts,tsx,astro}": ["eslint --fix"],
    "*.{json,css,md}": ["prettier --write"]
  }
}
```

This ensures code quality standards are maintained before each commit.

## Common Development Tasks

### Adding a New Page
Create file in `src/pages/` - automatically becomes a route.

### Adding Interactive Components
1. Create React component in `src/components/`
2. Import in Astro file with appropriate client directive
3. Or use `npx shadcn-ui@latest add [component]` for UI components

### Implementing API Endpoints
```typescript
// src/pages/api/example.ts
import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

const schema = z.object({
  // Define request schema
});

export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase;
  // Implementation
};
```

### Database Operations
Access Supabase through middleware-injected client in `context.locals.supabase` for consistency and proper auth handling.

## Performance Considerations

- Leverage Astro's automatic code splitting
- Use `client:idle` or `client:visible` for non-critical React components
- Implement image optimization with Astro's Image component
- Consider implementing Redis caching for AI responses
- Monitor bundle size and implement lazy loading where appropriate

## Deployment & Production

### Build Configuration
- **Output**: Server-side rendering (SSR) mode
- **Adapter**: Node.js standalone mode
- **Port**: 3000 (configurable via environment)
- **Build Command**: `npm run build`
- **Output Directory**: `./dist`

### Production Requirements
- Node.js 22.14.0 or higher
- All environment variables must be set (see Environment Variables section)
- SSL/TLS termination should be handled by reverse proxy (nginx, etc.)
- Consider using PM2 or similar for process management

### Health Checks & Monitoring
- Implement `/api/health` endpoint for uptime monitoring
- Monitor Supabase connection pool
- Set up error tracking (e.g., Sentry)
- Monitor AI API rate limits and usage

### Deployment Checklist
1. ✅ All tests passing (`npm run test:run`)
2. ✅ Build successful (`npm run build`)
3. ✅ Environment variables configured
4. ✅ Database migrations applied
5. ✅ Supabase RLS policies configured
6. ✅ API rate limiting configured
7. ✅ SSL/TLS configured
8. ✅ Monitoring and logging set up

## Security Best Practices

- Validate all user inputs with Zod
- Sanitize text content before database storage
- Implement rate limiting on AI generation endpoints
- Use Supabase Row Level Security (RLS) policies
- Never expose sensitive keys in client-side code
- ## Tech Stack

### Core Framework & Languages
- **Astro 5** - Static site generator with SSR capabilities
- **TypeScript 5** - Type-safe JavaScript with strict mode
- **React 19** - UI component library (latest version)
- **Node.js 22.14.0** - Runtime environment (specified in `.nvmrc`)

### Styling & UI
- **Tailwind CSS v4** - Utility-first CSS framework (using Vite plugin)
- **shadcn/ui** - Reusable component library
- **Radix UI** - Unstyled, accessible component primitives
- **class-variance-authority** - Variant management for components
- **lucide-react** - Icon library

### Data & Backend
- **Supabase** - Backend-as-a-Service (Auth, Database, Storage)
- **OpenRouter API** - LLM integration (GPT-4o-mini access)

### State & Forms
- **Zustand** - State management (v5)
- **React Hook Form** - Form state management
- **Zod** - Schema validation

### Build & Development Tools
- **Vite** - Build tool (integrated with Astro)
- **ESLint 9** - Linting with flat config
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Pre-commit linting

### Testing Tools
- **Vitest** - Unit and integration testing
- **Playwright** - E2E testing
- **MSW** - API mocking
- **Testing Library** - React component testing utilities

## Project Structure

When introducing changes to the project, always follow the directory structure below:

### Source Code
- `./src` - Source code root
- `./src/layouts` - Astro layouts for page templates
- `./src/pages` - Astro pages (file-based routing)
- `./src/pages/api` - API endpoints
- `./src/components` - Components (Astro for static, React for interactive)
- `./src/components/ui` - shadcn/ui components
- `./src/lib` - Utility functions and shared code
- `./src/stores` - Zustand store definitions
- `./src/types` - TypeScript type definitions
- `./src/styles` - Global styles and CSS modules
- `./src/assets` - Static internal assets

### Testing
- `./src/test` - Test utilities and setup
- `./src/test/setup.ts` - Vitest configuration
- `./src/test/mocks` - MSW mock handlers
- `./tests/unit` - Unit tests
- `./tests/integration` - Integration tests
- `./tests/e2e` - End-to-end Playwright tests

### Configuration
- `./` - Root config files (astro.config.mjs, vitest.config.ts, etc.)
- `./.github/workflows` - GitHub Actions CI/CD pipelines
- `./public` - Public static assets

### Build Output
- `./dist` - Production build output
- `./coverage` - Test coverage reports
- `./.astro` - Astro build cache (gitignored)

When modifying the directory structure, always update this section.

## Coding practices

### Guidelines for clean code

- Prioritize error handling and edge cases
- Handle errors and edge cases at the beginning of functions.
- Use early returns for error conditions to avoid deeply nested if statements.
- Place the happy path last in the function for improved readability.
- Avoid unnecessary else statements; use if-return pattern instead.
- Use guard clauses to handle preconditions and invalid states early.
- Implement proper error logging and user-friendly error messages.
- Consider using custom error types or error factories for consistent error handling.
- --
Rule Type: Auto Attached
globs: '**/*.tsx, **/*.jsx, **/*.astro'
---

## Frontend

### General Guidelines

- Use Astro components (.astro) for static content and layout
- Implement framework components in React only when interactivity is needed

### Guidelines for Styling

#### Tailwind

- Use the @layer directive to organize styles into components, utilities, and base layers
- Use arbitrary values with square brackets (e.g., w-[123px]) for precise one-off designs
- Implement the Tailwind configuration file for customizing theme, plugins, and variants
- Leverage the theme() function in CSS for accessing Tailwind theme values
- Implement dark mode with the dark: variant
- Use responsive variants (sm:, md:, lg:, etc.) for adaptive designs
- Leverage state variants (hover:, focus:, active:, etc.) for interactive elements

### Guidelines for Accessibility

#### ARIA Best Practices

- Use ARIA landmarks to identify regions of the page (main, navigation, search, etc.)
- Apply appropriate ARIA roles to custom interface elements that lack semantic HTML equivalents
- Set aria-expanded and aria-controls for expandable content like accordions and dropdowns
- Use aria-live regions with appropriate politeness settings for dynamic content updates
- Implement aria-hidden to hide decorative or duplicative content from screen readers
- Apply aria-label or aria-labelledby for elements without visible text labels
- Use aria-describedby to associate descriptive text with form inputs or complex elements
- Implement aria-current for indicating the current item in a set, navigation, or process
- Avoid redundant ARIA that duplicates the semantics of native HTML elements
- --
Rule Type: Auto Attached
globs: '**/*.tsx, **/*.jsx'
---

### Guidelines for React

#### React Coding Standards

- Use functional components with hooks instead of class components
- Implement React.memo() for expensive components that render often with the same props
- Utilize React.lazy() and Suspense for code-splitting and performance optimization
- Use the useCallback hook for event handlers passed to child components to prevent unnecessary re-renders
- Prefer useMemo for expensive calculations to avoid recomputation on every render
- Implement useId() for generating unique IDs for accessibility attributes
- Consider using the new useOptimistic hook for optimistic UI updates in forms
- Use useTransition for non-urgent state updates to keep the UI responsive

Key Principles
- Use functional, declarative programming. Avoid classes.
- Use descriptive variable names with auxiliary verbs (e.g., isLoading, hasError).
- Favor named exports for components.
- Use TypeScript for all code. Prefer interfaces over types.
- File structure: imports, types, main component, subcomponents, helpers, static content.
- Use Zod for form validation.
- Use Zustand for state managament.
- Use Shadcn UI, Radix, and Tailwind CSS for components and styling.
- ULTRATHINK
- ### Guidelines for UNIT

#### VITEST

- Leverage the `vi` object for test doubles - Use `vi.fn()` for function mocks, `vi.spyOn()` to monitor existing functions, and `vi.stubGlobal()` for global mocks. Prefer spies over mocks when you only need to verify interactions without changing behavior.
- Master `vi.mock()` factory patterns - Place mock factory functions at the top level of your test file, return typed mock implementations, and use `mockImplementation()` or `mockReturnValue()` for dynamic control during tests. Remember the factory runs before imports are processed.
- Create setup files for reusable configuration - Define global mocks, custom matchers, and environment setup in dedicated files referenced in your `vitest.config.ts`. This keeps your test files clean while ensuring consistent test environments.
- Use inline snapshots for readable assertions - Replace complex equality checks with `expect(value).toMatchInlineSnapshot()` to capture expected output directly in your test file, making changes more visible in code reviews.
- Monitor coverage with purpose and only when asked - Configure coverage thresholds in `vitest.config.ts` to ensure critical code paths are tested, but focus on meaningful tests rather than arbitrary coverage percentages.
- Make watch mode part of your workflow - Run `vitest --watch` during development for instant feedback as you modify code, filtering tests with `-t` to focus on specific areas under development.
- Explore UI mode for complex test suites - Use `vitest --ui` to visually navigate large test suites, inspect test results, and debug failures more efficiently during development.
- Handle optional dependencies with smart mocking - Use conditional mocking to test code with optional dependencies by implementing `vi.mock()` with the factory pattern for modules that might not be available in all environments.
- Configure jsdom for DOM testing - Set `environment: 'jsdom'` in your configuration for frontend component tests and combine with testing-library utilities for realistic user interaction simulation.
- Structure tests for maintainability - Group related tests with descriptive `describe` blocks, use explicit assertion messages, and follow the Arrange-Act-Assert pattern to make tests self-documenting.
- Leverage TypeScript type checking in tests - Enable strict typing in your tests to catch type errors early, use `expectTypeOf()` for type-level assertions, and ensure mocks preserve the original type signatures.


### Guidelines for E2E

#### PLAYWRIGHT

- Initialize configuration only with Chromium/Desktop Chrome browser
- Use browser contexts for isolating test environments
- Implement the Page Object Model for maintainable tests
- Use locators for resilient element selection
- Leverage API testing for backend validation
- Implement visual comparison with expect(page).toHaveScreenshot()
- Use the codegen tool for test recording
- Leverage trace viewer for debugging test failures
- Implement test hooks for setup and teardown
- Use expect assertions with specific matchers
- Leverage parallel execution for faster test runs

Made by 10xDevs & Friends