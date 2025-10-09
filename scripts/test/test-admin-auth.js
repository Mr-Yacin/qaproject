/**
 * Admin Authentication Flow Test
 * 
 * Tests the following requirements:
 * - 3.1: Unauthenticated users redirected to login
 * - 3.2: Successful login redirects to admin dashboard
 * - 3.3: Authenticated users can access admin pages
 * - 4.1: Admin dashboard fetches topics data
 * - 4.2: Dashboard displays accurate statistics
 * - 4.3: Admin API calls work correctly
 */

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(testName) {
  log(`\n📋 Testing: ${testName}`, colors.cyan);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function recordTest(name, passed, message) {
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
    logSuccess(message);
  } else {
    results.failed++;
    logError(message);
  }
}

async function testUnauthenticatedRedirect() {
  logTest('Requirement 3.1: Unauthenticated access to /admin redirects to login');
  
  try {
    const response = await fetch(`${baseUrl}/admin`, {
      redirect: 'manual',
    });

    // Next.js middleware returns 307 for redirects
    if (response.status === 307 || response.status === 302) {
      const location = response.headers.get('location');
      if (location && location.includes('/admin/login')) {
        recordTest(
          'Unauthenticated Redirect',
          true,
          `Correctly redirected to login page (${response.status} -> ${location})`
        );
        return true;
      } else {
        recordTest(
          'Unauthenticated Redirect',
          false,
          `Redirected but not to login page: ${location}`
        );
        return false;
      }
    } else {
      recordTest(
        'Unauthenticated Redirect',
        false,
        `Expected redirect (307/302), got ${response.status}`
      );
      return false;
    }
  } catch (error) {
    recordTest(
      'Unauthenticated Redirect',
      false,
      `Error testing redirect: ${error.message}`
    );
    return false;
  }
}

async function testLoginWithValidCredentials() {
  logTest('Requirement 3.2: Login with valid credentials');
  
  try {
    // First, get the CSRF token
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;

    logInfo(`Retrieved CSRF token: ${csrfToken.substring(0, 20)}...`);

    // Attempt login with credentials from .env
    const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'admin@example.com',
        password: 'admin123',
        csrfToken: csrfToken,
        callbackUrl: `${baseUrl}/admin`,
        json: 'true',
      }),
      redirect: 'manual',
    });

    const setCookieHeader = loginResponse.headers.get('set-cookie');
    
    if (loginResponse.status === 200 || loginResponse.status === 302 || loginResponse.status === 307) {
      if (setCookieHeader && setCookieHeader.includes('next-auth.session-token')) {
        recordTest(
          'Valid Login',
          true,
          'Successfully authenticated with valid credentials'
        );
        
        // Extract session token for subsequent tests
        const sessionTokenMatch = setCookieHeader.match(/next-auth\.session-token=([^;]+)/);
        return sessionTokenMatch ? sessionTokenMatch[1] : null;
      } else {
        recordTest(
          'Valid Login',
          false,
          'Login response OK but no session token in cookies'
        );
        return null;
      }
    } else {
      let responseText = '';
      try {
        responseText = await loginResponse.text();
      } catch (e) {
        responseText = 'Unable to read response';
      }
      recordTest(
        'Valid Login',
        false,
        `Login failed with status ${loginResponse.status}: ${responseText ? responseText.substring(0, 100) : 'No response body'}`
      );
      return null;
    }
  } catch (error) {
    recordTest(
      'Valid Login',
      false,
      `Error during login: ${error.message}`
    );
    return null;
  }
}

async function testAuthenticatedAccess(sessionToken) {
  logTest('Requirement 3.3: Authenticated users can access admin pages');
  
  if (!sessionToken) {
    recordTest(
      'Authenticated Access',
      false,
      'No session token available from login'
    );
    return false;
  }

  try {
    const response = await fetch(`${baseUrl}/admin`, {
      headers: {
        Cookie: `next-auth.session-token=${sessionToken}`,
      },
      redirect: 'manual',
    });

    if (response.status === 200) {
      const html = await response.text();
      if (html.includes('Dashboard') || html.includes('Admin')) {
        recordTest(
          'Authenticated Access',
          true,
          'Successfully accessed admin dashboard with valid session'
        );
        return true;
      } else {
        recordTest(
          'Authenticated Access',
          false,
          'Accessed page but content doesn\'t appear to be admin dashboard'
        );
        return false;
      }
    } else if (response.status === 307 || response.status === 302) {
      recordTest(
        'Authenticated Access',
        false,
        `Still redirected despite valid session (${response.status})`
      );
      return false;
    } else {
      recordTest(
        'Authenticated Access',
        false,
        `Unexpected status code: ${response.status}`
      );
      return false;
    }
  } catch (error) {
    recordTest(
      'Authenticated Access',
      false,
      `Error accessing admin page: ${error.message}`
    );
    return false;
  }
}

