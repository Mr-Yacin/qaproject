# Contributing to Q&A Article FAQ API

Thank you for your interest in contributing! This guide will help you understand the project structure and conventions.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Folder Organization Conventions](#folder-organization-conventions)
- [Adding New Files](#adding-new-files)
- [Documentation Guidelines](#documentation-guidelines)
- [Code Guidelines](#code-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/qa-article-faq-api.git`
3. Install dependencies: `npm install`
4. Set up your environment: `cp .env.example .env` and configure
5. Run tests to verify setup: `npm test`
6. Create a feature branch: `git checkout -b feature/your-feature-name`

For detailed setup instructions, see [docs/setup/getting-started.md](docs/setup/getting-started.md).

## Project Structure

The project follows a clean, organized structure with clear separation of concerns:

```
/
├── docs/                          # All project documentation
│   ├── setup/                     # Setup and installation guides
│   ├── architecture/              # System design and architecture docs
│   ├── testing/                   # Testing guides and procedures
│   └── reports/                   # Test reports and audit results
│
├── scripts/                       # Utility scripts
│   ├── test/                      # Test execution scripts
│   ├── verify/                    # Verification scripts
│   └── performance/               # Performance testing scripts
│
├── tests/                         # Test code
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   ├── e2e/                       # End-to-end tests
│   └── utils/                     # Test utilities
│
├── src/                           # Application source code
│   ├── app/api/                   # API routes (Next.js App Router)
│   ├── lib/                       # Shared libraries and utilities
│   └── types/                     # TypeScript type definitions
│
├── prisma/                        # Database schema and migrations
├── test-requests/                 # API testing examples
└── public/                        # Static assets
```

## Folder Organization Conventions

### Documentation (`docs/`)

All project documentation lives in the `docs/` directory, organized by purpose:

#### `docs/setup/`
- **Purpose:** Setup and installation guides
- **What goes here:** Getting started guides, environment configuration, database setup, Docker setup
- **Naming:** Use kebab-case (e.g., `getting-started.md`, `environment-setup.md`)
- **Index:** Maintain `docs/setup/README.md` with links to all setup guides

#### `docs/architecture/`
- **Purpose:** System design and architecture documentation
- **What goes here:** Architecture overviews, design decisions, caching strategies, performance optimizations, accessibility implementation
- **Naming:** Use kebab-case (e.g., `caching-strategy.md`, `performance-optimization.md`)
- **Index:** Maintain `docs/architecture/README.md` with architecture overview

#### `docs/testing/`
- **Purpose:** Testing guides and procedures
- **What goes here:** How to run tests, how to write tests, testing strategies, manual testing procedures
- **Naming:** Use kebab-case (e.g., `unit-testing.md`, `e2e-testing.md`)
- **Index:** Maintain `docs/testing/README.md` with testing guide index

#### `docs/reports/`
- **Purpose:** Test reports, audit results, and task completion summaries
- **What goes here:** Test execution reports, accessibility audits, performance audits
- **Naming:** Use timestamps for test results: `YYYY-MM-DD-description.md`
- **Index:** Maintain `docs/reports/README.md` with reports index

### Scripts (`scripts/`)

Utility scripts are organized by function:

#### `scripts/test/`
- **Purpose:** Scripts that execute tests
- **What goes here:** Test runners, test automation scripts
- **Naming:** Prefix with `test-` (e.g., `test-homepage.js`, `test-admin-auth.js`)
- **Documentation:** Document all scripts in `scripts/README.md`

#### `scripts/verify/`
- **Purpose:** Scripts that verify configuration or setup
- **What goes here:** Configuration verification, setup validation scripts
- **Naming:** Prefix with `verify-` (e.g., `verify-admin-auth.js`, `verify-caching-strategy.js`)
- **Documentation:** Document all scripts in `scripts/README.md`

#### `scripts/performance/`
- **Purpose:** Performance testing and benchmarking scripts
- **What goes here:** Lighthouse tests, load tests, performance benchmarks
- **Naming:** Descriptive names (e.g., `lighthouse-performance-test.js`, `simple-performance-test.js`)
- **Documentation:** Document all scripts in `scripts/README.md`

### Tests (`tests/`)

Test code is organized by test type:

#### `tests/unit/`
- **Purpose:** Pure unit tests that test individual functions/modules in isolation
- **What goes here:** Tests with no external dependencies (mocked database, no network calls)
- **Structure:**
  - `tests/unit/api/` - Unit tests for API logic
  - `tests/unit/lib/` - Unit tests for library functions
- **Naming:** `*.test.ts` or `*.spec.ts`

#### `tests/integration/`
- **Purpose:** Integration tests that test multiple components working together
- **What goes here:** Tests with real database connections, tests that verify component integration
- **Structure:**
  - `tests/integration/api/` - API integration tests
- **Naming:** `*.test.ts` or `*.spec.ts`

#### `tests/e2e/`
- **Purpose:** End-to-end tests that test complete user workflows
- **What goes here:** Tests that simulate real user interactions, full-stack tests
- **Naming:** `*.test.ts` or `*.spec.ts`

#### `tests/utils/`
- **Purpose:** Shared test utilities and helpers
- **What goes here:** Test fixtures, mock data, helper functions
- **Naming:** Descriptive names (e.g., `test-helpers.ts`, `mock-data.ts`)

### Source Code (`src/`)

Application source code follows Next.js App Router conventions:

#### `src/app/api/`
- **Purpose:** API route handlers
- **Structure:** Each endpoint in its own folder with `route.ts`
- **Convention:** Follow Next.js App Router file-based routing

#### `src/lib/`
- **Purpose:** Shared libraries and utilities
- **Structure:**
  - `security/` - Security-related utilities (HMAC, timing)
  - `validation/` - Validation schemas (Zod)
  - `services/` - Business logic layer
  - `repositories/` - Data access layer
- **Convention:** Organize by concern, not by feature

#### `src/types/`
- **Purpose:** TypeScript type definitions
- **Naming:** `*.ts` files with type/interface exports

## Adding New Files

### Adding Documentation

1. **Determine the category:** Setup, Architecture, Testing, or Reports
2. **Create the file** in the appropriate subdirectory
3. **Use kebab-case naming:** `my-new-document.md`
4. **Update the index:** Add a link in the relevant `README.md`
5. **Add cross-references:** Link to related documents

Example:
```bash
# Adding a new architecture document
touch docs/architecture/api-design.md
# Edit docs/architecture/README.md to add link
```

### Adding Scripts

1. **Determine the category:** Test, Verify, or Performance
2. **Create the script** in the appropriate subdirectory
3. **Use descriptive naming:** `test-new-feature.js` or `verify-new-config.js`
4. **Document in scripts/README.md:** Add description and usage
5. **Add npm script** if appropriate in `package.json`

Example:
```bash
# Adding a new test script
touch scripts/test/test-new-feature.js
# Edit scripts/README.md to document it
# Add to package.json if needed
```

### Adding Tests

1. **Determine the test type:** Unit, Integration, or E2E
2. **Create the test file** in the appropriate subdirectory
3. **Use `.test.ts` extension:** `my-feature.test.ts`
4. **Follow existing patterns:** Look at similar tests for structure
5. **Update test documentation** if adding new patterns

Example:
```bash
# Adding a new unit test
touch tests/unit/api/new-endpoint.test.ts

# Adding a new integration test
touch tests/integration/api/new-workflow.test.ts
```

## Documentation Guidelines

### Writing Style

- **Be clear and concise:** Get to the point quickly
- **Use examples:** Show, don't just tell
- **Include code snippets:** Make it easy to copy and use
- **Add troubleshooting:** Anticipate common issues
- **Keep it updated:** Update docs when code changes

### Markdown Formatting

- Use headers to organize content (`#`, `##`, `###`)
- Use code blocks with language specification (```javascript, ```bash)
- Use bullet points for lists
- Use tables for structured data
- Add links to related documents

### Documentation Structure

Each major documentation file should include:

1. **Title and overview:** What is this document about?
2. **Table of contents:** For longer documents
3. **Main content:** Organized with clear headers
4. **Examples:** Practical examples where applicable
5. **Related links:** Links to related documentation

## Code Guidelines

### TypeScript

- Use TypeScript for all new code
- Define types/interfaces for all data structures
- Avoid `any` type - use proper typing
- Use Zod for runtime validation

### Code Style

- Follow the existing ESLint configuration
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused
- Use async/await over promises

### API Routes

- Validate all inputs with Zod schemas
- Use proper HTTP status codes
- Return consistent response formats
- Handle errors gracefully
- Add appropriate logging

### Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate and sanitize all inputs
- Use HMAC signatures for webhooks
- Follow security best practices

## Testing Guidelines

### Test Coverage

- Write tests for all new features
- Aim for high test coverage (>80%)
- Test both success and error cases
- Test edge cases and boundary conditions

### Test Types

**Unit Tests:**
- Test individual functions in isolation
- Mock external dependencies
- Fast execution
- Place in `tests/unit/`

**Integration Tests:**
- Test multiple components together
- Use real database (test database)
- Test API endpoints end-to-end
- Place in `tests/integration/`

**E2E Tests:**
- Test complete user workflows
- Simulate real user interactions
- Test critical paths
- Place in `tests/e2e/`

### Test Naming

- Use descriptive test names
- Follow pattern: `should [expected behavior] when [condition]`
- Group related tests with `describe` blocks

Example:
```typescript
describe('POST /api/ingest', () => {
  it('should create a new topic when valid data is provided', async () => {
    // Test implementation
  });

  it('should return 401 when authentication fails', async () => {
    // Test implementation
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test tests/unit/api/topics.test.ts

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Pull Request Process

1. **Create a feature branch:** `git checkout -b feature/your-feature-name`
2. **Make your changes:** Follow the guidelines above
3. **Write/update tests:** Ensure all tests pass
4. **Update documentation:** Update relevant docs
5. **Run linting:** `npm run lint`
6. **Run tests:** `npm test`
7. **Commit your changes:** Use clear, descriptive commit messages
8. **Push to your fork:** `git push origin feature/your-feature-name`
9. **Create a pull request:** Describe your changes clearly
10. **Address review feedback:** Make requested changes

### Commit Message Format

Use clear, descriptive commit messages:

```
feat: Add new endpoint for bulk topic import
fix: Resolve HMAC signature validation issue
docs: Update API documentation for /api/topics
test: Add integration tests for revalidation endpoint
refactor: Simplify content service logic
```

Prefixes:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

### Pull Request Checklist

- [ ] Code follows project conventions
- [ ] Tests added/updated and passing
- [ ] Documentation updated
- [ ] No linting errors
- [ ] Commit messages are clear
- [ ] PR description explains the changes
- [ ] Related issues referenced

## Questions?

If you have questions or need help:

1. Check the [documentation](docs/README.md)
2. Look at existing code for examples
3. Open an issue for discussion
4. Ask in pull request comments

Thank you for contributing!
