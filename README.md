# 10xCards

## Table of Contents
1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started Locally](#getting-started-locally)
4. [Available Scripts](#available-scripts)
5. [API Documentation](#api-documentation)
6. [Project Scope (MVP)](#project-scope-mvp)
7. [Project Status](#project-status)
8. [License](#license)

## Project Description

10xCards is a web application designed to automatically generate educational flashcards using Large Language Models (LLMs). The application streamlines the process of creating high-quality flashcards from user-provided text, making learning more efficient and engaging.

The core problem this project solves is the time-consuming nature of manually creating study materials. By leveraging AI, 10xCards drastically reduces the time required to turn notes into a full set of flashcards, allowing users to focus on learning rather than preparation.

Key features of the MVP include:
- **AI-Powered Generation**: Automatically create flashcards from text using gpt-4o-mini.
- **Full CRUD Functionality**: Manually create, read, update, and delete decks and individual cards.
- **Study Mode**: Learn and review cards using an integrated spaced repetition algorithm.
- **User Authentication**: Secure user accounts powered by Supabase.

## Tech Stack

The project is built with a modern, scalable, and efficient tech stack.

| Area      | Technology                               |
|-----------|------------------------------------------|
| **Frontend**  | [Astro](https://astro.build/), [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling**   | [Tailwind CSS](https://tailwindcss.com/), [Shadcn/ui](https://ui.shadcn.com/) |
| **Backend & DB** | [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage) |
| **AI Integration** | [OpenRouter.ai](https://openrouter.ai/) (for LLM access) |
| **Runtime**   | [Node.js](https://nodejs.org/) `22.14.0` |
| **Tooling**   | [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [Husky](https://typicode.github.io/husky/) |
| **Testing**   | [Vitest](https://vitest.dev/), [React Testing Library](https://testing-library.com/react), [Playwright](https://playwright.dev/), [MSW](https://mswjs.io/) |

## Getting Started Locally

To set up and run this project on your local machine, follow these steps.

### Prerequisites

- **Node.js**: Version `22.14.0` is required. We recommend using a version manager like [nvm](https://github.com/nvm-sh/nvm) to ensure compatibility.
- **Package Manager**: This project uses `pnpm`, but you can use `npm` or `yarn` as well.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/10x-cards.git
    cd 10x-cards
    ```

2.  **Set up environment variables:**
    Create a `.env` file in the root of the project by copying the example file.
    ```bash
    cp .env.example .env
    ```
    You will need to fill in the required API keys and URLs in the newly created `.env` file:
    ```
    SUPABASE_URL=your_supabase_project_url
    SUPABASE_KEY=your_supabase_anon_key
    OPENROUTER_API_KEY=your_openrouter_api_key
    ```

3.  **Install dependencies:**
    ```bash
    pnpm install
    ```

4.  **Run the development server:**
    ```bash
    pnpm dev
    ```
    The application will be available at `http://localhost:4321`.

## Available Scripts

The following scripts are available in `package.json`:

| Script     | Description                              |
|------------|------------------------------------------|
| `dev`      | Starts the development server with hot-reloading. |
| `build`    | Builds the application for production.   |
| `preview`  | Previews the production build locally.   |
| `lint`     | Lints the codebase using ESLint.         |
| `lint:fix` | Lints and automatically fixes issues.    |
| `format`   | Formats the code using Prettier.         |
| `test`     | Runs unit and integration tests with Vitest. |
| `test:ui`  | Opens Vitest UI for interactive testing. |
| `test:e2e` | Runs end-to-end tests with Playwright.   |
| `test:e2e:ui` | Opens Playwright UI for debugging E2E tests. |

## Testing

10xCards implements a comprehensive testing strategy following the testing pyramid approach to ensure high quality and reliability.

### Testing Strategy

Our testing approach covers multiple levels:

1. **Unit Tests**: Testing individual functions, hooks, and components in isolation
2. **Integration Tests**: Verifying interactions between components, stores, and API routes
3. **End-to-End Tests**: Simulating real user workflows in the browser
4. **Database Tests**: Validating RLS policies, triggers, and constraints
5. **Accessibility Tests**: Ensuring WCAG 2.1 AA compliance

### Testing Tools

| Tool | Purpose |
|------|---------|
| **Vitest** | Fast unit and integration test runner |
| **React Testing Library** | Testing React components and user interactions |
| **Playwright** | End-to-end browser testing (preferred) |
| **MSW (Mock Service Worker)** | API mocking for stable test environments |
| **Axe DevTools** | Automated accessibility testing |

### Running Tests

```bash
# Run all unit and integration tests
pnpm test

# Run tests in watch mode during development
pnpm test:watch

# Open Vitest UI for interactive testing
pnpm test:ui

# Run E2E tests with Playwright
pnpm test:e2e

# Run E2E tests in headed mode (see browser)
pnpm test:e2e:headed

# Open Playwright UI for debugging E2E tests
pnpm test:e2e:ui

# Generate test coverage report
pnpm test:coverage
```

### Test Coverage Goals

- **Business Logic**: >80% coverage for services, hooks, and utilities
- **Components**: Focus on user interactions and critical paths
- **API Routes**: Complete coverage of all endpoints with mocked Supabase
- **E2E Tests**: All critical user flows (P1 and P2 priority)

### Continuous Integration

All tests are automatically run in GitHub Actions CI pipeline:
- Unit and integration tests: on every push and pull request
- E2E tests: before deployment to staging environment
- Accessibility checks: integrated into component tests

For detailed testing specifications, see the [Test Plan](.ai/test-plan.md).

## API Documentation

10xCards provides a comprehensive REST API for all operations. Complete documentation is available in multiple formats:

### 📚 Interactive Documentation (Swagger UI)

Visit the interactive API documentation at:
```
http://localhost:3000/api-docs
```

The Swagger UI interface allows you to:
- Explore all available endpoints
- View request/response schemas
- Test endpoints directly from the browser
- See example requests in multiple formats

### 📖 OpenAPI Specification

The OpenAPI 3.0 specification is available at:
- **File**: `docs/api/openapi.yaml`
- **Live**: `http://localhost:3000/openapi.yaml`

You can import this spec into tools like Postman, Insomnia, or any OpenAPI-compatible client.

### 💻 Code Examples

Detailed code examples in multiple languages are available in:
```
docs/api/README.md
```

Includes examples for:
- cURL
- JavaScript/TypeScript (fetch & axios)
- React hooks
- Python

### 🔑 Authentication

All API endpoints require JWT authentication:

1. Obtain a JWT token by authenticating with Supabase
2. Include the token in requests: `Authorization: Bearer <token>`
3. Tokens are automatically included when using the Swagger UI

### 📋 Currently Implemented Endpoints

| Method | Endpoint            | Description                           |
|--------|---------------------|---------------------------------------|
| GET    | `/api/decks/:id`    | Get deck with all flashcards          |
| GET    | `/api/health`       | Check API health status               |

**Note**: Additional endpoints are being implemented according to the API plan in `docs/api/openapi.yaml`.

## Project Scope (MVP)

To ensure a focused and timely delivery of the core value proposition, the following features are explicitly included in or excluded from the MVP.

### In Scope:
- User registration and login (email/password).
- Full CRUD for decks and text-only flashcards.
- AI generation of flashcards from a text input (max 1000 characters).
- A review screen to edit, approve, or discard AI-generated cards.
- A study mode implementing a third-party spaced repetition algorithm.

### Out of Scope:
- Advanced, custom-built spaced repetition algorithms.
- Importing from file formats (e.g., PDF, DOCX).
- Social features like sharing or browsing public decks.
- Rich text formatting or image support on flashcards.
- Dedicated native mobile applications (the MVP is a responsive web app).

## Project Status

**Current Phase: In Development**

This project is actively being developed. The work is guided by the Product Requirements Document (PRD) to build the Minimum Viable Product (MVP).

## License

This project is currently unlicensed. A license (e.g., MIT) will be added in the future.