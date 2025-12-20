# 🚀 Cloudflare Workers Backend Template - AI Agent Prompt

This is a comprehensive prompt for AI agents to build production-ready, secure, and scalable backends using Cloudflare Workers. Use this template to create professional APIs for any project without starting from scratch.

## 🎯 Template Overview

This template provides a **production-ready Cloudflare Workers backend** with:

- **🔐 Authentication System** - JWT-based auth with pluggable providers
- **🗄️ Database** - D1 SQLite with Drizzle ORM
- **💾 Session Management** - KV storage for sessions
- **🖼️ File Storage** - R2 for images and files (optional)
- **🌐 Edge-Native** - Zero Node.js dependencies, fully edge-optimized
- **🛡️ Security** - CORS, rate limiting, input validation
- **📊 Type Safety** - Full TypeScript with shared types
- **⚡ Performance** - Global edge deployment, zero cold starts

## 🏗️ Architecture Pattern

```
Backend (Cloudflare Workers)
├── Authentication Layer (JWT + Sessions)
├── API Routes (CRUD + Custom)
├── Database Layer (D1 + Drizzle ORM)
├── Storage Layer (KV + R2)
├── Security Layer (CORS + Validation)
└── Shared Types (Frontend Integration)
```

## 📋 AI Agent Instructions

When building a backend with this template, follow these steps:

### 1. 🎯 Project Analysis
```
Analyze the project requirements:
- What type of application? (e-commerce, CMS, SaaS, etc.)
- What entities/models are needed?
- What authentication method? (JWT, OAuth, API keys)
- What file storage needs? (images, documents, etc.)
- What external integrations? (payments, email, etc.)
```

### 2. 🗄️ Database Schema Design
```typescript
// Define entities in src/lib/schema.ts
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull().default('user'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString())
})

// Add your domain-specific entities
export const posts = sqliteTable('posts', {
  // Define fields based on requirements
})
```

### 3. 🔐 Authentication Configuration
```typescript
// Choose authentication strategy:

// Option A: JWT Only (stateless)
const authConfig = {
  type: 'jwt',
  secret: 'JWT_SECRET',
  expiry: '24h'
}

// Option B: JWT + Sessions (stateful)
const authConfig = {
  type: 'jwt-session',
  jwtSecret: 'JWT_SECRET',
  sessionStore: 'KV',
  sessionExpiry: 86400
}

// Option C: API Keys (for APIs)
const authConfig = {
  type: 'api-key',
  keyStore: 'KV',
  permissions: ['read', 'write', 'admin']
}
```

### 4. 🛣️ API Routes Structure
```typescript
// Follow RESTful patterns in src/routes/
app.get('/api/users', listUsers)           // GET /api/users
app.post('/api/users', createUser)         // POST /api/users
app.get('/api/users/:id', getUser)         // GET /api/users/123
app.patch('/api/users/:id', updateUser)    // PATCH /api/users/123
app.delete('/api/users/:id', deleteUser)   // DELETE /api/users/123

// Add custom business logic routes
app.post('/api/users/:id/reset-password', resetPassword)
app.get('/api/analytics/dashboard', getDashboard)
```

### 5. 🔒 Security Implementation
```typescript
// Input validation with Zod
const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user']).default('user')
})

// Rate limiting
const rateLimiter = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  keyGenerator: (c) => c.req.header('cf-connecting-ip') || 'anonymous'
}

// CORS configuration
const corsConfig = {
  origin: ['https://yourdomain.com'],
  credentials: true,
  maxAge: 86400
}
```

### 6. 📁 File Storage (Optional)
```typescript
// R2 file upload handler
app.post('/api/upload', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file') as File
  
  const key = `uploads/${crypto.randomUUID()}-${file.name}`
  await c.env.BUCKET.put(key, file.stream())
  
  return c.json({ url: `/api/files/${key}` })
})

// File serving
app.get('/api/files/:key', async (c) => {
  const key = c.req.param('key')
  const object = await c.env.BUCKET.get(key)
  
  if (!object) return c.notFound()
  
  return new Response(object.body, {
    headers: { 'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream' }
  })
})
```

