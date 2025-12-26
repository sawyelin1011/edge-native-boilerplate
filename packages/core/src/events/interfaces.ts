// GSMFlow Event System
// Domain events for event sourcing and async processing

import type { DomainEvent } from '../domain/models'

// ============================================================================
// Event Types (Foundation Only)
// ============================================================================

export type GsmFlowEventType =
  | 'tenant.created'
  | 'tenant.updated'
  | 'tenant.suspended'
  | 'tenant.activated'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.suspended'
  | 'user.activated'
  | 'session.created'
  | 'session.revoked'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.register'
  | 'api.request'
  | 'api.response'
  | 'system.health'
  | 'system.error'

// ============================================================================
// Event Payloads
// ============================================================================

export interface TenantCreatedEventPayload {
  readonly tenantId: string
  readonly name: string
  readonly slug: string
  readonly createdBy: string
}

export interface TenantUpdatedEventPayload {
  readonly tenantId: string
  readonly changes: Partial<{
    name: string
    settings: Record<string, unknown>
    status: string
  }>
}

export interface UserCreatedEventPayload {
  readonly userId: string
  readonly tenantId: string
  readonly email: string
  readonly name: string
  readonly role: string
  readonly invitedBy?: string
}

export interface AuthLoginEventPayload {
  readonly userId: string
  readonly tenantId: string
  readonly method: 'password' | 'token' | 'sso'
  readonly success: boolean
  readonly ipAddress?: string
  readonly userAgent?: string
}

export interface ApiRequestEventPayload {
  readonly requestId: string
  readonly method: string
  readonly path: string
  readonly tenantId?: string
  readonly userId?: string
  readonly duration: number
  readonly statusCode: number
}

export interface SystemErrorEventPayload {
  readonly errorId: string
  readonly errorType: string
  readonly message: string
  readonly stack?: string
  readonly context: Record<string, unknown>
}

// ============================================================================
// Event Store Interface
// ============================================================================

export interface EventStore {
  save(events: ReadonlyArray<DomainEvent>): Promise<void>
  load(aggregateId: string, options?: LoadEventsOptions): Promise<ReadonlyArray<DomainEvent>>
  loadByType(eventType: string, options?: LoadEventsOptions): Promise<ReadonlyArray<DomainEvent>>
  getById(eventId: string): Promise<DomainEvent | null>
}

export interface LoadEventsOptions {
  readonly limit?: number
  readonly offset?: number
  readonly since?: Date
  readonly until?: Date
}

// ============================================================================
// Event Publisher Interface
// ============================================================================

export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>
  publishBatch(events: ReadonlyArray<DomainEvent>): Promise<void>
}

// ============================================================================
// Event Subscriber Interface
// ============================================================================

export interface EventSubscriber {
  subscribe(eventType: string, handler: EventHandlerFn): void
  unsubscribe(eventType: string, handler: EventHandlerFn): void
  unsubscribeAll(eventType: string): void
}

// ============================================================================
// Event Bus (Publisher + Subscriber)
// ============================================================================

export interface DomainEventBus extends EventPublisher, EventSubscriber {
  readonly name: string
  getSubscribedTypes(): ReadonlyArray<string>
  isSubscribed(eventType: string, handler: EventHandlerFn): boolean
}

// ============================================================================
// Event Handler Types
// ============================================================================

export type EventHandlerFn = (event: DomainEvent) => Promise<void>

export interface TypedEventHandler {
  eventType: string
  handle: EventHandlerFn
}

// ============================================================================
// Event Factory
// ============================================================================

export interface EventFactory {
  create<T extends GsmFlowEventType>(
    type: T,
    aggregateId: string,
    aggregateType: string,
    payload: EventPayload<T>,
    context?: { userId?: string; correlationId?: string }
  ): DomainEvent
}

export type EventPayloadMap = {
  'tenant.created': TenantCreatedEventPayload
  'tenant.updated': TenantUpdatedEventPayload
  'user.created': UserCreatedEventPayload
  'auth.login': AuthLoginEventPayload
  'api.request': ApiRequestEventPayload
  'system.error': SystemErrorEventPayload
}

export type EventPayload<T extends GsmFlowEventType> = T extends keyof EventPayloadMap
  ? EventPayloadMap[T]
  : Record<string, unknown>
