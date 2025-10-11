# Admin CMS User Guide

This guide covers all features available in the admin Content Management System (CMS).

## Table of Contents

- [Getting Started](#getting-started)
- [Dashboard](#dashboard)
- [Site Settings](#site-settings)
- [Custom Pages](#custom-pages)
- [Navigation Menu](#navigation-menu)
- [Footer Management](#footer-management)
- [Media Library](#media-library)
- [Topic Management](#topic-management)
- [User Management](#user-management)
- [Audit Log](#audit-log)
- [Cache Management](#cache-management)
- [User Roles](#user-roles)

## Getting Started

### Accessing the Admin Panel

1. Navigate to `/admin` in your browser
2. Log in with your admin credentials
3. You'll be redirected to the admin dashboard

### User Roles

The system supports three user roles:

- **Admin**: Full access to all features including settings and user management
- **Editor**: Can manage content (topics, pages, media) but cannot change settings or manage users
- **Viewer**: Read-only access to the admin interface

## Dashboard

The admin dashboard provides an overview of your content and quick access to common tasks.

**Features:**
- Content statistics (topics, pages, media files)
- Recent activity
- Quick action buttons

## Site Settings

Manage global site configuration including branding, SEO, and social media links.

**Location:** `/admin/settings`

**Access:** Admin only

### Available Settings

#### Branding
- **Site Name**: The name displayed across your site
- **Logo**: Upload your site logo (recommended: PNG or SVG, max 2MB)
- **Favicon**: Upload your site favicon (recommended: ICO or PNG, 32x32px)

#### SEO Metadata
- **SEO Title**: Default title for search engines (max 60 characters)
- **SEO Description**: Default meta description (max 160 characters)
- **SEO Keywords**: Comma-separated keywords for search engines

#### Social Media
- **Social Links**: Add links to your social media profiles (Twitter, Facebook, LinkedIn, Instagram, YouTube)

#### Advanced
- **Custom CSS**: Add custom CSS styles (use with caution)
- **Custom JavaScript**: Add custom JavaScript code (use with caution)

### How to Update Settings

1. Navigate to `/admin/settings`
2. Update the desired fields
3. Click "Save Changes"
4. Changes take effect immediately

## Custom Pages

Create and manage custom pages like About Us, Contact, Privacy Policy, etc.

**Location:** `/admin/pages`

**Access:** Admin, Editor

### Creating a Page

1. Navigate to `/admin/pages`
2. Click "Create Page"
3. Fill in the required fields:
   - **Slug**: URL-friendly identifier (e.g., `about-us`)
   - **Title**: Page title
   - **Content**: Page content using the rich text editor
   - **Status**: DRAFT or PUBLISHED
4. Optionally add SEO metadata
5. Click "Create Page"

### Editing a Page

1. Navigate to `/admin/pages`
2. Click "Edit" on the page you want to modify
3. Make your changes
4. Click "Save Changes"

### Publishing a Page

- Set the status to "PUBLISHED" to make the page visible on the frontend
- Published pages are accessible at `/pages/[slug]`
- Draft pages are only visible in the admin panel

### Deleting a Page

1. Navigate to `/admin/pages`
2. Click "Delete" on the page you want to remove
3. Confirm the deletion

**Warning:** Deletion is permanent and cannot be undone.

### Rich Text Editor

The page editor includes a powerful rich text editor with the following features:

- **Formatting**: Bold, italic, underline, strikethrough
- **Headings**: H1, H2, H3, H4, H5, H6
- **Lists**: Bulleted and numbered lists
- **Links**: Add hyperlinks
- **Images**: Insert images from the media library
- **Code**: Inline code and code blocks
- **Quotes**: Blockquotes
- **Tables**: Insert and edit tables

## Navigation Menu

Manage your site's navigation menu with support for nested items.

**Location:** `/admin/menus`

**Access:** Admin, Editor

### Adding a Menu Item

1. Navigate to `/admin/menus`
2. Click "Add Menu Item"
3. Fill in the fields:
   - **Label**: Text displayed in the menu
   - **URL**: Link destination (internal or external)
   - **Parent**: Optional parent item for nested menus
   - **Order**: Display order (lower numbers appear first)
   - **Open in New Tab**: Check for external links
4. Click "Save"

### Creating Nested Menus

To create a dropdown menu:

1. Create a parent menu item
2. When creating child items, select the parent from the "Parent" dropdown
3. Child items will appear as a dropdown under the parent

### Reordering Menu Items

1. Navigate to `/admin/menus`
2. Use the drag-and-drop interface to reorder items
3. Changes are saved automatically

### Editing a Menu Item

1. Navigate to `/admin/menus`
2. Click "Edit" on the item you want to modify
3. Make your changes
4. Click "Save"

### Deleting a Menu Item

1. Navigate to `/admin/menus`
2. Click "Delete" on the item you want to remove
3. Confirm the deletion

**Note:** Deleting a parent item will also delete all its children.

## Footer Management

Configure your site's footer with multiple columns and links.

**Location:** `/admin/footer`

**Access:** Admin, Editor

### Footer Settings

- **Copyright Text**: Text displayed at the bottom of the footer
- **Social Links**: Social media icons and links

### Managing Footer Columns

#### Adding a Column

1. Navigate to `/admin/footer`
2. Click "Add Column"
3. Enter the column title
4. Set the display order
5. Click "Save"

#### Adding Links to a Column

1. Select a column
2. Click "Add Link"
3. Fill in:
   - **Label**: Link text
   - **URL**: Link destination
   - **Order**: Display order within the column
4. Click "Save"

#### Reordering Columns and Links

Use the drag-and-drop interface to reorder columns and links within columns.

### Editing Footer Content

1. Navigate to `/admin/footer`
2. Click "Edit" on the column or link you want to modify
3. Make your changes
4. Click "Save"

### Deleting Footer Content

- To delete a column: Click "Delete" on the column (this will also delete all links in that column)
- To delete a link: Click "Delete" on the link

## Media Library

Upload, organize, and manage images and files.

**Location:** `/admin/media`

**Access:** Admin, Editor

### Uploading Files

1. Navigate to `/admin/media`
2. Click "Upload" or drag and drop files
3. Supported formats:
   - Images: JPEG, PNG, GIF, WebP
   - Documents: PDF
4. Maximum file size: 10MB

### Viewing File Details

Click on any file to view:
- Filename
- File size
- Upload date
- File URL
- Thumbnail (for images)

### Using Files in Content

1. Copy the file URL from the media library
2. Paste it into your page content or settings

### Searching Files

Use the search box to filter files by filename.

### Deleting Files

1. Click on a file
2. Click "Delete"
3. Confirm the deletion

**Warning:** Deleting a file that's used in pages or settings will break those references.

## Topic Management

Manage Q&A topics, articles, and FAQ items.

**Location:** `/admin/topics`

**Access:** Admin, Editor

### Creating a Topic

1. Navigate to `/admin/topics`
2. Click "Create Topic"
3. Fill in the required fields:
   - **Slug**: Unique identifier
   - **Title**: Topic title
   - **Locale**: Language code (e.g., "en")
   - **Tags**: Categorization tags
   - **Main Question**: The primary question
   - **Article Content**: Full article text
   - **Status**: DRAFT or PUBLISHED
4. Optionally add FAQ items
5. Click "Create Topic"

### Editing a Topic

1. Navigate to `/admin/topics`
2. Click "Edit" on the topic
3. Make your changes
4. Click "Save Changes"

### Deleting a Topic

1. Navigate to `/admin/topics`
2. Click "Delete" on the topic
3. Confirm the deletion

**Note:** This will delete the topic and all related content (questions, article, FAQ items).

### Bulk Operations

Select multiple topics to perform bulk actions:

- **Bulk Delete**: Delete multiple topics at once
- **Bulk Update**: Update status or tags for multiple topics
- **Export**: Export selected topics as JSON
- **Import**: Import topics from JSON file

## User Management

Manage admin users and their roles.

**Location:** `/admin/users`

**Access:** Admin only

### Creating a User

1. Navigate to `/admin/users`
2. Click "Create User"
3. Fill in the fields:
   - **Name**: User's full name
   - **Email**: User's email address
   - **Password**: Strong password (min 8 characters)
   - **Role**: ADMIN, EDITOR, or VIEWER
   - **Active**: Whether the user can log in
4. Click "Create User"

### Editing a User

1. Navigate to `/admin/users`
2. Click "Edit" on the user
3. Make your changes
4. Click "Save"

### Changing User Roles

1. Edit the user
2. Select a new role from the dropdown
3. Save changes
4. The new permissions take effect immediately

### Deactivating a User

1. Edit the user
2. Uncheck "Active"
3. Save changes
4. The user will no longer be able to log in

### Deleting a User

1. Navigate to `/admin/users`
2. Click "Delete" on the user
3. Confirm the deletion

**Warning:** Deletion is permanent. Consider deactivating instead.

## Audit Log

View a complete history of all admin actions.

**Location:** `/admin/audit-log`

**Access:** Admin only

### Viewing the Audit Log

The audit log displays:
- **Timestamp**: When the action occurred
- **User**: Who performed the action
- **Action**: Type of action (CREATE, UPDATE, DELETE, LOGIN, LOGOUT)
- **Entity**: What was affected (Topic, Page, Settings, etc.)
- **Details**: Before/after values for updates

### Filtering the Log

Use the filter controls to narrow down results:
- **Date Range**: Filter by date
- **User**: Filter by specific user
- **Action Type**: Filter by action (CREATE, UPDATE, DELETE, etc.)
- **Entity Type**: Filter by entity (Topic, Page, Settings, etc.)

### Exporting the Log

1. Apply desired filters
2. Click "Export to CSV"
3. The filtered log will be downloaded as a CSV file

### Searching the Log

Use the search box to perform full-text search across all log entries.

## Cache Management

View cache statistics and clear cached content.

**Location:** `/admin/cache`

**Access:** Admin only

### Viewing Cache Statistics

The cache page displays:
- Cache hit/miss rates
- Last revalidation time for each tag
- Total cached items

### Clearing Cache

#### Clear All Cache

1. Navigate to `/admin/cache`
2. Click "Clear All Cache"
3. Confirm the action
4. All cached content will be revalidated

#### Clear Specific Tags

1. Navigate to `/admin/cache`
2. Select specific cache tags (e.g., "topics", "pages", "menu")
3. Click "Clear Selected"
4. Only the selected tags will be revalidated

### When to Clear Cache

Clear cache when:
- Content changes aren't appearing on the frontend
- You've made significant configuration changes
- You're troubleshooting display issues

**Note:** Cache is automatically cleared when you update content through the admin panel. Manual clearing is rarely needed.

## User Roles

### Admin

**Full access to all features:**
- Site settings management
- User management
- All content management features
- Audit log access
- Cache management

### Editor

**Content management access:**
- Create, edit, delete topics
- Create, edit, delete pages
- Manage navigation menu
- Manage footer
- Upload and manage media
- **Cannot:** Change settings, manage users, view audit log, manage cache

### Viewer

**Read-only access:**
- View all content in admin panel
- **Cannot:** Create, edit, or delete anything

## Best Practices

### Content Management

1. **Use Drafts**: Create content as DRAFT first, review, then publish
2. **SEO Optimization**: Always fill in SEO metadata for pages
3. **Consistent Slugs**: Use lowercase, hyphens, and descriptive slugs
4. **Image Optimization**: Compress images before uploading
5. **Regular Backups**: Export important content regularly

### Security

1. **Strong Passwords**: Use complex passwords for all users
2. **Least Privilege**: Assign the minimum role needed for each user
3. **Regular Audits**: Review the audit log periodically
4. **Deactivate Unused Accounts**: Deactivate users who no longer need access

### Performance

1. **Optimize Images**: Use appropriate image sizes and formats
2. **Clean Media Library**: Delete unused files regularly
3. **Cache Management**: Only clear cache when necessary
4. **Bulk Operations**: Use bulk operations for efficiency

## Troubleshooting

### Changes Not Appearing

1. Clear the cache from `/admin/cache`
2. Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)
3. Check if content is published (not DRAFT)

### Cannot Upload Files

1. Check file size (max 10MB)
2. Verify file format is supported
3. Check browser console for errors

### Permission Denied

1. Verify your user role has access to the feature
2. Contact an admin to update your permissions

### Login Issues

1. Verify your account is active
2. Reset your password if needed
3. Contact an admin for assistance

## Support

For additional help or to report issues, contact your system administrator.
