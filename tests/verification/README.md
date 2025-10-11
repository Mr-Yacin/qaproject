# API Verification Test Framework

This directory contains a comprehensive test framework for verifying API functionality after admin interface changes, including SEO enhancements, image/thumbnail support, and Prisma schema modifications.

## Overview

The verification framework ensures that:
- All API endpoints continue to function correctly
- New fields (SEO, thumbnails) are properly integrated
- Database schema changes don't break existing functionality
- Authentication and security measures remain intact
- Performance and caching behavior is maintained
- Data integrity is preserved between admin and API interfaces
- Backward compatibility is maintained

## Directory Structure

```
tests/verification/
├── types/                  # TypeScript type definitions
│   ├── index.ts           # Core types and interfaces
│   ├── test-suite.ts      # Test suite management types
│   └── api-types.ts       # API-specific types
├── config/                # Configuration management
│   ├── index.ts           # Main configuration loader
│   ├── environments.ts    # Environment-specific configs
│   ├── test-scenarios.ts  # Test scenario definitions
│   └── .env.example       # Environment variables template
├── utils/                 # Utility functions and helpers
│   └── index.ts           # Test utilities and helpers
├── setup.ts               # Test environment setup
├── tsconfig.json          # TypeScript configuration
├── vitest.config.ts       # Vitest configuration
└── README.md              # This file
```

## Getting Started

### 1. Environment Setup

Copy the environment template and configure your settings:

```bash
cp tests/verification/config/.env.example tests/verification/.env
```

Edit the `.env` file with your configuration:

```env
# API Configuration
VERIFICATION_API_BASE_URL=http://localhost:3000
VERIFICATION_API_KEY=your_api_key_here
VERIFICATION_WEBHOOK_SECRET=your_webhook_secret_here

# Performance Thresholds
VERIFICATION_MAX_RESPONSE_TIME=500
VERIFICATION_MIN_THROUGHPUT=100

# Test Environment
VERIFICATION_ENVIRONMENT=development
```

### 2. Running Tests

Run verification tests using Vitest:

```bash
# Run all verification tests
npm run test -- tests/verification

# Run specific test file
npm run test -- tests/verification/api-endpoints.test.ts

# Run with coverage
npm run test -- tests/verification --coverage

# Run in watch mode
npm run test -- tests/verification --watch
```

### 3. Test Execution Modes

The framework supports different execution modes:

- **Quick**: Essential tests only (~5 minutes)
- **Full**: Comprehensive testing (~45 minutes)
- **Targeted**: Specific component testing
- **Continuous**: Lightweight monitoring

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VERIFICATION_API_BASE_URL` | API base URL | `http://localhost:3000` |
| `VERIFICATION_API_KEY` | API authentication key | Required |
| `VERIFICATION_WEBHOOK_SECRET` | HMAC webhook secret | Required |
| `VERIFICATION_TIMEOUT` | Request timeout (ms) | `30000` |
| `VERIFICATION_RETRIES` | Max retry attempts | `3` |
| `VERIFICATION_PARALLEL` | Enable parallel execution | `true` |
| `VERIFICATION_MAX_RESPONSE_TIME` | Max response time (ms) | `500` |
| `VERIFICATION_ENVIRONMENT` | Test environment | `development` |

### Test Scenarios

Pre-configured test scenarios are available:

- **Quick Verification**: Core functionality tests
- **Security Verification**: Authentication and security tests
- **Performance Verification**: Performance and caching tests
- **Schema Verification**: Database schema compatibility tests
- **Backward Compatibility**: Legacy client compatibility tests

## Test Categories

### 1. API Endpoints (`TestCategory.API_ENDPOINTS`)
- GET /api/topics functionality
- GET /api/topics/[slug] functionality
- POST /api/ingest functionality
- POST /api/revalidate functionality
- Response format validation
- Error handling verification

### 2. Schema Compatibility (`TestCategory.SCHEMA_COMPATIBILITY`)
- New field integration (SEO fields, thumbnails)
- Database query compatibility
- Index performance validation
- Constraint enforcement
- Migration verification

### 3. Authentication (`TestCategory.AUTHENTICATION`)
- HMAC signature validation
- Timestamp window enforcement
- Replay attack prevention
- Invalid signature handling
- Missing authentication handling

### 4. Performance (`TestCategory.PERFORMANCE`)
- Response time measurement
- Cache effectiveness testing
- Database query performance
- Memory usage monitoring
- Throughput testing

