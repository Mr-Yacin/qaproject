# Responsive Design Guide

This guide covers responsive design patterns and best practices for the admin CMS.

## Breakpoints

The admin interface uses Tailwind CSS breakpoints:

- **sm**: 640px (small tablets)
- **md**: 768px (tablets)
- **lg**: 1024px (laptops)
- **xl**: 1280px (desktops)
- **2xl**: 1536px (large desktops)

## Layout Patterns

### Sidebar Navigation

The sidebar is responsive with the following behavior:

- **Mobile (< 1024px)**: Hidden by default, slides in from left when menu button is clicked
- **Desktop (≥ 1024px)**: Always visible, fixed position

**Implementation:**
```tsx
<Sidebar
  isMobileOpen={isMobileSidebarOpen}
  onMobileToggle={toggleMobileSidebar}
/>
```

### Content Area

The main content area adapts to screen size:

- **Mobile**: Full width with padding
- **Tablet**: Constrained width with increased padding
- **Desktop**: Max width of 1280px, centered

**Classes:**
```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
  {/* Content */}
</div>
```

## Component Patterns

### Tables

Tables should be scrollable on small screens:

**Option 1: Horizontal Scroll**
```tsx
<div className="overflow-x-auto">
  <table className="w-full min-w-[600px]">
    {/* Table content */}
  </table>
</div>
```

**Option 2: Responsive Table Component**
```tsx
import { ResponsiveTable } from '@/components/ui/responsive-table';

<ResponsiveTable>
  <table className="w-full">
    {/* Table content */}
  </table>
</ResponsiveTable>
```

**Option 3: Card View on Mobile**
```tsx
{/* Desktop table */}
<div className="hidden lg:block">
  <table className="w-full">
    {/* Table content */}
  </table>
</div>

{/* Mobile cards */}
<div className="lg:hidden space-y-3">
  {items.map(item => (
    <Card key={item.id}>
      {/* Card content */}
    </Card>
  ))}
</div>
```

### Forms

Forms should stack vertically on mobile and use grid on desktop:

```tsx
<form className="space-y-6">
  {/* Single column on mobile, two columns on desktop */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <Label>Field 1</Label>
      <Input />
    </div>
    <div>
      <Label>Field 2</Label>
      <Input />
    </div>
  </div>

  {/* Full width field */}
  <div>
    <Label>Full Width Field</Label>
    <Textarea />
  </div>

  {/* Buttons */}
  <div className="flex flex-col sm:flex-row gap-3">
    <Button type="submit">Save</Button>
    <Button type="button" variant="outline">Cancel</Button>
  </div>
</form>
```

### Buttons

Button groups should stack on mobile:

```tsx
{/* Stack on mobile, inline on desktop */}
<div className="flex flex-col sm:flex-row gap-3">
  <Button>Primary Action</Button>
  <Button variant="outline">Secondary Action</Button>
</div>

{/* Responsive button sizes */}
<Button size="sm" className="sm:size-default">
  Responsive Size
</Button>
```

### Search and Filters

Search bars and filters should stack on mobile:

```tsx
<div className="flex flex-col sm:flex-row gap-4">
  {/* Search input */}
  <div className="flex-1">
    <Input placeholder="Search..." />
  </div>

  {/* Filters */}
  <div className="flex gap-2">
    <select className="...">
      <option>Filter 1</option>
    </select>
    <Button>Apply</Button>
  </div>
</div>
```

### Modals and Dialogs

Modals should be full-screen on mobile:

```tsx
<Dialog>
  <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
    {/* Modal content */}
  </DialogContent>
</Dialog>
```

### Cards

Cards should adapt their layout:

```tsx
<Card>
  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
    <CardTitle>Title</CardTitle>
    <Button size="sm">Action</Button>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

## Touch Targets

All interactive elements should meet minimum touch target sizes:

- **Minimum**: 44x44px (iOS guideline)
- **Recommended**: 48x48px (Material Design guideline)

**Implementation:**
```tsx
<button className="min-h-[44px] min-w-[44px] p-2">
  <Icon className="w-5 h-5" />
</button>
```

## Typography

Text should scale appropriately:

```tsx
{/* Headings */}
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
  Responsive Heading
</h1>

{/* Body text */}
<p className="text-sm sm:text-base">
  Responsive paragraph text
</p>

{/* Truncate long text */}
<p className="truncate max-w-[200px] sm:max-w-none">
  Long text that truncates on mobile
</p>
```

## Spacing

Use responsive spacing utilities:

```tsx
{/* Responsive padding */}
<div className="p-4 sm:p-6 lg:p-8">
  {/* Content */}
</div>

{/* Responsive margin */}
<div className="mt-4 sm:mt-6 lg:mt-8">
  {/* Content */}
</div>

{/* Responsive gap */}
<div className="flex gap-2 sm:gap-4 lg:gap-6">
  {/* Items */}
