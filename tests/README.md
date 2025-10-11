# Test Suite Organization

## Directory Structure

### `/tests/unit/`
Unit tests for individual functions and components
- API logic tests (`/api/`)
- Library function tests (`/lib/`)
- Component tests

### `/tests/integration/`
Integration tests that test multiple components working together
- API endpoint tests
- Database integration tests
- Authentication flow tests

### `/tests/e2e/`
End-to-end tests using Puppeteer
- Full user journey tests
- Cross-browser compatibility tests
- Performance tests

### `/tests/utils/`
Shared test utilities and helpers
- Mock data generators
- Test setup functions
- Common assertions

### `/tests/reports/`
Test execution reports and documentation
- Manual test checklists
- Test result summaries
- Bug reports and fixes

## Running Tests

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage
```

## Test Results

Test results are automatically generated in `/test-results/` (gitignored).
Manual test reports are documented in `/tests/reports/` for tracking.