# Scripts

Utility scripts for testing, verification, and performance analysis of the Q&A Article FAQ API.

## Quick Reference

### Test Scripts

Run API and integration tests:

```bash
# Test CMS API with Docker
node scripts/test-cms-api-docker.js

# Test homepage functionality
node scripts/test-homepage.js

# Test admin authentication
node scripts/test-admin-auth.js

# Test cache revalidation
node scripts/test-cache-revalidation.js
```

### Verification Scripts

Verify system configuration and functionality:

```bash
# Verify admin authentication setup
node scripts/verify-admin-auth.js

# Verify caching strategy implementation
node scripts/verify-caching-strategy.js

# Verify code splitting configuration
node scripts/verify-code-splitting.js
```

### Performance Scripts

Run performance tests and benchmarks:

```bash
# Run Lighthouse performance test
node scripts/lighthouse-performance-test.js

# Run simple performance test
node scripts/simple-performance-test.js
```

## Script Categories

### Test Scripts (`test/`)

Scripts that execute tests against the API and application:

- **`test-cms-api-docker.js`**
  - Tests CMS API endpoints in Docker environment
  - Validates ingestion, retrieval, and revalidation
  - Requires Docker containers to be running
  - Usage: `node scripts/test-cms-api-docker.js`

- **`test-homepage.js`**
  - Tests homepage functionality and rendering
  - Validates content display and navigation
  - Checks for accessibility issues
  - Usage: `node scripts/test-homepage.js`

- **`test-admin-auth.js`**
  - Tests admin authentication flow
  - Validates login, session management, logout
  - Checks authorization for protected routes
  - Usage: `node scripts/test-admin-auth.js`

- **`test-cache-revalidation.js`**
  - Tests cache revalidation functionality
  - Validates cache invalidation on content updates
  - Checks cache tag behavior
  - Usage: `node scripts/test-cache-revalidation.js`

### Verification Scripts (`verify/`)

Scripts that verify configuration and implementation:

- **`verify-admin-auth.js`**
  - Verifies admin authentication is properly configured
  - Checks environment variables
  - Validates middleware setup
  - Usage: `node scripts/verify-admin-auth.js`

- **`verify-caching-strategy.js`**
  - Verifies caching strategy implementation
  - Checks cache configuration
  - Validates revalidation setup
  - Usage: `node scripts/verify-caching-strategy.js`

- **`verify-code-splitting.js`**
  - Verifies code splitting configuration
  - Checks bundle sizes
  - Validates lazy loading setup
  - Usage: `node scripts/verify-code-splitting.js`

### Performance Scripts (`performance/`)

Scripts for performance testing and benchmarking:

- **`lighthouse-performance-test.js`**
  - Runs Lighthouse performance audit
  - Generates detailed performance report
  - Measures Core Web Vitals
  - Outputs JSON and HTML reports
  - Usage: `node scripts/lighthouse-performance-test.js`

- **`simple-performance-test.js`**
  - Quick performance benchmark
  - Tests API response times
  - Measures database query performance
  - Usage: `node scripts/simple-performance-test.js`

## Script Structure

```
scripts/
├── README.md                          # This file
├── test/                              # Test scripts
│   ├── test-cms-api-docker.js
│   ├── test-homepage.js
│   ├── test-admin-auth.js
│   └── test-cache-revalidation.js
├── verify/                            # Verification scripts
│   ├── verify-admin-auth.js
│   ├── verify-caching-strategy.js
│   └── verify-code-splitting.js
└── performance/                       # Performance scripts
    ├── lighthouse-performance-test.js
    └── simple-performance-test.js
```

## Prerequisites

### All Scripts

- Node.js 18+
- Project dependencies installed (`npm install`)
- Environment variables configured (`.env` file)

### Docker Test Scripts

- Docker and Docker Compose installed
- Containers running (`docker-compose up`)

### Performance Scripts

- Lighthouse CLI installed (for `lighthouse-performance-test.js`)
  ```bash
  npm install -g lighthouse
  ```

## Environment Variables

Most scripts require these environment variables:

```bash
# API Configuration
API_URL="http://localhost:3000"
INGEST_API_KEY="your-api-key"
INGEST_WEBHOOK_SECRET="your-webhook-secret"

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Admin Auth (for admin-auth scripts)
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="secure-password"
```

## Running Scripts

### Basic Usage

```bash
node scripts/[category]/[script-name].js
```

### With Environment Variables

```bash
API_URL=http://localhost:3000 node scripts/test/test-homepage.js
```

### With npm Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "test:docker": "node scripts/test/test-cms-api-docker.js",
    "test:homepage": "node scripts/test/test-homepage.js",
    "verify:auth": "node scripts/verify/verify-admin-auth.js",
    "perf:lighthouse": "node scripts/performance/lighthouse-performance-test.js"
  }
}
```

Then run:
```bash
npm run test:docker
npm run verify:auth
npm run perf:lighthouse
```

## Script Output

### Test Scripts

Test scripts typically output:
- Test case descriptions
- Pass/fail status for each test
- Error messages and stack traces
- Summary of results

### Verification Scripts

Verification scripts typically output:
- Configuration check results
- Missing or incorrect settings
- Recommendations for fixes
- Overall verification status

### Performance Scripts

Performance scripts typically output:
- Performance metrics (response times, scores)
- Core Web Vitals (LCP, FID, CLS)
- Recommendations for optimization
- Report files (JSON, HTML)

## Troubleshooting

### Script Fails to Run

1. Check Node.js version: `node --version` (should be 18+)
2. Install dependencies: `npm install`
3. Verify environment variables are set
4. Check script has correct permissions

### Connection Errors

1. Verify API is running: `curl http://localhost:3000/api/topics`
2. Check `API_URL` environment variable
3. Ensure Docker containers are running (for Docker tests)
4. Check firewall settings

### Authentication Errors

1. Verify `INGEST_API_KEY` is set correctly
2. Check `INGEST_WEBHOOK_SECRET` matches server
3. Ensure timestamps are within ±5 minutes
4. Verify signature generation is correct

### Performance Test Issues

1. Ensure Lighthouse is installed: `lighthouse --version`
2. Close other applications to reduce noise
3. Run on a stable network connection
4. Use incognito/private mode for consistent results

## Writing New Scripts

### Script Template

```javascript
#!/usr/bin/env node

/**
 * Script Name: [name]
 * Description: [what it does]
 * Usage: node scripts/[category]/[name].js
 */

// Load environment variables
require('dotenv').config();

// Configuration
const config = {
  apiUrl: process.env.API_URL || 'http://localhost:3000',
  // ... other config
};

// Main function
async function main() {
  try {
    console.log('Starting [script name]...');
    
    // Script logic here
    
    console.log('✓ [Script name] completed successfully');
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
```

### Best Practices

1. **Error Handling**: Always use try-catch blocks
2. **Exit Codes**: Exit with code 1 on failure, 0 on success
3. **Logging**: Use clear, descriptive console output
4. **Configuration**: Load from environment variables
5. **Documentation**: Include usage comments at the top
6. **Modularity**: Export functions for testing

## Related Documentation

- [Testing Guides](../docs/testing/) - Comprehensive testing documentation
- [Setup Guides](../docs/setup/) - Environment setup
- [Architecture](../docs/architecture/) - System architecture
- [Test Reports](../docs/reports/) - Test results and reports

## Contributing

When adding new scripts:

1. Place in the appropriate category directory
2. Follow the naming convention: `verb-noun.js`
3. Include usage documentation in comments
4. Add error handling and clear output
5. Update this README with script description
6. Test the script thoroughly
7. Add to `package.json` scripts if appropriate
