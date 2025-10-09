# Getting Started

This guide will help you get the Q&A Article FAQ API up and running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - JavaScript runtime
- **PostgreSQL** - Database (local or hosted like Neon/Supabase)
- **npm or yarn** - Package manager

## Installation Steps

### 1. Clone and Install Dependencies

Clone the repository and install all required packages:

```bash
npm install
```

This will install all dependencies and automatically generate the Prisma client.

### 2. Set Up Environment Variables

Copy the example environment file to create your own:

```bash
cp .env.example .env
```

Then configure your environment variables. See the [Environment Setup Guide](./environment-setup.md) for detailed instructions.

### 3. Set Up the Database

Run database migrations to create the schema:

```bash
npx prisma migrate dev
```

For more database setup options, see the [Database Setup Guide](./database-setup.md).

### 4. Start the Development Server

Launch the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

## Verify Installation

### Check the API

Visit `http://localhost:3000/api/topics` in your browser. You should see a JSON response:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 20,
  "totalPages": 0
}
```

### View the Database

Open Prisma Studio to view and edit data:

```bash
npx prisma studio
```

## Next Steps

- Read the [API Documentation](../../README.md#api-documentation) to learn about available endpoints
- See [Testing Guide](../testing/README.md) to run tests
- Check [Docker Setup](./docker-setup.md) for containerized deployment
- Review [Architecture Documentation](../architecture/README.md) to understand the system design

## Common Issues

### Port Already in Use

If port 3000 is already in use, you can change it:

```bash
PORT=3001 npm run dev
```

### Database Connection Failed

Check your `DATABASE_URL` in `.env`. For local PostgreSQL:

```
DATABASE_URL="postgresql://user:password@localhost:5432/qa_article_faq?schema=public"
```

### Prisma Client Not Generated

Manually regenerate the Prisma client:

```bash
npx prisma generate
```

## Build for Production

To create a production build:

```bash
npm run build
npm start
```

The production server will start on port 3000.
