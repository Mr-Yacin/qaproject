# Admin API Reference

Complete API reference for all admin endpoints in the CMS.

## Table of Contents

- [Authentication](#authentication)
- [Site Settings](#site-settings)
- [Custom Pages](#custom-pages)
- [Navigation Menu](#navigation-menu)
- [Footer Management](#footer-management)
- [Media Library](#media-library)
- [User Management](#user-management)
- [Audit Log](#audit-log)
- [Cache Management](#cache-management)
- [Bulk Operations](#bulk-operations)

## Authentication

All admin API endpoints require authentication via NextAuth.js session.

### Required Headers

```
Cookie: next-auth.session-token=<session-token>
```

### Authorization

Endpoints are protected by role-based access control:
- **Admin**: Full access to all endpoints
- **Editor**: Access to content management endpoints
- **Viewer**: Read-only access

### Error Responses

- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Insufficient permissions

---

## Site Settings

### GET /api/admin/settings

Get current site settings.

**Authorization:** Admin

**Response (200):**

```json
{
  "id": "clx1234567890",
  "siteName": "My Site",
  "logoUrl": "/uploads/logo.png",
  "faviconUrl": "/uploads/favicon.ico",
  "seoTitle": "My Site - Welcome",
  "seoDescription": "Welcome to my site",
  "seoKeywords": ["keyword1", "keyword2"],
  "socialLinks": {
    "twitter": "https://twitter.com/mysite",
    "facebook": "https://facebook.com/mysite"
  },
  "customCss": "",
  "customJs": "",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "updatedBy": "user123"
}
```

### PUT /api/admin/settings

Update site settings.

**Authorization:** Admin

**Request Body:**

```json
{
  "siteName": "My Updated Site",
  "seoTitle": "My Updated Site - Welcome",
  "seoDescription": "Welcome to my updated site",
  "seoKeywords": ["keyword1", "keyword2", "keyword3"],
  "socialLinks": {
    "twitter": "https://twitter.com/mysite",
    "facebook": "https://facebook.com/mysite",
    "linkedin": "https://linkedin.com/company/mysite"
  }
}
```

**Response (200):**

```json
{
  "id": "clx1234567890",
  "siteName": "My Updated Site",
  "seoTitle": "My Updated Site - Welcome",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

### POST /api/admin/settings/logo

Upload site logo.

**Authorization:** Admin

**Request:** `multipart/form-data`

```
file: <image file>
```

**Response (200):**

```json
{
  "url": "/uploads/logo-1234567890.png"
}
```

**Validation:**
- Max file size: 2MB
- Allowed types: image/jpeg, image/png, image/gif, image/webp, image/svg+xml

---

## Custom Pages

### GET /api/admin/pages

List all pages with pagination.

**Authorization:** Admin, Editor

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `status` (string, optional): Filter by status (DRAFT or PUBLISHED)

**Response (200):**

```json
{
  "items": [
    {
      "id": "clx1234567890",
      "slug": "about-us",
      "title": "About Us",
      "status": "PUBLISHED",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1
}
```

### GET /api/admin/pages/[slug]

Get a specific page by slug.

**Authorization:** Admin, Editor

**Response (200):**

```json
{
  "id": "clx1234567890",
  "slug": "about-us",
  "title": "About Us",
  "content": "<p>Welcome to our about page...</p>",
  "status": "PUBLISHED",
  "seoTitle": "About Us - My Site",
  "seoDescription": "Learn more about us",
  "seoKeywords": ["about", "company"],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "createdBy": "user123",
  "updatedBy": "user123"
}
```

### POST /api/admin/pages

Create a new page.

**Authorization:** Admin, Editor

**Request Body:**

```json
{
  "slug": "privacy-policy",
  "title": "Privacy Policy",
  "content": "<p>Our privacy policy...</p>",
  "status": "PUBLISHED",
  "seoTitle": "Privacy Policy - My Site",
  "seoDescription": "Our privacy policy",
  "seoKeywords": ["privacy", "policy"]
}
```

**Response (201):**

```json
{
  "id": "clx2234567890",
  "slug": "privacy-policy",
  "title": "Privacy Policy",
  "status": "PUBLISHED",
  "createdAt": "2024-01-15T11:00:00.000Z"
}
```

**Validation:**
- `slug`: Required, unique, lowercase with hyphens only
- `title`: Required, max 200 characters
- `content`: Required
- `status`: Required, must be DRAFT or PUBLISHED

### PUT /api/admin/pages/[slug]

Update an existing page.

**Authorization:** Admin, Editor

**Request Body:**

```json
{
  "title": "Updated Privacy Policy",
  "content": "<p>Our updated privacy policy...</p>",
  "status": "PUBLISHED"
}
```

**Response (200):**

```json
{
  "id": "clx2234567890",
  "slug": "privacy-policy",
  "title": "Updated Privacy Policy",
  "updatedAt": "2024-01-15T11:30:00.000Z"
}
```

### DELETE /api/admin/pages/[slug]

Delete a page.

**Authorization:** Admin, Editor

**Response (200):**

```json
{
  "message": "Page deleted successfully"
}
```

---

## Navigation Menu

### GET /api/admin/menus

Get the complete menu structure.

**Authorization:** Admin, Editor

**Response (200):**

```json
{
  "items": [
    {
      "id": "clx1234567890",
      "label": "Home",
      "url": "/",
      "order": 0,
      "parentId": null,
      "isExternal": false,
      "openNewTab": false,
      "children": []
    },
    {
      "id": "clx2234567890",
      "label": "About",
      "url": "/pages/about-us",
      "order": 1,
      "parentId": null,
      "isExternal": false,
      "openNewTab": false,
      "children": [
        {
          "id": "clx3234567890",
          "label": "Team",
          "url": "/pages/team",
          "order": 0,
          "parentId": "clx2234567890",
          "isExternal": false,
          "openNewTab": false,
          "children": []
        }
      ]
    }
  ]
}
```

### POST /api/admin/menus

Create a new menu item.

**Authorization:** Admin, Editor

**Request Body:**

```json
{
  "label": "Contact",
  "url": "/pages/contact",
  "order": 2,
  "parentId": null,
  "isExternal": false,
  "openNewTab": false
}
```

**Response (201):**

```json
{
  "id": "clx4234567890",
  "label": "Contact",
  "url": "/pages/contact",
  "order": 2,
  "createdAt": "2024-01-15T11:00:00.000Z"
}
```

### PUT /api/admin/menus/[id]

Update a menu item.

**Authorization:** Admin, Editor

**Request Body:**

```json
{
  "label": "Contact Us",
  "url": "/pages/contact-us",
  "order": 2
}
```

**Response (200):**

```json
{
  "id": "clx4234567890",
  "label": "Contact Us",
  "url": "/pages/contact-us",
  "updatedAt": "2024-01-15T11:30:00.000Z"
}
```

### DELETE /api/admin/menus/[id]

Delete a menu item (and all its children).

**Authorization:** Admin, Editor

**Response (200):**

```json
{
  "message": "Menu item deleted successfully"
}
```

### PUT /api/admin/menus/reorder

Reorder menu items.

**Authorization:** Admin, Editor

**Request Body:**

```json
{
  "items": [
    { "id": "clx1234567890", "order": 0 },
    { "id": "clx2234567890", "order": 1 },
    { "id": "clx4234567890", "order": 2 }
  ]
}
```

**Response (200):**

```json
{
  "message": "Menu items reordered successfully"
}
```

---

## Footer Management

### GET /api/admin/footer

Get complete footer configuration.

**Authorization:** Admin, Editor

**Response (200):**

```json
{
  "settings": {
    "id": "clx1234567890",
    "copyrightText": "© 2024 My Site. All rights reserved.",
    "socialLinks": {
      "twitter": "https://twitter.com/mysite",
      "facebook": "https://facebook.com/mysite"
    },
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "columns": [
    {
      "id": "clx2234567890",
      "title": "Company",
      "order": 0,
      "links": [
        {
          "id": "clx3234567890",
          "label": "About Us",
          "url": "/pages/about-us",
          "order": 0
        }
      ]
    }
  ]
}
```

### PUT /api/admin/footer/settings

Update footer settings.

**Authorization:** Admin, Editor

**Request Body:**

```json
{
  "copyrightText": "© 2024 My Updated Site. All rights reserved.",
  "socialLinks": {
    "twitter": "https://twitter.com/mysite",
    "facebook": "https://facebook.com/mysite",
    "linkedin": "https://linkedin.com/company/mysite"
  }
}
```

**Response (200):**

```json
{
  "id": "clx1234567890",
  "copyrightText": "© 2024 My Updated Site. All rights reserved.",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

### POST /api/admin/footer/columns

Create a footer column.

**Authorization:** Admin, Editor

**Request Body:**

```json
{
  "title": "Resources",
  "order": 1
}
```

**Response (201):**

```json
{
  "id": "clx4234567890",
  "title": "Resources",
  "order": 1,
  "createdAt": "2024-01-15T11:00:00.000Z"
}
```

### PUT /api/admin/footer/columns/[id]

Update a footer column.

**Authorization:** Admin, Editor

**Request Body:**

```json
{
  "title": "Helpful Resources",
  "order": 1
}
```

**Response (200):**

```json
{
  "id": "clx4234567890",
  "title": "Helpful Resources",
  "updatedAt": "2024-01-15T11:30:00.000Z"
}
```

### DELETE /api/admin/footer/columns/[id]

Delete a footer column (and all its links).

**Authorization:** Admin, Editor

**Response (200):**

```json
{
  "message": "Footer column deleted successfully"
}
```

### POST /api/admin/footer/links

Create a footer link.

**Authorization:** Admin, Editor

**Request Body:**

```json
{
  "columnId": "clx4234567890",
  "label": "Documentation",
  "url": "/docs",
  "order": 0
}
```

**Response (201):**

```json
{
  "id": "clx5234567890",
  "columnId": "clx4234567890",
  "label": "Documentation",
  "url": "/docs",
  "order": 0,
  "createdAt": "2024-01-15T11:00:00.000Z"
}
```

### PUT /api/admin/footer/links/[id]

Update a footer link.

**Authorization:** Admin, Editor

**Request Body:**

```json
{
  "label": "API Documentation",
  "url": "/docs/api",
  "order": 0
}
```

**Response (200):**

```json
{
  "id": "clx5234567890",
  "label": "API Documentation",
  "updatedAt": "2024-01-15T11:30:00.000Z"
}
```

### DELETE /api/admin/footer/links/[id]

Delete a footer link.

**Authorization:** Admin, Editor

**Response (200):**

```json
{
  "message": "Footer link deleted successfully"
}
```

---

## Media Library

### GET /api/admin/media

List all media files with pagination.

**Authorization:** Admin, Editor

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20, max: 100)
- `search` (string, optional): Search by filename

**Response (200):**

```json
{
  "items": [
    {
      "id": "clx1234567890",
      "filename": "logo-1234567890.png",
      "originalName": "logo.png",
      "mimeType": "image/png",
      "size": 45678,
      "url": "/uploads/logo-1234567890.png",
      "thumbnailUrl": "/uploads/thumbnails/logo-1234567890.png",
      "uploadedBy": "user123",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 20,
  "totalPages": 2
}
```

### POST /api/admin/media/upload

Upload a file.

**Authorization:** Admin, Editor

**Request:** `multipart/form-data`

```
file: <file>
```

**Response (201):**

```json
{
  "id": "clx2234567890",
  "filename": "document-1234567890.pdf",
  "originalName": "document.pdf",
  "mimeType": "application/pdf",
  "size": 123456,
  "url": "/uploads/document-1234567890.pdf",
  "createdAt": "2024-01-15T11:00:00.000Z"
}
```

**Validation:**
- Max file size: 10MB
- Allowed types: image/jpeg, image/png, image/gif, image/webp, application/pdf

### DELETE /api/admin/media/[id]

Delete a media file.

**Authorization:** Admin, Editor

**Response (200):**

```json
{
  "message": "Media file deleted successfully"
}
```

---

## User Management

### GET /api/admin/users

List all users.

**Authorization:** Admin

**Response (200):**

```json
{
  "items": [
    {
      "id": "clx1234567890",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### POST /api/admin/users

Create a new user.

**Authorization:** Admin

**Request Body:**

```json
{
  "email": "editor@example.com",
  "password": "SecurePassword123!",
  "name": "Editor User",
  "role": "EDITOR",
  "isActive": true
}
```

**Response (201):**

```json
{
  "id": "clx2234567890",
  "email": "editor@example.com",
  "name": "Editor User",
  "role": "EDITOR",
  "isActive": true,
  "createdAt": "2024-01-15T11:00:00.000Z"
}
```

**Validation:**
- `email`: Required, valid email format, unique
- `password`: Required, minimum 8 characters
- `name`: Required
- `role`: Required, must be ADMIN, EDITOR, or VIEWER

### PUT /api/admin/users/[id]

Update a user.

**Authorization:** Admin

**Request Body:**

```json
{
  "name": "Updated Editor User",
  "role": "ADMIN",
  "isActive": true
}
```

**Response (200):**

```json
{
  "id": "clx2234567890",
  "email": "editor@example.com",
  "name": "Updated Editor User",
  "role": "ADMIN",
  "updatedAt": "2024-01-15T11:30:00.000Z"
}
```

### DELETE /api/admin/users/[id]

Delete a user.

**Authorization:** Admin

**Response (200):**

```json
{
  "message": "User deleted successfully"
}
```

---

## Audit Log

### GET /api/admin/audit-log

Get audit log entries with filtering.

**Authorization:** Admin

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50, max: 100)
- `userId` (string, optional): Filter by user ID
- `action` (string, optional): Filter by action (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
- `entityType` (string, optional): Filter by entity type
- `startDate` (string, optional): Filter by start date (ISO 8601)
- `endDate` (string, optional): Filter by end date (ISO 8601)

**Response (200):**

```json
{
  "items": [
    {
      "id": "clx1234567890",
      "userId": "user123",
      "action": "UPDATE",
      "entityType": "Page",
      "entityId": "page123",
      "details": {
        "before": { "title": "Old Title" },
        "after": { "title": "New Title" }
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "user": {
        "name": "Admin User",
        "email": "admin@example.com"
      }
    }
  ],
  "total": 1234,
  "page": 1,
  "limit": 50,
  "totalPages": 25
}
```

### GET /api/admin/audit-log/export

Export audit log as CSV.

**Authorization:** Admin

**Query Parameters:** Same as GET /api/admin/audit-log

**Response (200):** CSV file download

---

## Cache Management

### GET /api/admin/cache/stats

Get cache statistics.

**Authorization:** Admin

**Response (200):**

```json
{
  "tags": [
    {
      "name": "topics",
      "lastRevalidated": "2024-01-15T10:30:00.000Z"
    },
    {
      "name": "pages",
      "lastRevalidated": "2024-01-15T11:00:00.000Z"
    }
  ]
}
```

### POST /api/admin/cache/clear

Clear cache.

**Authorization:** Admin

**Request Body:**

```json
{
  "tags": ["topics", "pages"]
}
```

Or clear all:

```json
{
  "tags": []
}
```

**Response (200):**

```json
{
  "message": "Cache cleared successfully",
  "tags": ["topics", "pages"]
}
```

---

## Bulk Operations

### POST /api/admin/topics/bulk-delete

Delete multiple topics.

**Authorization:** Admin, Editor

**Request Body:**

```json
{
  "topicIds": ["clx1234567890", "clx2234567890", "clx3234567890"]
}
```

**Response (200):**

```json
{
  "message": "Bulk delete completed",
  "successful": 3,
  "failed": 0,
  "errors": []
}
```

### POST /api/admin/topics/bulk-update

Update multiple topics.

**Authorization:** Admin, Editor

**Request Body:**

```json
{
  "topicIds": ["clx1234567890", "clx2234567890"],
  "updates": {
    "tags": ["updated", "bulk"]
  }
}
```

**Response (200):**

```json
{
  "message": "Bulk update completed",
  "successful": 2,
  "failed": 0,
  "errors": []
}
```

### POST /api/admin/topics/export

Export topics as JSON.

**Authorization:** Admin, Editor

**Request Body:**

```json
{
  "topicIds": ["clx1234567890", "clx2234567890"]
}
```

Or export all:

```json
{
  "topicIds": []
}
```

**Response (200):** JSON file download

### POST /api/admin/topics/import

Import topics from JSON.

**Authorization:** Admin, Editor

**Request:** `multipart/form-data`

```
file: <JSON file>
```

**Response (200):**

```json
{
  "message": "Import completed",
  "successful": 5,
  "failed": 1,
  "errors": [
    {
      "slug": "invalid-topic",
      "error": "Validation failed"
    }
  ]
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "slug",
      "message": "Slug must be lowercase with hyphens only"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized",
  "message": "You must be logged in to access this resource"
}
```

### 403 Forbidden

```json
{
  "error": "Forbidden",
  "message": "You do not have permission to access this resource"
}
```

### 404 Not Found

```json
{
  "error": "Not found",
  "message": "The requested resource was not found"
}
```

### 409 Conflict

```json
{
  "error": "Conflict",
  "message": "A resource with that slug already exists"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

Admin API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute
- **File upload endpoints**: 10 requests per minute
- **Other endpoints**: 100 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642252800
```

## Best Practices

1. **Always validate input**: Use the provided Zod schemas
2. **Handle errors gracefully**: Check status codes and error messages
3. **Use pagination**: Don't fetch all items at once
4. **Cache responses**: Cache GET requests when appropriate
5. **Respect rate limits**: Implement exponential backoff for retries
6. **Use HTTPS**: Always use HTTPS in production
7. **Secure credentials**: Never expose session tokens or API keys