## 🔧 Configuration Templates

### Basic SaaS Backend
```yaml
# Use for: User management, subscriptions, teams
entities:
  - User (id, email, name, role, subscription)
  - Organization (id, name, plan, users)
  - Project (id, name, organizationId, settings)
  - ApiKey (id, userId, permissions, rateLimit)

auth: JWT + Sessions
storage: KV (sessions), R2 (avatars)
features: Multi-tenant, role-based access
```

### E-commerce Backend
```yaml
# Use for: Online stores, marketplaces
entities:
  - User (id, email, name, role)
  - Product (id, name, price, inventory)
  - Order (id, userId, items, status, total)
  - Payment (id, orderId, amount, status)

auth: JWT + Sessions
storage: KV (cart), R2 (product images)
features: Inventory, payments, order tracking
```

### Content Management System
```yaml
# Use for: Blogs, documentation, news sites
entities:
  - User (id, email, name, role)
  - Post (id, title, content, authorId, status)
  - Category (id, name, slug, description)
  - Media (id, filename, url, type, size)

auth: JWT + Sessions
storage: KV (cache), R2 (media files)
features: Publishing workflow, media management
```

### API Service Backend
```yaml
# Use for: Microservices, API-first applications
entities:
  - ApiKey (id, name, permissions, rateLimit)
  - Usage (id, apiKeyId, endpoint, count, date)
  - Webhook (id, url, events, secret)

auth: API Keys only
storage: KV (rate limiting), R2 (logs)
features: Rate limiting, usage analytics, webhooks
```

## 🛡️ Security Checklist

### ✅ Authentication & Authorization
- [ ] JWT tokens with proper expiration
- [ ] Password hashing (use Web Crypto API)
- [ ] Role-based access control (RBAC)
- [ ] API key management (if needed)
- [ ] Session management with KV
- [ ] Refresh token rotation

### ✅ Input Validation & Sanitization
- [ ] Zod schemas for all inputs
- [ ] SQL injection prevention (Drizzle ORM)
- [ ] XSS prevention (proper encoding)
- [ ] File upload validation (type, size)
- [ ] Rate limiting per IP/user
- [ ] Request size limits

### ✅ Security Headers & CORS
- [ ] Proper CORS configuration
- [ ] Security headers (CSP, HSTS, etc.)
- [ ] Request ID tracking
- [ ] Error handling (no sensitive data leaks)
- [ ] Logging and monitoring

### ✅ Production Configuration
- [ ] Environment variables for secrets
- [ ] Database connection pooling
- [ ] Caching strategy (KV)
- [ ] Error boundaries
- [ ] Health check endpoints

## 🚀 Deployment Checklist

### ✅ Pre-deployment
- [ ] All TypeScript errors resolved
- [ ] Database migrations created and tested
- [ ] Environment variables configured
- [ ] Security headers implemented
- [ ] Rate limiting configured
- [ ] CORS properly set up

### ✅ Production Deployment
```bash
# 1. Set production secrets
wrangler secret put JWT_SECRET
wrangler secret put DATABASE_URL
wrangler secret put EXTERNAL_API_KEY

# 2. Apply database migrations
bun run db:migrate:prod

# 3. Deploy to Cloudflare Workers
bun run deploy

# 4. Test production endpoints
curl https://your-worker.workers.dev/health
```

### ✅ Post-deployment
- [ ] Health check endpoint responding
- [ ] Database connectivity verified
- [ ] Authentication flow tested
- [ ] File uploads working (if applicable)
- [ ] Error monitoring set up
- [ ] Performance monitoring enabled

## 🔌 Plugin System for Auth Providers

### JWT Provider (Default)
```typescript
// src/lib/auth/jwt-provider.ts
export class JWTAuthProvider {
  async authenticate(token: string): Promise<User | null> {
    return await verifyJWT(token, secret)
  }
  
  async createToken(user: User): Promise<string> {
    return await createJWT(user, secret)
  }
}
```

