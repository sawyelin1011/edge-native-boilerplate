// ============================================================================
// Service & Provider Domain Models
// Pluggable provider architecture with flexible service types
// ============================================================================

// ============================================================================
// Service Models
// ============================================================================

export interface Service {
  readonly id: string
  readonly tenantId: string
  readonly name: string
  readonly slug: string
  readonly description: string
  readonly type: ServiceType
  readonly category: ServiceCategory
  readonly status: ServiceStatus
  readonly pricing: ServicePricing
  readonly metadata: ServiceMetadata
  readonly providerId?: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type ServiceType =
  | 'imei'
  | 'remote_file'
  | 'server_task'
  | 'digital_service'
  | 'api_proxy'
  | 'custom'

export type ServiceCategory =
  | 'verification'
  | 'data'
  | 'processing'
  | 'automation'
  | 'integration'
  | 'other'

export type ServiceStatus = 'active' | 'inactive' | 'maintenance' | 'deprecated'

export interface ServicePricing {
  readonly currency: string
  readonly basePrice: number
  readonly providerPrice?: number
  readonly markupType: MarkupType
  readonly markupValue: number
  readonly finalPrice: number
  readonly minPrice?: number
  readonly maxPrice?: number
}

export type MarkupType = 'fixed' | 'percentage'

export interface ServiceMetadata {
  readonly iconUrl?: string
  readonly instructions?: string
  readonly inputFormat?: string
  readonly outputFormat?: string
  readonly timeoutSeconds?: number
  readonly retryPolicy?: RetryPolicy
  readonly webhookConfig?: WebhookConfig
}

export interface RetryPolicy {
  readonly maxRetries: number
  readonly delayMs: number
  readonly backoffMultiplier: number
}

export interface WebhookConfig {
  readonly url: string
  readonly secret: string
  readonly events: ReadonlyArray<string>
  readonly headers?: Record<string, string>
}

// ============================================================================
// Provider Models
// ============================================================================

export interface Provider {
  readonly id: string
  readonly tenantId?: string  // Optional - null for global providers
  readonly name: string
  readonly slug: string
  readonly type: ProviderType
  readonly status: ProviderStatus
  readonly apiConfig: ProviderApiConfig
  readonly pricing: ProviderPricing
  readonly syncConfig: ProviderSyncConfig
  readonly capabilities: ProviderCapabilities
  readonly metadata: ProviderMetadata
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type ProviderType =
  | 'imei_api'
  | 'file_hosting'
  | 'task_runner'
  | 'custom_api'
  | 'database'

export type ProviderStatus = 'active' | 'inactive' | 'testing' | 'error'

export interface ProviderApiConfig {
  readonly baseUrl: string
  readonly authType: ProviderAuthType
  readonly credentials: ProviderCredentials
  readonly headers?: Record<string, string>
  readonly timeout: number
  readonly retries: number
}

export type ProviderAuthType = 'none' | 'api_key' | 'oauth2' | 'basic' | 'bearer'

export interface ProviderCredentials {
  readonly apiKey?: string
  readonly apiSecret?: string
  readonly accessToken?: string
  readonly refreshToken?: string
  readonly tokenExpiresAt?: Date
  readonly username?: string
  readonly password?: string
}

export interface ProviderPricing {
  readonly currency: string
  readonly baseMarkup: number
  readonly perUnitPricing: boolean
  readonly minimumPrice: number
  readonly volumeDiscounts?: ReadonlyArray<VolumeDiscount>
}

export interface VolumeDiscount {
  readonly minQuantity: number
  readonly maxQuantity?: number
  readonly discountPercent: number
}

export interface ProviderSyncConfig {
  readonly mode: ProviderSyncMode
  readonly intervalSeconds?: number
  readonly webhookUrl?: string
  readonly webhookSecret?: string
  readonly pollingSchedule?: string  // Cron expression
}

export type ProviderSyncMode = 'manual' | 'api' | 'webhook' | 'polling'

export interface ProviderCapabilities {
  readonly imeiFormats?: ReadonlyArray<string>
  readonly fileTypes?: ReadonlyArray<string>
  readonly maxFileSize?: number
  readonly supportedCountries?: ReadonlyArray<string>
  readonly features: ReadonlyArray<ProviderFeature>
}

export type ProviderFeature =
  | 'status_check'
  | 'bulk_orders'
  | 'webhooks'
  | 'refunds'
  | 'priority_queue'
  | 'custom_fields'

export interface ProviderMetadata {
  readonly documentationUrl?: string
  readonly supportEmail?: string
  readonly testMode: boolean
  readonly testCredentials?: ProviderCredentials
}

// ============================================================================
// Provider Service Mapping
// ============================================================================

export interface ProviderService {
  readonly id: string
  readonly providerId: string
  readonly serviceId: string
  readonly tenantId: string
  readonly mappingConfig: ProviderServiceMapping
  readonly status: 'active' | 'inactive'
  readonly createdAt: Date
}

export interface ProviderServiceMapping {
  readonly inputMapping: Record<string, string>
  readonly outputMapping: Record<string, string>
  readonly fieldTransformations?: FieldTransformation[]
  readonly customLogic?: string
}

export interface FieldTransformation {
  readonly inputField: string
  readonly outputField: string
  readonly transform: 'passthrough' | 'uppercase' | 'lowercase' | 'json_parse' | 'json_stringify' | 'custom'
  readonly customFunction?: string
}

// ============================================================================
// Provider API Response Types
// ============================================================================

export interface ProviderResponse<T = unknown> {
  success: boolean
  data?: T
  error?: ProviderError
  metadata: ProviderResponseMetadata
}

export interface ProviderError {
  readonly code: string
  readonly message: string
  readonly details?: Record<string, unknown>
}

export interface ProviderResponseMetadata {
  readonly requestId: string
  readonly timestamp: Date
  readonly duration: number
}

// ============================================================================
// Service Order Request (for IMEI, file processing, etc.)
// ============================================================================

export interface ServiceOrder {
  readonly id: string
  readonly tenantId: string
  readonly serviceId: string
  readonly providerId?: string
  readonly userId: string
  readonly status: ServiceOrderStatus
  readonly input: ServiceOrderInput
  readonly output?: ServiceOrderOutput
  readonly pricing: ServiceOrderPricing
  readonly attempts: number
  readonly maxAttempts: number
  readonly nextAttemptAt?: Date
  readonly completedAt?: Date
  readonly metadata: ServiceOrderMetadata
  readonly createdAt: Date
  readonly updatedAt: Date
}

export type ServiceOrderStatus =
  | 'pending'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded'

export interface ServiceOrderInput {
  readonly type: string
  readonly data: Record<string, unknown>
  readonly format?: string
}

export interface ServiceOrderOutput {
  readonly status: 'success' | 'failed' | 'partial'
  readonly data: Record<string, unknown>
  readonly rawResponse?: unknown
  readonly errorMessage?: string
  readonly errorCode?: string
}

export interface ServiceOrderPricing {
  readonly basePrice: number
  readonly markup: number
  readonly finalPrice: number
  readonly currency: string
}

export interface ServiceOrderMetadata {
  readonly reference?: string
  readonly notes?: string
  readonly priority?: 'low' | 'normal' | 'high' | 'urgent'
  readonly callbackUrl?: string
  readonly customFields?: Record<string, unknown>
}
