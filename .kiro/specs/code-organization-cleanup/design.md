# Design Document

## Overview

This document outlines the design for reorganizing the project structure to improve maintainability, discoverability, and clarity. The current project has documentation, test results, and test scripts scattered across multiple locations, making it difficult to navigate and maintain. This design proposes a clear, hierarchical folder structure that follows industry best practices.

## Current State Analysis

### Current Structure Issues

1. **Root Directory Clutter**: Multiple markdown files in root (`TEST-CMS-NOW.md`, `HOMEPAGE_TEST_INSTRUCTIONS.md`, `DOCKER_CMS_TEST_GUIDE.md`, `CMS_SETUP.md`)
2. **Mixed Documentation**: Documentation exists in both `docs/` and root directory
3. **Test File Confusion**: Test scripts in `scripts/`, test results in `test-results/`, actual tests in `tests/`
4. **Unclear Purpose**: Hard to distinguish between setup guides, test instructions, and test results
5. **Redundancy**: Multiple files covering similar topics (Docker testing, CMS testing)

### Current File Inventory

**Root Directory Documentation:**
- `CMS_SETUP.md` - Setup documentation
- `DOCKER_CMS_TEST_GUIDE.md` - Docker testing guide
- `TEST-CMS-NOW.md` - Quick test instructions
- `HOMEPAGE_TEST_INSTRUCTIONS.md` - Homepage test guide

**docs/ Directory:**
- Accessibility documentation (3 files)
- Performance documentation (2 files)
- Caching strategy (1 file)
- E2E test summaries (2 files)
- Task completion summaries (2 files)

**test-results/ Directory:**
- Admin auth test reports (2 files)
- Docker test results (4 files)
- Homepage test report (1 file)
- Performance test JSON (1 file)

**scripts/ Directory:**
- Test scripts (6 files)
- Verification scripts (3 files)

**tests/ Directory:**
- Actual test code (organized well)

## Proposed Architecture

### New Folder Structure

```
/
├── docs/
│   ├── README.md                          # Documentation index
│   ├── setup/
│   │   ├── README.md                      # Setup guide index
│   │   ├── getting-started.md             # Quick start guide
│   │   ├── environment-setup.md           # Environment configuration
│   │   ├── database-setup.md              # Database setup
│   │   └── docker-setup.md                # Docker setup
│   ├── architecture/
│   │   ├── README.md                      # Architecture overview
│   │   ├── caching-strategy.md            # Caching implementation
│   │   ├── performance-optimization.md    # Performance details
│   │   └── accessibility.md               # Accessibility implementation
│   ├── testing/
│   │   ├── README.md                      # Testing guide index
│   │   ├── unit-testing.md                # Unit test guide
│   │   ├── e2e-testing.md                 # E2E test guide
│   │   ├── docker-testing.md              # Docker test guide
│   │   └── manual-testing.md              # Manual test procedures
│   └── reports/
│       ├── README.md                      # Reports index
│       ├── accessibility-audit.md         # Accessibility audit results
│       ├── performance-audit.md           # Performance test results
│       └── test-results/
│           ├── YYYY-MM-DD-test-name.md    # Timestamped test results
│           └── latest/                    # Symlinks to latest results
│
├── scripts/
│   ├── README.md                          # Scripts documentation
│   ├── test/
│   │   ├── test-cms-api-docker.js
│   │   ├── test-homepage.js
│   │   └── test-admin-auth.js
│   ├── verify/
│   │   ├── verify-admin-auth.js
│   │   ├── verify-caching-strategy.js
│   │   └── verify-code-splitting.js
│   └── performance/
│       ├── lighthouse-performance-test.js
│       └── simple-performance-test.js
│
├── tests/
│   ├── README.md                          # Test documentation
│   ├── unit/                              # Unit tests
│   │   ├── api/
│   │   └── lib/
│   ├── integration/                       # Integration tests
│   │   └── api/
│   ├── e2e/                               # E2E tests
│   │   ├── admin-dashboard.test.ts
│   │   └── public-pages.test.ts
│   └── utils/                             # Test utilities
│
├── test-requests/                         # API test examples (keep as-is)
│
└── README.md                              # Main project README
```

## Components and Interfaces

### 1. Documentation Organization

#### Setup Documentation (`docs/setup/`)

**Purpose**: Consolidate all setup-related documentation

