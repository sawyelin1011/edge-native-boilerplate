export type Environment = 'development' | 'test' | 'production'

export type Role = 'user' | 'admin'

export type ApiError = {
  code: string
  message: string
  details?: unknown
}

export type ApiSuccessResponse<T> = {
  success: true
  data: T
  meta?: Record<string, unknown>
  requestId?: string
}

export type ApiErrorResponse = {
  success: false
  error: ApiError
  requestId?: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export type PublicUser = {
  id: string
  email: string
  name: string
  role: Role
  createdAt: string
  updatedAt: string
}

export type RegisterRequest = {
  email: string
  name: string
  password: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
  expiresInSeconds: number
}
