# Setup Guides

Complete guides for setting up and configuring the Q&A Article FAQ API.

## Quick Start

New to the project? Start here:

1. **[Getting Started](./getting-started.md)** - Quick start guide for new developers
2. **[Environment Setup](./environment-setup.md)** - Configure environment variables
3. **[Database Setup](./database-setup.md)** - Set up PostgreSQL and run migrations
4. **[Docker Setup](./docker-setup.md)** - Run the application with Docker

## Setup Guides

### Essential Setup

- **[Getting Started](./getting-started.md)**
  - Prerequisites and installation
  - First-time setup steps
  - Verify your installation

- **[Environment Setup](./environment-setup.md)**
  - Environment variable configuration
  - Database connection strings
  - API keys and secrets
  - Development vs production settings

- **[Database Setup](./database-setup.md)**
  - PostgreSQL installation
  - Running migrations
  - Seeding test data
  - Using Prisma Studio

### Deployment

- **[Docker Setup](./docker-setup.md)**
  - Docker and Docker Compose setup
  - Building and running containers
  - Docker environment configuration
  - Troubleshooting Docker issues

## Common Setup Issues

### Database Connection Errors

If you're having trouble connecting to the database:
1. Verify your `DATABASE_URL` in `.env`
2. Ensure PostgreSQL is running
3. Check firewall and network settings
4. See [Database Setup](./database-setup.md) for details

### Missing Environment Variables

If you see errors about missing environment variables:
1. Copy `.env.example` to `.env`
2. Fill in all required values
3. See [Environment Setup](./environment-setup.md) for details

### Docker Issues

If Docker containers won't start:
1. Check Docker is running
2. Verify port availability (3000, 5432)
3. See [Docker Setup](./docker-setup.md) for troubleshooting

## Next Steps

After completing setup:
- Read the [Architecture Documentation](../architecture/) to understand the system
- Review [Testing Guides](../testing/) to run tests
- Check the main [README](../../README.md) for API documentation

## Related Documentation

- [Main README](../../README.md) - Project overview and API documentation
- [Architecture](../architecture/) - System design and implementation
- [Testing](../testing/) - Testing guides and procedures
