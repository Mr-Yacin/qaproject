#!/usr/bin/env node

/**
 * Security Testing Script for Q&A Article FAQ API
 * 
 * Tests HMAC authentication, authorization, and security controls
 */

const crypto = require('crypto');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const API_KEY = process.env.INGEST_API_KEY || 'z7BOCDD0MovaOEntHbWPXUGM5YVMJkOezKkMm2n3Qik=';
const WEBHOOK_SECRET = process.env.INGEST_WEBHOOK_SECRET || '1G2+YYSw2euAnJbrqCqzSRD0H5Pc5Kz9ecNcD2z7mt0=';

function generateSignature(timestamp, body) {
    const message = `${timestamp}.${body}`;
    return crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(message)
        .digest('hex');
}

async function testRequest(name, url, options, expectedStatus) {
    console.log(`\n🧪 ${name}`);
    console.log(`   Expected: ${expectedStatus}`);

    try {
        const response = await fetch(url, options);
        const status = response.status;
        const passed = status === expectedStatus;

        console.log(`   Result: ${status} ${passed ? '✅ PASS' : '❌ FAIL'}`);

        if (!passed) {
            const body = await response.text();
            console.log(`   Response: ${body.substring(0, 100)}`);
        }

        return passed;
    } catch (error) {
        console.log(`   Result: ERROR ❌ FAIL`);
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

async function runSecurityTests() {
    console.log('🔒 API Security Test Suite\n');
    console.log('='.repeat(60));

    const results = [];
    const payload = { tag: "topics" };
    const body = JSON.stringify(payload);
    const timestamp = Date.now().toString();
    const validSignature = generateSignature(timestamp, body);

    // Test 1: Missing API Key
    results.push(await testRequest(
        'Test 1: Request without API key',
        `${API_URL}/api/ingest`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-timestamp': timestamp,
                'x-signature': validSignature,
            },
            body: body,
        },
        401
    ));

    // Test 2: Invalid API Key
    results.push(await testRequest(
        'Test 2: Request with invalid API key',
        `${API_URL}/api/ingest`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': 'invalid-key-12345',
                'x-timestamp': timestamp,
                'x-signature': validSignature,
            },
            body: body,
        },
        401
    ));

    // Test 3: Missing Timestamp
    results.push(await testRequest(
        'Test 3: Request without timestamp',
        `${API_URL}/api/ingest`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'x-signature': validSignature,
            },
            body: body,
        },
        401
    ));

    // Test 4: Missing Signature
    results.push(await testRequest(
        'Test 4: Request without signature',
        `${API_URL}/api/ingest`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'x-timestamp': timestamp,
            },
            body: body,
        },
        401
    ));

    // Test 5: Invalid Signature
    results.push(await testRequest(
        'Test 5: Request with invalid signature',
        `${API_URL}/api/ingest`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'x-timestamp': timestamp,
                'x-signature': 'invalid-signature-abc123',
            },
            body: body,
        },
        401
    ));

    // Test 6: Expired Timestamp (6 minutes old)
    const oldTimestamp = (Date.now() - 6 * 60 * 1000).toString();
    const oldSignature = generateSignature(oldTimestamp, body);
    results.push(await testRequest(
        'Test 6: Request with expired timestamp (>5 min)',
        `${API_URL}/api/ingest`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'x-timestamp': oldTimestamp,
                'x-signature': oldSignature,
            },
            body: body,
        },
        401
    ));

    // Test 7: Future Timestamp (6 minutes ahead)
    const futureTimestamp = (Date.now() + 6 * 60 * 1000).toString();
    const futureSignature = generateSignature(futureTimestamp, body);
    results.push(await testRequest(
        'Test 7: Request with future timestamp (>5 min)',
        `${API_URL}/api/ingest`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'x-timestamp': futureTimestamp,
                'x-signature': futureSignature,
            },
            body: body,
        },
        401
    ));

    // Test 8: Body Tampering (signature doesn't match body)
    const tamperedBody = JSON.stringify({ tag: "tampered" });
    results.push(await testRequest(
        'Test 8: Request with tampered body',
        `${API_URL}/api/ingest`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'x-timestamp': timestamp,
                'x-signature': validSignature, // signature for original body
            },
            body: tamperedBody, // but sending different body
        },
        401
    ));

    // Test 9: Valid Authentication (should succeed)
    const validTimestamp = Date.now().toString();
    const validBody = JSON.stringify({ tag: "topics" });
    const validSig = generateSignature(validTimestamp, validBody);
    results.push(await testRequest(
        'Test 9: Valid authenticated request',
        `${API_URL}/api/revalidate`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
                'x-timestamp': validTimestamp,
                'x-signature': validSig,
            },
            body: validBody,
        },
        200
    ));

    // Test 10: Public endpoint (no auth required)
    results.push(await testRequest(
        'Test 10: Public endpoint without authentication',
        `${API_URL}/api/topics`,
        {
            method: 'GET',
        },
        200
    ));

    // Test 11: SQL Injection attempt in query params
    results.push(await testRequest(
        'Test 11: SQL injection in query parameters',
        `${API_URL}/api/topics?locale=en' OR '1'='1`,
        {
            method: 'GET',
        },
        400 // Should reject invalid input with validation error
    ));

    // Test 12: XSS attempt in slug
    results.push(await testRequest(
        'Test 12: XSS attempt in URL parameter',
        `${API_URL}/api/topics/<script>alert('xss')</script>`,
        {
            method: 'GET',
        },
        404 // Should not find topic, not execute script
    ));

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary\n');

    const passed = results.filter(r => r).length;
    const failed = results.filter(r => !r).length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    if (failed === 0) {
        console.log('\n🎉 All security tests passed!');
    } else {
        console.log('\n⚠️  Some security tests failed. Review the results above.');
        process.exit(1);
    }
}

// Run tests
runSecurityTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
});
