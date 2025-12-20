# Backend - Cloudflare Workers

Edge-native backend built with Hono.js and Drizzle ORM, inspired by Edge Manifest architecture.

## 🌐 Edge-Native Features

- **Zero Node.js dependencies** - Fully compatible with Cloudflare Workers
- **Web Standards** - Uses Web Crypto API, Fetch API, etc.
- **D1 SQLite** - Serverless database with Drizzle ORM
- **JWT Authentication** - Edge-native implementation
- **Type Safety** - Full TypeScript support

## 🚀 Quick Start

### 1. Setup Database
```bash
# Create D1 database
bun run db:create

# Update wrangler.toml with the database ID from the output

# Generate migrations
bun run db:generate

# Apply migrations locally
bun run db:migrate
```

### 2. Development
```bash
# Start development server
bun run dev

# The API will be available at http://127.0.0.1:8787
```

### 3. Test API
```bash
# Health check
curl http://127.0.0.1:8787/health

# Create a user
curl -X POST http://127.0.0.1:8787/api/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Register and get token
curl -X POST http://127.0.0.1:8787/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","name":"User","password":"password123"}'
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── index.ts           # Worker entry point
│   ├── routes/
│   │   ├── api.ts         # API endpoints
│   │   └── auth.ts        # Authentication routes
│   ├── middleware/
│   │   └── auth.ts        # Auth middleware
│   └── lib/
│       ├── schema.ts      # Database schema
│       └── jwt.ts         # JWT utilities
├── migrations/            # D1 migrations
├── wrangler.toml         # Cloudflare config
├── drizzle.config.ts     # Drizzle ORM config
└── .dev.vars             # Environment variables
```

## 🔧 Configuration

### Environment Variables (.dev.vars)
```bash
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret
DATABASE_ID=your-d1-database-id
ENVIRONMENT=development
```

### Production Secrets
```bash
wrangler secret put JWT_SECRET
wrangler secret put SESSION_SECRET
```

## 🛠️ Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run deploy` - Deploy to Cloudflare Workers
- `bun run db:create` - Create D1 database
- `bun run db:generate` - Generate migrations
- `bun run db:migrate` - Apply migrations locally
- `bun run db:migrate:prod` - Apply migrations to production
- `bun run test` - Run tests
- `bun run type-check` - Type check

## 🔐 Authentication

The backend includes edge-native JWT authentication:

### Register
```bash
POST /auth/register
{
  "email": "user@example.com",
  "name": "User Name",
  "password": "password123"
}
```

### Login
```bash
POST /auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Protected Routes
Add `Authorization: Bearer <token>` header to access protected endpoints.

## 📊 Database Schema

The template includes example entities:

- **Users** - User accounts with roles
- **Posts** - Blog posts with authors
- **Products** - E-commerce products

Extend the schema in `src/lib/schema.ts` and run `bun run db:generate` to create migrations.

## 🚀 Deployment

### 1. Build
```bash
bun run build
```

### 2. Apply Production Migrations
```bash
bun run db:migrate:prod
```

### 3. Deploy
```bash
bun run deploy
```

## 🧪 Testing

```bash
# Run tests
bun run test

# Watch mode
bun run test:watch
```

## 🔍 Debugging

- Check wrangler logs during development
- Use `console.log` for debugging (visible in wrangler dev)
- Test endpoints with curl or Postman
- Use Drizzle Studio: `bun run db:studio`

## 📚 Tech Stack

- **Runtime**: Cloudflare Workers (V8 isolates)
- **Framework**: Hono.js
- **Database**: D1 SQLite + Drizzle ORM
- **Authentication**: Edge-native JWT
- **Validation**: Zod schemas
- **TypeScript**: Full type safety

## 🌟 Edge-Native Benefits

- **Zero cold starts** - V8 isolates start in <1ms
- **Global distribution** - Runs in 300+ locations
- **Web Standards** - No Node.js polyfills needed
- **Scalable** - Handles millions of requests
- **Cost effective** - Pay per request