### OAuth Provider (Google, GitHub, etc.)
```typescript
// src/lib/auth/oauth-provider.ts
export class OAuthProvider {
  async authenticate(code: string): Promise<User | null> {
    // Exchange code for token with OAuth provider
    // Create or update user in database
    // Return user object
  }
}
```

### API Key Provider
```typescript
// src/lib/auth/apikey-provider.ts
export class APIKeyProvider {
  async authenticate(apiKey: string): Promise<User | null> {
    // Validate API key from KV store
    // Check rate limits
    // Return user/permissions
  }
}
```

## 📊 Performance Optimization

### ✅ Edge Optimization
- [ ] Use Web Standards APIs only
- [ ] Minimize bundle size
- [ ] Implement caching with KV
- [ ] Use streaming for large responses
- [ ] Optimize database queries

### ✅ Caching Strategy
```typescript
// Cache frequently accessed data
const cacheKey = `user:${userId}`
const cached = await c.env.KV.get(cacheKey)

if (cached) {
  return c.json(JSON.parse(cached))
}

const user = await db.select().from(users).where(eq(users.id, userId))
await c.env.KV.put(cacheKey, JSON.stringify(user), { expirationTtl: 300 })
```

## 🧪 Testing Strategy

### Unit Tests
```typescript
// Test business logic
describe('User Service', () => {
  it('should create user with valid data', async () => {
    const user = await createUser({ email: 'test@example.com', name: 'Test' })
    expect(user.id).toBeDefined()
    expect(user.email).toBe('test@example.com')
  })
})
```

### Integration Tests
```typescript
// Test API endpoints
describe('API Endpoints', () => {
  it('should return 401 for protected routes without auth', async () => {
    const response = await app.request('/api/users')
    expect(response.status).toBe(401)
  })
})
```

## 📚 Common Patterns

### Pagination
```typescript
const limit = Math.min(Number(c.req.query('limit')) || 20, 100)
const offset = Number(c.req.query('offset')) || 0

const items = await db.select().from(table).limit(limit).offset(offset)
const total = await db.select({ count: sql`count(*)` }).from(table)

return c.json({
  data: items,
  meta: { total: total[0].count, limit, offset }
})
```

### Error Handling
```typescript
app.onError((err, c) => {
  console.error('Error:', err)
  
  if (err instanceof z.ZodError) {
    return c.json({ error: 'Validation failed', details: err.errors }, 400)
  }
  
  return c.json({ 
    error: 'Internal Server Error',
    requestId: c.get('requestId')
  }, 500)
})
```

### Middleware Pattern
```typescript
const requireAuth = createMiddleware(async (c, next) => {
  const user = await authenticateRequest(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  c.set('user', user)
  await next()
})

app.get('/api/protected', requireAuth, handler)
```

## 🎯 Success Criteria

A successful backend implementation should have:

- ✅ **Zero cold starts** - Edge-native, no Node.js dependencies
- ✅ **Type safety** - Full TypeScript coverage
- ✅ **Security** - Authentication, validation, CORS
- ✅ **Performance** - <100ms response times globally
- ✅ **Scalability** - Handles millions of requests
- ✅ **Maintainability** - Clean code, proper structure
- ✅ **Monitoring** - Health checks, error tracking
- ✅ **Documentation** - API docs, deployment guide

## 🚀 Quick Start Commands

```bash
# 1. Clone template
git clone <template-repo> my-backend
cd my-backend

# 2. Install dependencies
bun install

# 3. Setup database
bun run db:create
bun run db:migrate

# 4. Start development
bun run dev

# 5. Test API
curl http://127.0.0.1:8787/health

# 6. Deploy to production
bun run deploy
```

---

**This template enables rapid development of production-ready Cloudflare Workers backends for any use case - from simple APIs to complex business applications. Follow the patterns, implement the security measures, and deploy with confidence!** 🚀