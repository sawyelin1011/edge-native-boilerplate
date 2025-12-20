# Cloudflare Fullstack Template

Production-ready fullstack template for Cloudflare Workers (backend) + Pages (frontend) with type-safe configuration.

## 🏗️ Architecture

- **Backend**: Cloudflare Workers with Hono.js
- **Frontend**: Cloudflare Pages (framework agnostic)
- **Database**: D1 SQLite with Drizzle ORM
- **Storage**: KV for sessions, R2 for files
- **Type Safety**: Shared types between frontend/backend
- **Development**: Miniflare for local development

## 📁 Project Structure

```
cloudflare-fullstack-template/
├── backend/                 # Cloudflare Workers API
│   ├── src/
│   │   ├── index.ts        # Worker entry point
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Auth, CORS, etc.
│   │   ├── lib/           # Database, utilities
│   │   └── types/         # Backend types
│   ├── migrations/        # D1 database migrations
│   ├── wrangler.toml      # Workers configuration
│   ├── drizzle.config.ts  # Drizzle ORM config
│   └── package.json
├── frontend/               # Cloudflare Pages
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # UI components
│   │   ├── lib/          # API client, utilities
│   │   └── types/        # Frontend types
│   ├── public/           # Static assets
│   ├── functions/        # Pages Functions (optional)
│   └── package.json
├── shared/                # Shared types and utilities
│   ├── types/
│   │   ├── api.ts        # API request/response types
│   │   ├── database.ts   # Database schema types
│   │   └── index.ts      # Exported types
│   └── package.json
├── env.d.ts              # Global environment types
└── package.json          # Root workspace
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
# Install all dependencies
bun install

# Or install per workspace
bun install --filter backend
bun install --filter frontend
bun install --filter shared

# Install all at once
bun run install:all
```

### 2. Setup Database
```bash
# Create D1 database
npm run db:create

# Generate and apply migrations
npm run db:generate
npm run db:migrate
```

### 3. Development
```bash
# Start both backend and frontend
bun run dev

# Or start individually
bun run dev:backend
bun run dev:frontend
```

### 4. Deploy
```bash
# Deploy backend (Workers)
bun run deploy:backend

# Deploy frontend (Pages)
bun run deploy:frontend

# Deploy both
bun run deploy
```

## 📋 Available Scripts

### Root Scripts
- `bun run dev` - Start both backend and frontend
- `bun run build` - Build both projects
- `bun run deploy` - Deploy both to Cloudflare
- `bun run type-check` - Type check all workspaces

### Backend Scripts
- `bun run dev:backend` - Start Workers dev server
- `bun run build:backend` - Build Workers
- `bun run deploy:backend` - Deploy to Cloudflare Workers
- `bun run db:create` - Create D1 database
- `bun run db:generate` - Generate migrations
- `bun run db:migrate` - Apply migrations locally
- `bun run db:migrate:prod` - Apply migrations to production

### Frontend Scripts
- `bun run dev:frontend` - Start Pages dev server
- `bun run build:frontend` - Build for production
- `bun run deploy:frontend` - Deploy to Cloudflare Pages

## 🔧 Configuration

### Environment Variables

#### Backend (.dev.vars)
```bash
# Database
DATABASE_ID=your-d1-database-id

# Authentication
JWT_SECRET=your-jwt-secret
SESSION_SECRET=your-session-secret

# External APIs
EXTERNAL_API_KEY=your-api-key
```

#### Production Secrets
```bash
# Set production secrets
wrangler secret put JWT_SECRET
wrangler secret put SESSION_SECRET
wrangler secret put EXTERNAL_API_KEY
```

### Wrangler Configuration

The `wrangler.toml` uses the latest compatibility date and features:
- Compatibility date: 2024-12-21 (latest)
- Node.js compatibility enabled
- D1, KV, R2 bindings configured
- Local development optimized

## 🛠️ Tech Stack

### Backend
- **Runtime**: Cloudflare Workers
- **Framework**: Hono.js
- **Database**: D1 SQLite + Drizzle ORM
- **Storage**: KV (sessions) + R2 (files)
- **Auth**: JWT + Sessions
- **Validation**: Zod schemas

### Frontend
- **Platform**: Cloudflare Pages
- **Framework**: Framework agnostic (React/Vue/Svelte)
- **API Client**: Type-safe fetch wrapper
- **State**: Framework-specific state management

### Development
- **Local Runtime**: Miniflare
- **Type Safety**: TypeScript + shared types
- **Testing**: Vitest
- **Linting**: ESLint + Prettier

## 🔐 Security Features

- JWT authentication with refresh tokens
- CORS configuration
- Rate limiting
- Security headers
- Input validation with Zod
- SQL injection protection (Drizzle ORM)

## 📊 Performance Features

- Edge caching with KV
- Static asset optimization
- Database connection pooling
- Streaming responses
- Compression middleware

## 🧪 Testing

```bash
# Run all tests
bun test

# Test backend
bun run test:backend

# Test frontend
bun run test:frontend
```

## 📚 Documentation

Each workspace has its own README with specific setup instructions:
- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Shared Types README](./shared/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.