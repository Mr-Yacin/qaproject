# API Testing Resources

This directory contains example payloads, testing scripts, and API client collections for testing the Q&A Article FAQ API.

## Contents

- `ingest-example.json` - Sample payload for POST /api/ingest
- `revalidate-example.json` - Sample payload for POST /api/revalidate
- `test-api.js` - Node.js script for testing all endpoints with HMAC authentication
- `postman-collection.json` - Postman/Thunder Client collection with all endpoints
- `postman-environment.json` - Environment variables template for Postman

## Quick Start

### Using the Node.js Test Script

The easiest way to test the API:

1. Set environment variables:
```bash
export API_URL="http://localhost:3000"
export INGEST_API_KEY="your-api-key"
export INGEST_WEBHOOK_SECRET="your-webhook-secret"
```

2. Run tests:
```bash
# Test ingestion
node test-api.js ingest

# Test revalidation
node test-api.js revalidate

# Get a topic
node test-api.js get-topic how-to-reset-password

# List topics
node test-api.js list-topics --locale=en --tag=security
```

### Using Postman or Thunder Client

1. **Import the collection**:
   - Open Postman or Thunder Client
   - Import `postman-collection.json`

2. **Import the environment**:
   - Import `postman-environment.json`
   - Update the environment variables:
     - `INGEST_API_KEY`: Your API key from .env
     - `INGEST_WEBHOOK_SECRET`: Your webhook secret from .env
     - `baseUrl`: API base URL (default: http://localhost:3000)

3. **Run requests**:
   - Select the imported environment
   - The collection includes pre-request scripts that automatically generate HMAC signatures
   - All endpoints are ready to use

## Example Payloads

### Ingest Payload

The `ingest-example.json` file contains a complete example with:
- Topic metadata (slug, title, locale, tags)
- Main question
- Article content (markdown supported)
- FAQ items with ordering

You can modify this file or create your own payloads following the same structure.

### Revalidate Payload

The `revalidate-example.json` file shows how to trigger cache revalidation:
```json
{
  "tag": "topics"
}
```

Common tags:
- `topics` - Revalidate all topics
- `topic:slug-name` - Revalidate specific topic

## Testing Script Usage

### Commands

```bash
# Ingest content
node test-api.js ingest [file]

# Revalidate cache
node test-api.js revalidate [file]

# Get topic by slug
node test-api.js get-topic <slug>

# List topics with filters
node test-api.js list-topics [--locale=xx] [--tag=name] [--page=n] [--limit=n]
```

### Examples

```bash
# Test with default example files
node test-api.js ingest
node test-api.js revalidate

# Test with custom payload
node test-api.js ingest my-custom-topic.json

# Retrieve specific topic
node test-api.js get-topic how-to-reset-password

# List topics with various filters
node test-api.js list-topics
node test-api.js list-topics --locale=en
node test-api.js list-topics --tag=authentication
node test-api.js list-topics --locale=en --tag=security --page=1 --limit=10
```

## HMAC Signature Generation

The test script and Postman collection automatically generate HMAC signatures. If you need to generate them manually:

### Algorithm

1. Get current timestamp in milliseconds
2. Stringify request body
3. Create message: `timestamp + "." + body`
4. Compute HMAC-SHA256 with your webhook secret
5. Convert to hexadecimal string

### Node.js Example

```javascript
const crypto = require('crypto');

function generateSignature(timestamp, body, secret) {
  const message = `${timestamp}.${JSON.stringify(body)}`;
  return crypto
    .createHmac('sha256', secret)
    .update(message)
    .digest('hex');
}

const timestamp = Date.now().toString();
const body = { tag: "topics" };
const signature = generateSignature(timestamp, body, process.env.INGEST_WEBHOOK_SECRET);
```

### Bash Example

```bash
TIMESTAMP=$(date +%s000)
BODY='{"tag":"topics"}'
PAYLOAD="${TIMESTAMP}.${BODY}"
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')
```

## Postman Collection Features

The Postman collection includes:

- **Pre-request scripts**: Automatically generate timestamps and HMAC signatures
- **Test scripts**: Validate response status and structure
- **Environment variables**: Centralized configuration
- **Request examples**: All API endpoints with proper headers and bodies

### Pre-request Script

Each authenticated request runs this script:

```javascript
// Generate timestamp
const timestamp = Date.now().toString();
pm.environment.set('timestamp', timestamp);

// Get request body
const body = pm.request.body.raw || '';

// Generate HMAC signature
const secret = pm.environment.get('INGEST_WEBHOOK_SECRET');
const message = timestamp + '.' + body;
const signature = CryptoJS.HmacSHA256(message, secret).toString(CryptoJS.enc.Hex);

pm.environment.set('signature', signature);
```

### Test Scripts

Each request includes basic tests:

```javascript
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

pm.test('Response has expected fields', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});
```

## Troubleshooting

### Authentication Errors (401)

- Verify `INGEST_API_KEY` matches your .env file
- Check that `INGEST_WEBHOOK_SECRET` is correct
- Ensure your system clock is accurate (timestamp must be within ±5 minutes)

### Signature Mismatch

- Make sure the request body is exactly the same as what was used to generate the signature
- Check for extra whitespace or formatting differences
- Verify you're using the raw body string, not a parsed object

### Connection Refused

- Ensure the API server is running: `npm run dev`
- Check the `API_URL` or `baseUrl` is correct
- Verify the port (default: 3000)

### Validation Errors (400)

- Check the payload structure matches the schema
- Verify required fields are present
- Ensure enum values are correct (e.g., status: "PUBLISHED" not "published")

## Additional Resources

- See main README.md for complete API documentation
- Check .env.example for required environment variables
- Review tests/ directory for more examples
