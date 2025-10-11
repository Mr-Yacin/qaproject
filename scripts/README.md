# Automation Scripts

This directory contains automation scripts for testing, verification, and performance monitoring.

## Directory Structure

### `/scripts/test/`
Automated test execution scripts
- Individual feature tests
- Integration test runners
- Docker-based testing

### `/scripts/verify/`
Feature verification and health check scripts
- Environment verification
- Feature completeness checks
- System health monitoring

### `/scripts/performance/`
Performance testing and monitoring
- Lighthouse performance tests
- Load testing scripts
- Performance benchmarking

### `/scripts/test-results/`
Generated test results and reports (gitignored)
- Performance test results
- Automated test outputs
- Benchmark data

## Quick Commands

### Testing Scripts
```bash
# Test specific features
node scripts/test/test-admin-auth.js
node scripts/test/test-homepage.js
node scripts/test/test-cms-api-docker.js

# Test mobile functionality
node scripts/test/test-mobile-sidebar.js
node scripts/test/test-sidebar-persistence.js

# Test API functionality
node scripts/test/test-cache-revalidation.js
node scripts/test/test-topics-page.js
```

### Verification Scripts
```bash
# Verify all features
node scripts/verify/verify-all-features.js

# Verify specific components
node scripts/verify/verify-admin-auth.js
node scripts/verify/verify-caching-strategy.js
node scripts/verify/verify-environment.js
node scripts/verify/verify-seed-data.js
node scripts/verify/verify-code-splitting.js
```

### Performance Scripts
```bash
# Run Lighthouse performance tests
node scripts/performance/lighthouse-performance-test.js

# Run simple performance benchmarks
node scripts/performance/simple-performance-test.js
```

## Integration with npm scripts

These scripts are integrated with your package.json:

```bash
# Testing
npm run test:cms
npm run test:homepage
npm run test:admin-auth
npm run test:cache

# Verification
npm run verify:all
npm run verify:auth
npm run verify:caching
npm run verify:env
npm run verify:seed

# Performance
npm run perf:lighthouse
npm run perf:simple
```

## Results Storage

- Test results are automatically stored in `/test-results/` (root level)
- Performance data goes to `/scripts/test-results/` 
- Both directories are gitignored to avoid committing large result files
- Manual test reports are documented in `/tests/reports/` for tracking

## Usage Notes

- Scripts assume the development server is running on localhost:3000
- Environment variables should be set in .env file
- Docker scripts require docker-compose to be available
- Performance scripts may take several minutes to complete