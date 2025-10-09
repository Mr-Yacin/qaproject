# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed - Project Structure Reorganization (2025-10-09)

The project has undergone a comprehensive reorganization to improve maintainability and discoverability. All documentation, scripts, and tests have been reorganized into a clear, hierarchical structure.

#### Documentation Migration

**New Structure:**
- All documentation now lives in `docs/` with clear categorization
- `docs/setup/` - Setup and installation guides
- `docs/architecture/` - System design and architecture documentation
- `docs/testing/` - Testing guides and procedures
- `docs/reports/` - Test reports and audit results

**Files Moved:**
- Root documentation files (`CMS_SETUP.md`, `DOCKER_CMS_TEST_GUIDE.md`, `TEST-CMS-NOW.md`, `HOMEPAGE_TEST_INSTRUCTIONS.md`) have been consolidated and moved to appropriate `docs/` subdirectories
- Test results from `test-results/` moved to `docs/reports/test-results/`
- Architecture docs consolidated and organized in `docs/architecture/`

**What This Means:**
- If you had bookmarks to old documentation files, update them to the new locations
- All documentation is now indexed with README files in each subdirectory
- Cross-references between documents have been updated

#### Scripts Reorganization

**New Structure:**
- `scripts/test/` - Scripts that run tests
- `scripts/verify/` - Scripts that verify configuration/setup
- `scripts/performance/` - Performance testing scripts

**Files Moved:**
- Test scripts: `test-cms-api-docker.js`, `test-homepage.js`, `test-admin-auth.js`, `test-cache-revalidation.js` → `scripts/test/`
- Verification scripts: `verify-admin-auth.js`, `verify-caching-strategy.js`, `verify-code-splitting.js` → `scripts/verify/`
- Performance scripts: `lighthouse-performance-test.js`, `simple-performance-test.js` → `scripts/performance/`

**What This Means:**
- All npm scripts in `package.json` have been updated to reflect new paths
- If you run scripts directly, use the new paths
- Script functionality remains unchanged

#### Test Code Restructuring

**New Structure:**
- `tests/unit/` - Pure unit tests
  - `tests/unit/api/` - API logic unit tests
  - `tests/unit/lib/` - Library unit tests
- `tests/integration/` - Integration tests
  - `tests/integration/api/` - API integration tests
- `tests/e2e/` - End-to-end tests (unchanged)
- `tests/utils/` - Test utilities (unchanged)

**Files Moved:**
- Unit tests separated from integration tests
- Test imports updated to reflect new structure
- All tests continue to pass with no functional changes

**What This Means:**
- Test organization now clearly distinguishes between unit, integration, and e2e tests
- When writing new tests, place them in the appropriate subdirectory
- Test execution commands remain the same (`npm test`)

#### Breaking Changes

**None** - This is a non-breaking reorganization. All functionality remains the same:
- API endpoints unchanged
- npm scripts updated but work the same way
- All tests pass
- Docker configuration updated
- CI/CD configurations updated (if applicable)

#### Migration Guide

If you have local changes or custom scripts:

1. **Update Documentation Links:**
   - Old: `docs/CACHING_STRATEGY.md` → New: `docs/architecture/caching-strategy.md`
   - Old: `DOCKER_CMS_TEST_GUIDE.md` → New: `docs/testing/docker-testing.md`
   - See [docs/README.md](docs/README.md) for complete mapping

2. **Update Script Paths:**
   - Old: `scripts/test-homepage.js` → New: `scripts/test/test-homepage.js`
   - Old: `scripts/verify-admin-auth.js` → New: `scripts/verify/verify-admin-auth.js`
   - See [scripts/README.md](scripts/README.md) for complete listing

3. **Update Test Imports:**
   - If you have custom tests, update imports to reflect new test structure
   - Example: `tests/api/topics.test.ts` → `tests/unit/api/topics.test.ts` or `tests/integration/api/topics.test.ts`

4. **Update Bookmarks/References:**
   - Check any external documentation or wikis that reference old file paths
   - Update CI/CD configurations if they reference specific file paths
   - Update IDE configurations if they have hardcoded paths

#### Benefits

- **Improved Discoverability:** Clear hierarchy makes finding documents easy
- **Better Maintainability:** Logical organization reduces confusion
- **Enhanced Developer Experience:** Quick access to relevant information
- **Professional Structure:** Follows industry best practices
- **Scalability:** Structure supports future growth

For detailed information about the new structure, see:
- [README.md](README.md) - Updated project structure overview
- [CONTRIBUTING.md](CONTRIBUTING.md) - Folder structure conventions and guidelines
- [docs/README.md](docs/README.md) - Documentation index

---

## [Previous Versions]

_Add previous version history here as the project evolves_
