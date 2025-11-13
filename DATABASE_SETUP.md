# Database Setup Guide

## Overview

Scribepod uses PostgreSQL as its primary database and Prisma as the ORM layer. This guide will help you set up the database and run migrations.

## Prerequisites

- PostgreSQL 12+ installed and running
- Node.js 18+ installed
- npm or yarn package manager

## Quick Start

### 1. Install PostgreSQL

#### macOS
```bash
brew install postgresql@16
brew services start postgresql@16
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows
Download and install from: https://www.postgresql.org/download/windows/

### 2. Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE scribepod;
CREATE USER scribepod_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE scribepod TO scribepod_user;

# Exit psql
\q
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://scribepod_user:your_secure_password@localhost:5432/scribepod?schema=public"
```

For local development, you can use:
```env
DATABASE_URL="postgresql://localhost:5432/scribepod"
```

### 4. Run Migrations

```bash
# Generate Prisma Client
npm run prisma:generate

# Create initial migration (first time only)
npx prisma migrate dev --name init

# Or apply migrations without creating new ones
npx prisma migrate deploy
```

### 5. Seed Database (Optional)

```bash
# Run seed script to populate with sample data
npm run prisma:seed
```

## Database Schema Overview

### Content Management
- **Content**: Source material (PDFs, articles, books, etc.)
- **Fact**: Extracted facts from content

### Podcast Generation
- **Podcast**: Generated podcast episodes
- **Persona**: Host and guest configurations with personality traits
- **PodcastPersona**: Junction table for podcast-persona relationships
- **Dialogue**: Individual conversation turns
- **AudioSegment**: Generated audio files for each dialogue turn

### Processing
- **ProcessingJob**: Track async job status for fact extraction, dialogue generation, and audio synthesis

## Key Features

### Multi-Persona Podcasts
The schema supports multiple hosts and guests per podcast:
- Each Persona has personality traits (formality, enthusiasm, humor, expertise, interruption)
- Speaking style configuration (sentence length, vocabulary, pace)
- Voice synthesis settings (provider, voice ID, stability)

### Processing Pipeline Tracking
- Track progress through fact extraction → dialogue generation → audio synthesis
- Retry logic with configurable max retries
- Error message capture for debugging

### Comprehensive Metadata
- Timestamps (createdAt, updatedAt, completedAt)
- Progress tracking (0-100%)
- Word counts and duration estimates

## Prisma Commands

### Development

```bash
# Validate schema
npx prisma validate

# Generate Prisma Client (after schema changes)
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name your_migration_name

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (GUI for database)
npx prisma studio
```

### Production

```bash
# Apply migrations in production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

## Common Migration Scenarios

### Adding a New Field

1. Edit `prisma/schema.prisma`
2. Add your new field to the model
3. Run migration:
   ```bash
   npx prisma migrate dev --name add_field_name
   ```

### Changing a Field Type

1. Edit the field in `prisma/schema.prisma`
2. Run migration with data transformation:
   ```bash
   npx prisma migrate dev --name change_field_type
   ```
3. Review the generated migration SQL
4. Add custom SQL for data transformation if needed

### Adding a New Model

1. Add model to `prisma/schema.prisma`
2. Define relationships with existing models
3. Run migration:
   ```bash
   npx prisma migrate dev --name add_model_name
   ```

## Troubleshooting

### Error: "Can't reach database server"

**Solution:**
1. Check PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL in `.env`
3. Check PostgreSQL logs: `tail -f /usr/local/var/log/postgres.log` (macOS)

### Error: "Role does not exist"

**Solution:**
```bash
psql postgres
CREATE USER scribepod_user WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE scribepod TO scribepod_user;
```

### Error: "Database does not exist"

**Solution:**
```bash
psql postgres
CREATE DATABASE scribepod;
```

### Error: "Migration failed"

**Solution:**
1. Check error message in console
2. Review generated migration file in `prisma/migrations/`
3. Fix any syntax errors or constraint violations
4. Reset and try again: `npx prisma migrate reset`

### Error: "Prisma Client not generated"

**Solution:**
```bash
npx prisma generate
```

## Database Backup and Restore

### Backup

```bash
# Backup entire database
pg_dump -U scribepod_user scribepod > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup specific tables
pg_dump -U scribepod_user -t Content -t Podcast scribepod > backup_content_podcasts.sql
```

### Restore

```bash
# Restore from backup
psql -U scribepod_user scribepod < backup_20240101_120000.sql
```

## Performance Optimization

### Indexes

The schema includes indexes on frequently queried fields:
- Content: title, sourceType, createdAt
- Fact: contentId, importance
- Podcast: contentId, status, createdAt
- Persona: name, role
- Dialogue: podcastId, personaId, (podcastId, turnNumber)

### Query Optimization Tips

1. Use `include` selectively to avoid over-fetching
2. Use pagination with `take` and `skip`
3. Use `select` to fetch only needed fields
4. Consider using raw SQL for complex queries

## Database Service Layer

The project includes a comprehensive database service layer at `services/database.ts`:

```typescript
import { db } from './services/database';

// Example: Create content
const content = await db.createContent({
  title: 'My Article',
  sourceType: 'HTML',
  rawText: '...',
  wordCount: 1000,
});

// Example: Create podcast
const podcast = await db.createPodcast({
  title: 'Episode 1',
  contentId: content.id,
  targetLength: 30, // minutes
});

// Example: Health check
const healthy = await db.healthCheck();
```

## Testing

Run database service tests:

```bash
# Requires DATABASE_URL to be set
npx tsx services/database.test.ts
```

## Security Best Practices

1. **Never commit `.env` file** - it contains sensitive credentials
2. **Use strong passwords** for database users
3. **Limit database user permissions** in production
4. **Use connection pooling** for production (Prisma handles this)
5. **Enable SSL** for production databases:
   ```env
   DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
   ```
6. **Regular backups** - automate with cron jobs
7. **Monitor database performance** - use pg_stat_statements

## Production Deployment

### Docker Setup

```dockerfile
# Example docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: scribepod
      POSTGRES_USER: scribepod_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Environment Variables

Production `.env`:
```env
DATABASE_URL="postgresql://user:password@postgres:5432/scribepod?schema=public&connection_limit=10&pool_timeout=20"
NODE_ENV=production
```

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)

## Support

For issues related to:
- **Database schema**: Check `prisma/schema.prisma`
- **Migrations**: Check `prisma/migrations/`
- **Service layer**: Check `services/database.ts`
- **Tests**: Run `npx tsx services/database.test.ts`
