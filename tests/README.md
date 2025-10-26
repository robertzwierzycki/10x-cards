# Testing Guide for 10xCards

This document provides guidance on writing and running tests for the 10xCards application.

## Test Structure

```
tests/
├── unit/              # Unit tests (functions, utilities, hooks)
├── integration/       # Integration tests (component + API)
├── e2e/              # End-to-End tests (Playwright)
└── README.md         # This file

src/
└── test/
    ├── setup.ts      # Test setup and configuration
    ├── mocks/        # MSW handlers and server setup
    └── utils/        # Test utilities and helpers
```

## Running Tests

### Unit & Integration Tests (Vitest)

```bash
# Run all tests
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Generate coverage report
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug

# Show test report
npm run test:e2e:report
```

## Writing Tests

### Unit Tests

Unit tests verify small, isolated pieces of code (functions, utilities, hooks).

**Example:**

```typescript
import { describe, it, expect } from 'vitest';

function add(a: number, b: number): number {
  return a + b;
}

describe('add', () => {
  it('should add two numbers', () => {
    expect(add(1, 2)).toBe(3);
  });
});
```

### Component Tests

Test React components using React Testing Library.

**Example:**

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByText('Click me'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests

Test interactions between multiple components or modules, often with API mocking.

**Example:**

```typescript
import { describe, it, expect } from 'vitest';
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('Deck API', () => {
  it('should fetch decks successfully', async () => {
    const response = await fetch('/api/decks');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.decks).toBeDefined();
  });

  it('should handle server errors', async () => {
    // Override handler for this test
    server.use(
      http.get('/api/decks', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      })
    );

    const response = await fetch('/api/decks');
    expect(response.status).toBe(500);
  });
});
```

### E2E Tests

Test complete user flows in a real browser using Playwright.

**Example:**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('should display user decks', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.getByText(/my decks/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /new deck/i })).toBeVisible();
  });
});
```

### Accessibility Tests

Test WCAG compliance using Axe.

**Example:**

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  expect(results.violations).toEqual([]);
});
```

## Mocking with MSW

Mock Service Worker (MSW) intercepts HTTP requests in tests.

### Adding API Handlers

Edit `src/test/mocks/handlers.ts`:

```typescript
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/decks', () => {
    return HttpResponse.json({
      decks: [
        { id: '1', name: 'Test Deck' },
      ],
    });
  }),
];
```

### Overriding Handlers in Tests

```typescript
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

test('custom response', async () => {
  server.use(
    http.get('/api/decks', () => {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 });
    })
  );

  // Your test code
});
```

## Test Utilities

### Custom Render

Use the custom render function that includes all providers:

```typescript
import { render, screen } from '@/test/utils/test-utils';
```

### Mock Data

Use mock data factories from `src/test/utils/mockData.ts`:

```typescript
import { mockDeck, mockFlashcard } from '@/test/utils/mockData';

const deck = mockDeck({ name: 'Custom Name' });
const card = mockFlashcard({ front: 'Custom Question' });
```

## Best Practices

### General

- Follow the Arrange-Act-Assert pattern
- Write descriptive test names
- One assertion per test when possible
- Keep tests independent and isolated
- Use `describe` blocks to group related tests

### Component Tests

- Test behavior, not implementation details
- Use `getByRole` and `getByLabelText` over `getByTestId`
- Simulate user interactions with `userEvent`
- Avoid testing internal state

### E2E Tests

- Focus on critical user flows
- Use Page Object Model for complex pages
- Handle asynchronous operations with `waitFor`
- Keep E2E tests minimal - they are slow

### Mocking

- Mock external dependencies (APIs, databases)
- Don't mock what you're testing
- Reset mocks after each test (handled automatically)

## CI/CD

Tests run automatically on:

- Every push to `master`, `main`, or `develop`
- Every pull request

The CI pipeline runs:

1. Unit and integration tests with coverage
2. E2E tests with Playwright
3. Linting and type checking

## Coverage Goals

- **Target**: >80% coverage for business logic
- **Files**: Focus on services, hooks, utilities
- **Exclusions**: Test files, config files, type definitions

## Debugging

### Vitest

```bash
# Run specific test file
npm test -- path/to/test.spec.ts

# Run tests matching pattern
npm test -- -t "test name pattern"

# View test coverage
npm run test:coverage
```

### Playwright

```bash
# Debug mode with browser UI
npm run test:e2e:debug

# Interactive UI mode
npm run test:e2e:ui

# View test report
npm run test:e2e:report
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
- [Axe Accessibility Testing](https://github.com/dequelabs/axe-core)

## Troubleshooting

### Tests fail in CI but pass locally

- Check Node.js version (CI uses Node 20)
- Ensure dependencies are installed with `npm ci`
- Check for race conditions in async tests

### MSW handlers not working

- Verify server is started in `setup.ts`
- Check handler URL matches exactly
- Use `server.listHandlers()` to debug

### Playwright tests timeout

- Increase timeout in `playwright.config.ts`
- Use `page.waitFor*` methods for async operations
- Check if dev server is running

### Coverage not generated

- Run `npm run test:coverage` instead of `npm test`
- Check excluded patterns in `vitest.config.ts`
- Ensure tests are actually running