</div>
```

## Grid Layouts

Use responsive grid columns:

```tsx
{/* 1 column on mobile, 2 on tablet, 3 on desktop */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => (
    <Card key={item.id}>
      {/* Card content */}
    </Card>
  ))}
</div>

{/* Media library grid */}
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
  {/* Media items */}
</div>
```

## Navigation

### Breadcrumbs

Breadcrumbs should truncate on mobile:

```tsx
<nav className="flex items-center space-x-2 text-sm overflow-x-auto">
  <Link href="/" className="hover:underline whitespace-nowrap">
    Home
  </Link>
  <span>/</span>
  <Link href="/admin" className="hover:underline whitespace-nowrap">
    Admin
  </Link>
  <span>/</span>
  <span className="text-muted-foreground truncate">
    Current Page
  </span>
</nav>
```

### Tabs

Tabs should scroll horizontally on mobile:

```tsx
<div className="border-b overflow-x-auto">
  <nav className="flex space-x-4 min-w-max px-4">
    <button className="py-2 px-1 border-b-2 whitespace-nowrap">
      Tab 1
    </button>
    <button className="py-2 px-1 whitespace-nowrap">
      Tab 2
    </button>
  </nav>
</div>
```

## Images

Images should be responsive:

```tsx
{/* Responsive image */}
<img
  src="/image.jpg"
  alt="Description"
  className="w-full h-auto"
/>

{/* Aspect ratio container */}
<div className="aspect-video w-full overflow-hidden rounded-lg">
  <img
    src="/image.jpg"
    alt="Description"
    className="w-full h-full object-cover"
  />
</div>
```

## Visibility Utilities

Show/hide elements based on screen size:

```tsx
{/* Hide on mobile, show on desktop */}
<div className="hidden lg:block">
  Desktop only content
</div>

{/* Show on mobile, hide on desktop */}
<div className="lg:hidden">
  Mobile only content
</div>

{/* Show on tablet and up */}
<div className="hidden md:block">
  Tablet and desktop content
</div>
```

## Testing Responsive Design

### Browser DevTools

1. Open Chrome/Firefox DevTools (F12)
2. Click the device toolbar icon (Ctrl+Shift+M)
3. Test different device sizes:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)
   - iPad Pro (1024px)
   - Desktop (1280px+)

### Common Breakpoints to Test

- **320px**: Small phones
- **375px**: iPhone SE, iPhone 12 mini
- **390px**: iPhone 12/13/14
- **768px**: iPad portrait
- **1024px**: iPad landscape, small laptops
- **1280px**: Desktop
- **1920px**: Large desktop

### Checklist

- [ ] Sidebar collapses on mobile
- [ ] Tables scroll horizontally or switch to cards
- [ ] Forms stack vertically on mobile
- [ ] Buttons are large enough to tap (44x44px minimum)
- [ ] Text is readable without zooming
- [ ] Images scale appropriately
- [ ] Navigation is accessible on all screen sizes
- [ ] Modals don't overflow viewport
- [ ] Touch targets are adequately sized
- [ ] Content doesn't require horizontal scrolling (except tables)

## Best Practices

1. **Mobile-First Approach**: Start with mobile styles, add desktop styles with breakpoints
2. **Touch-Friendly**: Ensure all interactive elements are easy to tap
3. **Readable Text**: Use appropriate font sizes (minimum 16px for body text)
4. **Adequate Spacing**: Provide enough space between interactive elements
5. **Test on Real Devices**: Emulators are helpful, but test on actual devices when possible
6. **Performance**: Optimize images and assets for mobile networks
7. **Accessibility**: Ensure responsive design doesn't break accessibility features
8. **Consistent Experience**: Maintain feature parity across devices when possible

## Common Patterns

### Responsive Dashboard

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>
    <CardHeader>
      <CardTitle className="text-lg sm:text-xl">Stat 1</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-2xl sm:text-3xl font-bold">123</p>
    </CardContent>
  </Card>
  {/* More cards */}
</div>
```

### Responsive List with Actions

```tsx
<div className="space-y-3">
  {items.map(item => (
    <Card key={item.id}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3">
        <div className="flex-1">
          <h3 className="font-medium">{item.title}</h3>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm">Edit</Button>
          <Button size="sm" variant="outline">Delete</Button>
        </div>
      </div>
    </Card>
  ))}
</div>
```

### Responsive Form Layout

```tsx
<form className="space-y-6">
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
      <Label>Main Content</Label>
      <Textarea rows={10} />
    </div>
    <div className="space-y-6">
      <div>
        <Label>Status</Label>
        <Select />
      </div>
      <div>
        <Label>Category</Label>
        <Select />
      </div>
    </div>
  </div>
</form>
```

## Resources

- [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)
- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Web.dev Responsive Web Design Basics](https://web.dev/responsive-web-design-basics/)
- [Material Design Touch Targets](https://material.io/design/usability/accessibility.html#layout-and-typography)
