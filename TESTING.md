# Testing Overview

This document provides a comprehensive overview of the testing strategy and available testing resources.

## Testing Structure

### 📁 `/tests/` - Main Test Suite
- **Unit Tests**: Individual component and function tests
- **Integration Tests**: Multi-component interaction tests  
- **E2E Tests**: Full user journey tests with Puppeteer
- **Test Utilities**: Shared helpers and mock data
- **Test Reports**: Manual test documentation and results

### 📁 `/test-requests/` - API Testing Resources
- **Example Payloads**: Sample JSON for API endpoints
- **Postman Collection**: Ready-to-use API client collection
- **Security Tests**: HMAC authentication and security validation
- **Testing Scripts**: Node.js scripts for automated API testing

### 📁 `/scripts/` - Automation Scripts
- **Test Scripts**: Automated feature testing
- **Verification Scripts**: System health and feature checks
- **Performance Scripts**: Lighthouse and load testing

### 📁 `/test-results/` - Generated Results
- Automated test outputs (gitignored)
- Performance benchmarks
- Coverage reports

## Quick Start Testing

### 1. Run the Full Test Suite
```bash
npm test                    # All tests with Vitest
npm run test:coverage       # With coverage report
```

### 2. Test Specific Features
```bash
npm run test:cms           # CMS API via Docker
npm run test:homepage      # Homepage functionality  
npm run test:admin-auth    # Admin authentication
npm run test:cache         # Cache revalidation
```

### 3. Verify System Health
```bash
npm run verify:all         # All features
npm run verify:env         # Environment setup
npm run verify:seed        # Database seeding
```

### 4. Performance Testing
```bash
npm run perf:lighthouse    # Lighthouse audit
npm run perf:simple        # Basic performance tests
```

### 5. API Testing
```bash
# Using test scripts
node test-requests/test-api.js ingest
node test-requests/test-security.js

# Using Postman collection
# Import test-requests/postman-collection.json
```

## Testing Workflow

### Development Testing
1. **Unit Tests**: Run during development with `npm test`
2. **Integration Tests**: Test API endpoints and database interactions
3. **Manual Testing**: Use admin interface and verify functionality

### Pre-deployment Testing
1. **Full Test Suite**: `npm test` 
2. **Feature Verification**: `npm run verify:all`
3. **Performance Check**: `npm run perf:lighthouse`
4. **Security Testing**: `node test-requests/test-security.js`

### Production Monitoring
1. **Health Checks**: Regular verification script runs
2. **Performance Monitoring**: Periodic Lighthouse audits
3. **API Testing**: Automated endpoint validation

## Test Data Management

### Database Seeding
```bash
npm run seed              # Basic seed data
npm run seed:large        # Larger dataset (50 items)
npm run seed:append       # Add to existing data
```

### Test Environment
- Tests use isolated test database
- Seed data provides consistent test scenarios
- Mock data generators in `/tests/utils/`

## Continuous Integration

The testing structure supports CI/CD with:
- Automated test execution
- Coverage reporting
- Performance benchmarking
- Security validation
- Docker-based testing

## Documentation

Each testing directory contains detailed README files:
- `/tests/README.md` - Test suite organization
- `/test-requests/README.md` - API testing guide  
- `/scripts/README.md` - Automation scripts guide

## Best Practices

1. **Write tests first** for new features
2. **Use appropriate test types** (unit vs integration vs e2e)
3. **Keep tests isolated** and independent
4. **Use descriptive test names** and organize by feature
5. **Mock external dependencies** in unit tests
6. **Test error conditions** and edge cases
7. **Maintain test data** with seeding scripts
8. **Document manual test procedures** in `/tests/reports/`