### 5. Data Integrity (`TestCategory.DATA_INTEGRITY`)
- Admin-to-API data consistency
- Cross-reference validation
- New field data integrity
- Real-time update verification

### 6. Security (`TestCategory.SECURITY`)
- Input validation testing
- SQL injection prevention
- XSS protection
- CSRF protection
- Vulnerability scanning

### 7. Backward Compatibility (`TestCategory.BACKWARD_COMPATIBILITY`)
- Existing parameter formats
- Response structure consistency
- Legacy authentication methods
- Breaking change detection

## Utilities

### HMAC Authentication
```typescript
import { HMACUtils } from './utils';

const headers = HMACUtils.createAuthHeaders(payload, secret);
```

### Test Result Building
```typescript
import { TestResultBuilder } from './utils';

const result = new TestResultBuilder('test-name', TestCategory.API_ENDPOINTS)
  .setVerificationLevel(VerificationLevel.CRITICAL)
  .setRequirements(['1.1', '1.2'])
  .build();
```

### HTTP Requests
```typescript
import { HTTPUtils } from './utils';

const response = await HTTPUtils.makeRequest('/api/topics', {
  method: 'GET',
  timeout: 5000
});
```

### Data Validation
```typescript
import { ValidationUtils } from './utils';

const { valid, errors } = ValidationUtils.validateSchema(data, schema);
```

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { getApiBaseUrl, createAuthHeaders } from '../setup';
import { HTTPUtils, TestResultBuilder } from '../utils';
import { TestCategory, VerificationLevel } from '../types';

describe('API Endpoint Tests', () => {
  it('should return topics list', async () => {
    const apiBaseUrl = getApiBaseUrl();
    const response = await HTTPUtils.makeRequest(`${apiBaseUrl}/api/topics`);
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('topics');
  });
});
```

### Test with Authentication

```typescript
it('should authenticate HMAC requests', async () => {
  const payload = JSON.stringify({ test: 'data' });
  const headers = createAuthHeaders(payload);
  
  const response = await HTTPUtils.makeRequest('/api/ingest', {
    method: 'POST',
    headers,
    body: payload
  });
  
  expect(response.status).toBe(200);
});
```

### Performance Testing

```typescript
import { PerformanceUtils } from '../utils';

it('should meet performance requirements', async () => {
  const { result, duration } = await PerformanceUtils.measureExecutionTime(
    () => HTTPUtils.makeRequest('/api/topics')
  );
  
  expect(duration).toBeLessThan(500); // 500ms threshold
  expect(result.status).toBe(200);
});
```

## Reporting

Test results are automatically generated in multiple formats:

- **JSON**: `test-results/verification-results.json`
- **Coverage**: `test-results/coverage/`
- **Console**: Verbose output during execution

### Custom Reporting

```typescript
import { VerificationReport } from '../types';

// Generate custom report
const report: VerificationReport = {
  timestamp: new Date(),
  environment: 'development',
  summary: {
    overallStatus: 'PASS',
    totalTests: 50,
    passedTests: 48,
    failedTests: 2
  }
  // ... additional report data
};
```

## Troubleshooting

### Common Issues

1. **API Not Accessible**
   - Verify `VERIFICATION_API_BASE_URL` is correct
   - Ensure API server is running
   - Check network connectivity

2. **Authentication Failures**
   - Verify `VERIFICATION_API_KEY` and `VERIFICATION_WEBHOOK_SECRET`
   - Check HMAC signature generation
   - Validate timestamp tolerance

3. **Test Timeouts**
   - Increase `VERIFICATION_TIMEOUT` value
   - Check API performance
   - Verify database connectivity

4. **Schema Validation Errors**
   - Ensure database migrations are applied
   - Verify test data includes new fields
   - Check API response format changes

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=verification:*
VERIFICATION_LOG_LEVEL=debug
```

## Contributing

When adding new tests:

1. Follow the existing directory structure
2. Use appropriate test categories and verification levels
3. Include proper error handling and cleanup
4. Add comprehensive documentation
5. Update this README if needed

## Performance Benchmarks

Expected performance thresholds:

- **API Response Time**: < 500ms (95th percentile)
- **Cache Hit Rate**: > 80%
- **Error Rate**: < 1%
- **Memory Usage**: < 512MB
- **Throughput**: > 100 requests/second

## Security Considerations

- Never commit real API keys or secrets
- Use test-specific credentials
- Implement proper cleanup after security tests
- Follow responsible disclosure for vulnerabilities
- Rotate test credentials regularly