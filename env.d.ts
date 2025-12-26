// Root env.d.ts
/// <reference types="node" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ENVIRONMENT?: 'development' | 'staging' | 'production'
      API_VERSION?: string
    }
  }
}

export {}
