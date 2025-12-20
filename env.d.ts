/// <reference types="@cloudflare/workers-types" />

// Global environment types for the fullstack application

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test'
    }
  }
}

// Cloudflare Workers Environment
export interface Env {
  // D1 Database
  DB: D1Database
  
  // KV Storage
  KV: KVNamespace
  
  // R2 Storage
  BUCKET: R2Bucket
  
  // Environment Variables
  JWT_SECRET: string
  SESSION_SECRET: string
  DATABASE_ID: string
  ENVIRONMENT: 'development' | 'production' | 'staging'
  
  // Optional external services
  EXTERNAL_API_KEY?: string
  WEBHOOK_SECRET?: string
}

// Worker Context Variables
export interface Variables {
  user?: {
    id: string
    email: string
    role: string
  }
  requestId: string
  db: any // Drizzle database instance
}

// API Response Types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
  }
}

// Authentication Types
export interface AuthUser {
  id: string
  email: string
  role: string
  createdAt: string
  updatedAt: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export {}