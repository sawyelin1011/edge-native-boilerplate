# Shared Types and Utilities

This package contains shared types, interfaces, and utilities used by both the backend (Cloudflare Workers) and frontend (Cloudflare Pages) applications.

## 📦 What's Included

### Types
- **API Response Types** - Standardized response formats
- **Authentication Types** - User, tokens, login/register requests
- **Entity Types** - Database entity interfaces (User, Post, Product)
- **Request Types** - API request payloads
- **Error Types** - Standardized error formats

### Constants
- **API Endpoints** - Centralized endpoint definitions
- **Pagination** - Default page sizes and limits
- **Roles** - User role definitions

### Utilities
- **Type Guards** - Runtime type checking
- **Validation Helpers** - Common validation functions

## 🚀 Usage

### In Backend (Workers)
```typescript
import type { ApiResponse, CreateUserRequest } from 'shared'

// Use in API handlers
const response: ApiResponse<User> = {
  data: newUser,
  meta: { total: 1 }
}
```

### In Frontend (Pages)
```typescript
import type { User, ApiResponse } from 'shared'
import { API_ENDPOINTS } from 'shared'

// Use in API calls
const response = await fetch(API_ENDPOINTS.USERS)
const data: ApiResponse<User[]> = await response.json()
```

## 🔧 Development

### Build
```bash
bun run build
```

### Type Check
```bash
bun run type-check
```

## 📁 Structure

```
shared/
├── src/
│   └── index.ts          # All shared types and utilities
├── package.json
├── tsconfig.json
└── README.md
```

## 🎯 Benefits

- **Type Safety** - Shared types ensure consistency between frontend and backend
- **DRY Principle** - No duplicate type definitions
- **Centralized** - Single source of truth for API contracts
- **Maintainable** - Changes in one place update both applications

## 📚 Type Categories

### API Types
- `ApiResponse<T>` - Standard API response wrapper
- `ApiError` - Error response format
- `PaginatedResponse<T>` - Paginated data responses

### Entity Types
- `User` - User entity from database
- `Post` - Blog post entity
- `Product` - Product entity

### Request Types
- `CreateUserRequest` - User creation payload
- `LoginRequest` - Authentication payload
- `RegisterRequest` - User registration payload

### Auth Types
- `AuthUser` - Authenticated user data
- `AuthTokens` - JWT token response
- `Role` - User role enum

This shared package ensures type safety and consistency across the entire fullstack application.