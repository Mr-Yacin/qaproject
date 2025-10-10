# Steering Files

Steering files provide context and guidance to Kiro when working on this project. They help maintain consistency and follow best practices.

## File Organization

### Always Included (Global)
These files are included in every Kiro interaction:

- **product.md** - Product overview, features, and data model
- **tech.md** - Technology stack and common commands
- **structure.md** - Project structure and conventions

### Conditionally Included (File Match)
These files are only included when working with matching files:

- **admin-patterns.md** - Included when working with `src/components/admin/**/*`
  - Admin component patterns and UI guidelines
  - Form, list, and builder component patterns
  - Authentication and role-based rendering
  
- **api-patterns.md** - Included when working with `src/app/api/**/*`
  - API route structure and patterns
  - Authentication and authorization
  - Validation, error handling, and caching

## Front Matter Configuration

Steering files can use YAML front matter to control when they're included:

### Always Included (Default)
```yaml
# No front matter needed - included by default
```

### File Match Pattern
```yaml
---
inclusion: fileMatch
fileMatchPattern: 'src/components/admin/**/*'
---
```

### Manual Inclusion
```yaml
---
inclusion: manual
---
```
User must explicitly reference with `#steering-file-name` in chat.

## Adding New Steering Files

1. Create a new `.md` file in `.kiro/steering/`
2. Add front matter if conditional inclusion is needed
3. Write clear, actionable guidance
4. Use code examples to illustrate patterns
5. Keep it focused on a specific area or concern

## Best Practices

- Keep steering files focused and specific
- Use conditional inclusion to avoid overwhelming context
- Include code examples for common patterns
- Reference actual file paths and conventions used in the project
- Update steering files when patterns change
- Use clear headings and structure for easy scanning
