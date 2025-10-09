# Requirements Document

## Introduction

This spec addresses critical issues in the CMS build that prevent the application from functioning correctly. The homepage is displaying incorrect content, admin authentication is not properly enforced, and API calls are failing during server-side rendering. These fixes are essential for the CMS to work as intended.

## Requirements

### Requirement 1: Fix Homepage Display

**User Story:** As a visitor, I want to see the proper homepage with featured topics and search functionality, so that I can browse and find content easily.

#### Acceptance Criteria

1. WHEN a user visits the root URL ("/") THEN the system SHALL display the full homepage with hero section, search bar, and featured topics
2. WHEN the homepage loads THEN the system SHALL NOT display the basic API message "Q&A Article FAQ API"
3. WHEN featured topics are available THEN the system SHALL display them in a grid layout with proper styling
4. WHEN no topics exist THEN the system SHALL display an appropriate empty state message

### Requirement 2: Fix API Data Fetching

**User Story:** As a developer, I want API calls to work correctly in server components, so that data can be fetched and displayed without errors.

#### Acceptance Criteria

1. WHEN server components fetch data THEN the system SHALL use absolute URLs with the base URL
2. WHEN the API is called during build time THEN the system SHALL successfully retrieve data without network errors
3. WHEN API calls fail THEN the system SHALL display appropriate error messages to users
4. WHEN topics are fetched THEN the system SHALL properly handle the response and display the data

### Requirement 3: Enforce Admin Authentication

**User Story:** As a site administrator, I want the admin area to be properly secured, so that only authenticated users can access admin functionality.

#### Acceptance Criteria

1. WHEN an unauthenticated user tries to access any admin route THEN the system SHALL redirect them to the login page
2. WHEN a user successfully logs in THEN the system SHALL redirect them to the admin dashboard
3. WHEN an authenticated user accesses admin pages THEN the system SHALL allow access without errors
4. WHEN the middleware checks authentication THEN the system SHALL properly validate the user's session token

### Requirement 4: Fix Admin Data Loading

**User Story:** As an administrator, I want the admin dashboard to load statistics correctly, so that I can see an overview of my content.

#### Acceptance Criteria

1. WHEN the admin dashboard loads THEN the system SHALL fetch topics data successfully
2. WHEN topics data is retrieved THEN the system SHALL display accurate statistics for total, published, and draft topics
3. WHEN data fetching fails THEN the system SHALL display an error message instead of crashing
4. WHEN the admin makes API calls THEN the system SHALL use proper authentication headers
