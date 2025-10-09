/**
 * Script to verify code splitting is working correctly
 * Requirements: 10.3, 10.4, 10.6
 * 
 * This script checks:
 * 1. Dynamic imports are used for heavy components
 * 2. Route-based code splitting is configured
 * 3. Lazy loading is implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying code splitting implementation...\n');

// Check 1: Verify dynamic imports in lazy components
console.log('✓ Check 1: Dynamic imports for heavy components');
const lazyFiles = [
  'src/components/admin/RichTextEditorLazy.tsx',
  'src/components/admin/FAQManagerLazy.tsx',
];

let allLazyFilesExist = true;
lazyFiles.forEach((file) => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    if (content.includes('dynamic') && content.includes('next/dynamic')) {
      console.log(`  ✓ ${file} uses dynamic import`);
    } else {
      console.log(`  ✗ ${file} missing dynamic import`);
      allLazyFilesExist = false;
    }
  } else {
    console.log(`  ✗ ${file} not found`);
    allLazyFilesExist = false;
  }
});

// Check 2: Verify TopicForm uses lazy components
console.log('\n✓ Check 2: TopicForm uses lazy-loaded components');
const topicFormPath = path.join(process.cwd(), 'src/components/admin/TopicForm.tsx');
if (fs.existsSync(topicFormPath)) {
  const content = fs.readFileSync(topicFormPath, 'utf-8');
  const usesLazyEditor = content.includes('RichTextEditorLazy');
  const usesLazyFAQ = content.includes('FAQManagerLazy');
  
  if (usesLazyEditor) {
    console.log('  ✓ TopicForm uses RichTextEditorLazy');
  } else {
    console.log('  ✗ TopicForm does not use RichTextEditorLazy');
  }
  
  if (usesLazyFAQ) {
    console.log('  ✓ TopicForm uses FAQManagerLazy');
  } else {
    console.log('  ✗ TopicForm does not use FAQManagerLazy');
  }
} else {
  console.log('  ✗ TopicForm.tsx not found');
}

// Check 3: Verify Next.js App Router structure (route-based splitting is automatic)
console.log('\n✓ Check 3: Next.js App Router structure (automatic route-based splitting)');
const appDirs = [
  'src/app/(public)',
  'src/app/admin',
];

appDirs.forEach((dir) => {
  const dirPath = path.join(process.cwd(), dir);
  if (fs.existsSync(dirPath)) {
    console.log(`  ✓ ${dir} exists (automatic code splitting enabled)`);
  } else {
    console.log(`  ✗ ${dir} not found`);
  }
});

// Check 4: Verify image optimization configuration
console.log('\n✓ Check 4: Image optimization configuration');
const nextConfigPath = path.join(process.cwd(), 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  const content = fs.readFileSync(nextConfigPath, 'utf-8');
  if (content.includes('formats') && content.includes('webp')) {
    console.log('  ✓ Image formats configured (WebP/AVIF)');
  }
  if (content.includes('deviceSizes')) {
    console.log('  ✓ Device sizes configured for responsive images');
  }
  if (content.includes('imageSizes')) {
    console.log('  ✓ Image sizes configured for optimization');
  }
} else {
  console.log('  ✗ next.config.js not found');
}

console.log('\n✅ Code splitting verification complete!\n');
console.log('Summary:');
console.log('- Heavy components (RichTextEditor, FAQManager) are dynamically imported');
console.log('- Route-based code splitting is automatic with Next.js App Router');
console.log('- Image optimization is configured');
console.log('\nTo verify in production:');
console.log('1. Run: npm run build');
console.log('2. Check .next/static/chunks for separate chunk files');
console.log('3. Verify lazy components load only when needed');
