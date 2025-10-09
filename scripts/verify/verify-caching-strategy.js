/**
 * Script to verify caching strategy implementation
 * Requirements: 10.1, 10.2, 10.7
 * 
 * This script checks:
 * 1. ISR configuration in API client
 * 2. Cache tags are properly set
 * 3. Revalidation is called after updates
 * 4. Security is properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying caching strategy implementation...\n');

let allChecksPass = true;

// Check 1: Verify ISR configuration in topics API
console.log('✓ Check 1: ISR Configuration');
const topicsApiPath = path.join(process.cwd(), 'src/lib/api/topics.ts');
if (fs.existsSync(topicsApiPath)) {
  const content = fs.readFileSync(topicsApiPath, 'utf-8');
  
  // Check for cache tags
  if (content.includes("tags: ['topics']")) {
    console.log('  ✓ Topics list has cache tag');
  } else {
    console.log('  ✗ Topics list missing cache tag');
    allChecksPass = false;
  }
  
  if (content.includes("tags: ['topics', `topic:${slug}`]")) {
    console.log('  ✓ Individual topics have cache tags');
  } else {
    console.log('  ✗ Individual topics missing cache tags');
    allChecksPass = false;
  }
  
  // Check for revalidate setting
  if (content.includes('revalidate:')) {
    const revalidateMatch = content.match(/revalidate:\s*(\d+)/);
    if (revalidateMatch) {
      const seconds = parseInt(revalidateMatch[1]);
      console.log(`  ✓ ISR revalidation configured: ${seconds} seconds`);
      if (seconds < 60) {
        console.log('    ⚠️  Warning: Revalidation interval is very short (< 60s)');
      }
    }
  } else {
    console.log('  ✗ ISR revalidation not configured');
    allChecksPass = false;
  }
} else {
  console.log('  ✗ topics.ts not found');
  allChecksPass = false;
}

// Check 2: Verify revalidation API exists
console.log('\n✓ Check 2: Revalidation API');
const revalidateApiPath = path.join(process.cwd(), 'src/app/api/revalidate/route.ts');
if (fs.existsSync(revalidateApiPath)) {
  const content = fs.readFileSync(revalidateApiPath, 'utf-8');
  
  if (content.includes('revalidateTag')) {
    console.log('  ✓ Revalidation API uses revalidateTag');
  } else {
    console.log('  ✗ Revalidation API missing revalidateTag');
    allChecksPass = false;
  }
  
  if (content.includes('validateSecurity')) {
    console.log('  ✓ Revalidation API has security validation');
  } else {
    console.log('  ✗ Revalidation API missing security validation');
    allChecksPass = false;
  }
} else {
  console.log('  ✗ Revalidation API route not found');
  allChecksPass = false;
}

// Check 3: Verify revalidation client functions
console.log('\n✓ Check 3: Revalidation Client Functions');
const ingestApiPath = path.join(process.cwd(), 'src/lib/api/ingest.ts');
if (fs.existsSync(ingestApiPath)) {
  const content = fs.readFileSync(ingestApiPath, 'utf-8');
  
  if (content.includes('revalidateCache')) {
    console.log('  ✓ revalidateCache function exists');
  } else {
    console.log('  ✗ revalidateCache function missing');
    allChecksPass = false;
  }
  
  if (content.includes('revalidateTopicCache')) {
    console.log('  ✓ revalidateTopicCache function exists');
  } else {
    console.log('  ✗ revalidateTopicCache function missing');
    allChecksPass = false;
  }
  
  if (content.includes('generateClientSignature')) {
    console.log('  ✓ HMAC signature generation implemented');
  } else {
    console.log('  ✗ HMAC signature generation missing');
    allChecksPass = false;
  }
} else {
  console.log('  ✗ ingest.ts not found');
  allChecksPass = false;
}

// Check 4: Verify admin pages call revalidation
console.log('\n✓ Check 4: Admin Pages Call Revalidation');
const adminPages = [
  'src/app/admin/topics/new/page.tsx',
  'src/app/admin/topics/[slug]/edit/page.tsx',
];

adminPages.forEach((pagePath) => {
  const fullPath = path.join(process.cwd(), pagePath);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    if (content.includes('revalidateTopicCache')) {
      console.log(`  ✓ ${pagePath} calls revalidateTopicCache`);
    } else {
      console.log(`  ✗ ${pagePath} missing revalidateTopicCache call`);
      allChecksPass = false;
    }
  } else {
    console.log(`  ✗ ${pagePath} not found`);
    allChecksPass = false;
  }
});

// Check 5: Verify environment variables documentation
console.log('\n✓ Check 5: Environment Variables');
const envExamplePath = path.join(process.cwd(), '.env.example');
if (fs.existsSync(envExamplePath)) {
  const content = fs.readFileSync(envExamplePath, 'utf-8');
  
  if (content.includes('NEXT_PUBLIC_INGEST_API_KEY')) {
    console.log('  ✓ NEXT_PUBLIC_INGEST_API_KEY documented');
  } else {
    console.log('  ⚠️  NEXT_PUBLIC_INGEST_API_KEY not in .env.example');
  }
  
  if (content.includes('NEXT_PUBLIC_INGEST_WEBHOOK_SECRET')) {
    console.log('  ✓ NEXT_PUBLIC_INGEST_WEBHOOK_SECRET documented');
  } else {
    console.log('  ⚠️  NEXT_PUBLIC_INGEST_WEBHOOK_SECRET not in .env.example');
  }
} else {
  console.log('  ⚠️  .env.example not found');
}

// Check 6: Verify caching documentation
console.log('\n✓ Check 6: Documentation');
const cachingDocsPath = path.join(process.cwd(), 'docs/CACHING_STRATEGY.md');
if (fs.existsSync(cachingDocsPath)) {
  console.log('  ✓ Caching strategy documentation exists');
  const content = fs.readFileSync(cachingDocsPath, 'utf-8');
  
  if (content.includes('ISR')) {
    console.log('  ✓ ISR documented');
  }
  if (content.includes('Cache Tags')) {
    console.log('  ✓ Cache tags documented');
  }
  if (content.includes('On-Demand Revalidation')) {
    console.log('  ✓ On-demand revalidation documented');
  }
} else {
  console.log('  ✗ Caching strategy documentation missing');
  allChecksPass = false;
}

// Summary
console.log('\n' + '='.repeat(60));
if (allChecksPass) {
  console.log('✅ All caching strategy checks passed!\n');
  console.log('Summary:');
  console.log('- ISR configured with cache tags');
  console.log('- Revalidation API secured with HMAC');
  console.log('- Admin pages trigger cache revalidation');
  console.log('- Documentation is complete');
  console.log('\nNext steps:');
  console.log('1. Test cache behavior: npm run build && npm start');
  console.log('2. Monitor cache hit rates in production');
  console.log('3. Run Lighthouse audit for performance metrics');
} else {
  console.log('❌ Some caching strategy checks failed\n');
  console.log('Please review the errors above and fix the issues.');
  process.exit(1);
}