**Files to Create/Move:**
- `getting-started.md` - Extract from main README.md
- `environment-setup.md` - Extract from main README.md
- `database-setup.md` - Extract from main README.md
- `docker-setup.md` - Consolidate from `DOCKER_CMS_TEST_GUIDE.md` and Docker sections

**Content Strategy:**
- Each file focuses on one aspect of setup
- Step-by-step instructions with examples
- Troubleshooting sections
- Cross-references to related docs

#### Architecture Documentation (`docs/architecture/`)

**Purpose**: Document system design and implementation details

**Files to Move/Organize:**
- `caching-strategy.md` - Move from `docs/CACHING_STRATEGY.md`
- `performance-optimization.md` - Consolidate from `docs/PERFORMANCE_OPTIMIZATION_SUMMARY.md`
- `accessibility.md` - Consolidate from `docs/ACCESSIBILITY_AUDIT_SUMMARY.md`, `docs/ACCESSIBILITY_IMPROVEMENTS.md`

**Content Strategy:**
- High-level architecture overview
- Design decisions and rationale
- Implementation details
- Diagrams and visual aids

#### Testing Documentation (`docs/testing/`)

**Purpose**: Centralize all testing guides and procedures

**Files to Create/Move:**
- `README.md` - Testing overview and quick start
- `unit-testing.md` - Extract from `tests/README.md`
- `e2e-testing.md` - Consolidate E2E testing info
- `docker-testing.md` - Move from `DOCKER_CMS_TEST_GUIDE.md`
- `manual-testing.md` - Consolidate from `TEST-CMS-NOW.md`, `HOMEPAGE_TEST_INSTRUCTIONS.md`

**Content Strategy:**
- Clear separation between automated and manual testing
- How to run tests
- How to write tests
- Troubleshooting guides

#### Reports Documentation (`docs/reports/`)

**Purpose**: Store audit results and test reports

**Files to Move:**
- Move all files from `test-results/` to `docs/reports/test-results/`
- Rename with timestamps: `YYYY-MM-DD-description.md`
- Keep latest results easily accessible

**Content Strategy:**
- Timestamped reports for historical tracking
- Latest results in dedicated folder
- Clear naming convention
- Archive old reports periodically

### 2. Script Organization

#### Test Scripts (`scripts/test/`)

**Purpose**: Scripts that run tests

**Files to Move:**
- `test-cms-api-docker.js`
- `test-homepage.js`
- `test-admin-auth.js`
- `test-cache-revalidation.js`

#### Verification Scripts (`scripts/verify/`)

**Purpose**: Scripts that verify configuration/setup

**Files to Move:**
- `verify-admin-auth.js`
- `verify-caching-strategy.js`
- `verify-code-splitting.js`

#### Performance Scripts (`scripts/performance/`)

**Purpose**: Scripts for performance testing

**Files to Move:**
- `lighthouse-performance-test.js`
- `simple-performance-test.js`

### 3. Test Code Organization

#### Restructure tests/ Directory

**Current Structure:**
```
tests/
├── api/          # Mixed unit and integration tests
├── e2e/          # E2E tests
├── lib/          # Unit tests
└── utils/        # Test utilities
```

**Proposed Structure:**
```
tests/
├── unit/         # Pure unit tests
│   ├── api/      # API logic unit tests
│   └── lib/      # Library unit tests
├── integration/  # Integration tests
│   └── api/      # API integration tests
├── e2e/          # End-to-end tests
└── utils/        # Test utilities
```

**Migration Strategy:**
- Move pure unit tests to `tests/unit/`
- Move integration tests to `tests/integration/`
- Keep E2E tests in `tests/e2e/`
- Update imports in all test files

## Data Models

### Documentation Index Structure

Each major documentation folder will have a `README.md` that serves as an index:

```markdown
# [Folder Name]

## Overview
Brief description of what this folder contains.

## Contents

### Quick Start
- [File 1](./file1.md) - Brief description
- [File 2](./file2.md) - Brief description

### Detailed Guides
- [File 3](./file3.md) - Brief description

## Related Documentation
- [Link to related folder](../other-folder/)
```

### File Naming Conventions

**Documentation Files:**
- Use kebab-case: `getting-started.md`, `docker-setup.md`
- Be descriptive: `environment-setup.md` not `env.md`
- Use consistent prefixes for related files

**Test Result Files:**
- Use timestamps: `2025-10-09-docker-test-results.md`
- Include test type: `2025-10-09-e2e-admin-dashboard.md`
- Keep descriptions concise