async function testDashboardDataLoading(sessionToken) {
  logTest('Requirements 4.1, 4.2, 4.3: Dashboard loads statistics correctly');
  
  if (!sessionToken) {
    recordTest(
      'Dashboard Data Loading',
      false,
      'No session token available'
    );
    return false;
  }

  try {
    // Test that the API endpoint works
    const apiResponse = await fetch(`${baseUrl}/api/topics?limit=1000`, {
      headers: {
        Cookie: `next-auth.session-token=${sessionToken}`,
      },
    });

    if (apiResponse.ok) {
      const data = await apiResponse.json();
      
      if (data.topics && Array.isArray(data.topics)) {
        const totalTopics = data.topics.length;
        const publishedTopics = data.topics.filter(t => t.status === 'published').length;
        const draftTopics = data.topics.filter(t => t.status === 'draft').length;
        
        logInfo(`Found ${totalTopics} total topics (${publishedTopics} published, ${draftTopics} drafts)`);
        
        recordTest(
          'Dashboard Data Loading',
          true,
          'API successfully returned topics data with correct structure'
        );
        
        // Now test that the dashboard page loads without errors
        const dashboardResponse = await fetch(`${baseUrl}/admin`, {
          headers: {
            Cookie: `next-auth.session-token=${sessionToken}`,
          },
        });
        
        if (dashboardResponse.ok) {
          const html = await dashboardResponse.text();
          
          // Check for error messages in the HTML
          if (html.includes('Failed to load dashboard statistics')) {
            recordTest(
              'Dashboard Rendering',
              false,
              'Dashboard shows error message about failed statistics'
            );
            return false;
          } else {
            recordTest(
              'Dashboard Rendering',
              true,
              'Dashboard page loaded without error messages'
            );
            return true;
          }
        } else {
          recordTest(
            'Dashboard Rendering',
            false,
            `Dashboard page returned status ${dashboardResponse.status}`
          );
          return false;
        }
      } else {
        recordTest(
          'Dashboard Data Loading',
          false,
          'API response missing topics array'
        );
        return false;
      }
    } else {
      recordTest(
        'Dashboard Data Loading',
        false,
        `API request failed with status ${apiResponse.status}`
      );
      return false;
    }
  } catch (error) {
    recordTest(
      'Dashboard Data Loading',
      false,
      `Error loading dashboard data: ${error.message}`
    );
    return false;
  }
}

async function testInvalidCredentials() {
  logTest('Additional Test: Login with invalid credentials should fail');
  
  try {
    const csrfResponse = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;

    const loginResponse = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: 'wrong@example.com',
        password: 'wrongpassword',
        csrfToken: csrfToken,
        callbackUrl: `${baseUrl}/admin`,
        json: 'true',
      }),
      redirect: 'manual',
    });

    const setCookieHeader = loginResponse.headers.get('set-cookie');
    
    if (!setCookieHeader || !setCookieHeader.includes('next-auth.session-token')) {
      recordTest(
        'Invalid Credentials',
        true,
        'Correctly rejected invalid credentials'
      );
      return true;
    } else {
      recordTest(
        'Invalid Credentials',
        false,
        'Invalid credentials were accepted (security issue!)'
      );
      return false;
    }
  } catch (error) {
    recordTest(
      'Invalid Credentials',
      false,
      `Error testing invalid credentials: ${error.message}`
    );
    return false;
  }
}

function printSummary() {
  log('\n' + '='.repeat(60), colors.cyan);
  log('TEST SUMMARY', colors.cyan);
  log('='.repeat(60), colors.cyan);
  
  log(`\nTotal Tests: ${results.tests.length}`);
  log(`Passed: ${results.passed}`, colors.green);
  log(`Failed: ${results.failed}`, results.failed > 0 ? colors.red : colors.green);
  
  if (results.failed > 0) {
    log('\n❌ FAILED TESTS:', colors.red);
    results.tests
      .filter(t => !t.passed)
      .forEach(t => {
        log(`  • ${t.name}: ${t.message}`, colors.red);
      });
  }
  
  log('\n' + '='.repeat(60), colors.cyan);
  
  if (results.failed === 0) {
    log('✅ ALL TESTS PASSED!', colors.green);
    log('Admin authentication flow is working correctly.', colors.green);
  } else {
    log('❌ SOME TESTS FAILED', colors.red);
    log('Please review the failures above.', colors.red);
  }
  
  log('='.repeat(60) + '\n', colors.cyan);
}

async function checkServerAvailability() {
  logTest('Checking if development server is running');
  
  try {
    const response = await fetch(`${baseUrl}/api/auth/csrf`, {
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      logSuccess('Development server is running and accessible');
      return true;
    } else {
      logError(`Server responded with status ${response.status}`);
      return false;
    }
  } catch (error) {
    logError(`Cannot connect to server at ${baseUrl}`);
    logError('Please ensure the development server is running with: npm run dev');
    return false;
  }
}

async function runAllTests() {
  log('='.repeat(60), colors.cyan);
  log('ADMIN AUTHENTICATION FLOW TEST', colors.cyan);
  log('='.repeat(60), colors.cyan);
  log(`Testing against: ${baseUrl}`, colors.blue);
  log('');

  // Check server availability first
  const serverAvailable = await checkServerAvailability();
  if (!serverAvailable) {
    log('\n⚠️  Cannot proceed with tests - server is not accessible', colors.yellow);
    log('Please start the development server with: npm run dev', colors.yellow);
    process.exit(1);
  }

  // Test 1: Unauthenticated redirect
  await testUnauthenticatedRedirect();

  // Test 2: Invalid credentials
  await testInvalidCredentials();

  // Test 3: Valid login
  const sessionToken = await testLoginWithValidCredentials();

  // Test 4: Authenticated access
  if (sessionToken) {
    await testAuthenticatedAccess(sessionToken);
    
    // Test 5: Dashboard data loading
    await testDashboardDataLoading(sessionToken);
  } else {
    logError('Skipping authenticated tests due to login failure');
  }

  // Print summary
  printSummary();

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