**Script Files:**
- Use verb-noun pattern: `test-homepage.js`, `verify-caching.js`
- Group by purpose in subfolders
- Keep names consistent with what they test

## Error Handling

### File Migration Errors

**Issue**: File moves break existing references

**Solution**:
1. Create a migration script that updates all references
2. Search for file references in:
   - All markdown files
   - All TypeScript/JavaScript files
   - package.json scripts
   - Docker configurations
3. Update references automatically
4. Verify with grep/search

### Backward Compatibility

**Issue**: External tools/CI may reference old paths

**Solution**:
1. Create symbolic links for critical files
2. Add deprecation notices in old locations
3. Update CI/CD configurations
4. Document migration in CHANGELOG

### Script Path Updates

**Issue**: npm scripts reference old paths

**Solution**:
1. Update all package.json scripts
2. Test each script after migration
3. Update documentation with new commands
4. Keep old commands as aliases temporarily

## Testing Strategy

### Migration Testing

1. **Pre-Migration Checklist**:
   - List all files to be moved
   - Identify all references to these files
   - Backup current state
   - Create migration script

2. **Migration Execution**:
   - Run migration script
   - Verify all files moved correctly
   - Check all references updated
   - Test all npm scripts

3. **Post-Migration Verification**:
   - Run all tests
   - Build project
   - Check Docker build
   - Verify documentation links
   - Test all scripts manually

### Verification Script

Create `scripts/verify-file-structure.js`:
- Checks all expected files exist
- Verifies no broken links in markdown
- Confirms npm scripts work
- Validates folder structure

## Implementation Plan

### Phase 1: Documentation Reorganization

1. Create new folder structure in `docs/`
2. Move and consolidate documentation files
3. Create README.md files for each folder
4. Update cross-references
5. Remove old files from root

### Phase 2: Script Organization

1. Create subfolders in `scripts/`
2. Move scripts to appropriate folders
3. Update package.json scripts
4. Test all scripts
5. Update documentation

### Phase 3: Test Code Restructuring

1. Create new test folder structure
2. Move test files to appropriate locations
3. Update imports in test files
4. Update test documentation
5. Run all tests to verify

### Phase 4: Cleanup and Verification

1. Remove `test-results/` folder (moved to docs)
2. Remove root documentation files
3. Update main README.md
4. Run verification script
5. Update CI/CD if needed

## Migration Script Design

### File Migration Script

```javascript
// scripts/migrate-file-structure.js

const fs = require('fs');
const path = require('path');

const migrations = [
  // Documentation migrations
  {
    from: 'CMS_SETUP.md',
    to: 'docs/setup/cms-setup.md',
    updateReferences: true
  },
  {
    from: 'DOCKER_CMS_TEST_GUIDE.md',
    to: 'docs/testing/docker-testing.md',
    updateReferences: true
  },
  // ... more migrations
];

function migrateFiles() {
  migrations.forEach(migration => {
    // Move file
    moveFile(migration.from, migration.to);
    
    // Update references if needed
    if (migration.updateReferences) {
      updateReferences(migration.from, migration.to);
    }
  });
}

function updateReferences(oldPath, newPath) {
  // Search all markdown files
  // Search all code files
  // Update references
  // Log changes
}
```

### Reference Update Strategy

1. **Markdown Files**: Update relative links
2. **Code Files**: Update import paths
3. **package.json**: Update script paths
4. **Docker Files**: Update COPY commands
5. **CI/CD**: Update workflow paths

## Benefits of New Structure

### Improved Discoverability

- Clear hierarchy makes finding documents easy
- Related documents grouped together
- Index files provide navigation
- Consistent naming conventions

### Better Maintainability

- Logical organization reduces confusion
- Clear separation of concerns
- Easy to add new documentation
- Reduced root directory clutter

### Enhanced Developer Experience

- Quick access to relevant information
- Clear distinction between setup, architecture, and testing
- Easy to onboard new developers
- Professional project structure

### Scalability

- Structure supports growth
- Easy to add new categories
- Can accommodate more documentation
- Supports versioning if needed

## Future Enhancements

1. **Documentation Website**: Generate static site from markdown
2. **Automated Link Checking**: CI job to verify no broken links
3. **Documentation Versioning**: Version docs with releases
4. **Search Functionality**: Add search to documentation
5. **Contribution Guidelines**: Add CONTRIBUTING.md with structure guidelines
