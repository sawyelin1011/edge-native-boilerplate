// GSMFlow Shared Validation Utilities

import { isValidEmail, isValidUrl, isValidUuid } from './index'

// ============================================================================
// Validation Result
// ============================================================================

export interface ValidationResult<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly errors: ReadonlyArray<ValidationError>
}

export interface ValidationError {
  readonly field: string
  readonly message: string
  readonly code: string
}

// ============================================================================
// Validator Types
// ============================================================================

export type Validator<T = unknown> = (value: unknown) => ValidationResult<T>

// ============================================================================
// Common Validators
// ============================================================================

export const stringValidator: Validator<string> = (value) => {
  if (!isString(value)) {
    return {
      success: false,
      errors: [{ field: 'value', message: 'Expected string', code: 'INVALID_TYPE' }],
    }
  }
  return { success: true, data: value, errors: [] }
}

export const numberValidator: Validator<number> = (value) => {
  if (!isNumber(value)) {
    return {
      success: false,
      errors: [{ field: 'value', message: 'Expected number', code: 'INVALID_TYPE' }],
    }
  }
  return { success: true, data: value, errors: [] }
}

export const booleanValidator: Validator<boolean> = (value) => {
  if (!isBoolean(value)) {
    return {
      success: false,
      errors: [{ field: 'value', message: 'Expected boolean', code: 'INVALID_TYPE' }],
    }
  }
  return { success: true, data: value, errors: [] }
}

export const emailValidator: Validator<string> = (value) => {
  const result = stringValidator(value)
  if (!result.success) return result
  
  if (!isValidEmail(result.data)) {
    return {
      success: false,
      errors: [{ field: 'email', message: 'Invalid email format', code: 'INVALID_EMAIL' }],
    }
  }
  
  return { success: true, data: result.data, errors: [] }
}

export const urlValidator: Validator<string> = (value) => {
  const result = stringValidator(value)
  if (!result.success) return result
  
  if (!isValidUrl(result.data)) {
    return {
      success: false,
      errors: [{ field: 'url', message: 'Invalid URL format', code: 'INVALID_URL' }],
    }
  }
  
  return { success: true, data: result.data, errors: [] }
}

export const uuidValidator: Validator<string> = (value) => {
  const result = stringValidator(value)
  if (!result.success) return result
  
  if (!isValidUuid(result.data)) {
    return {
      success: false,
      errors: [{ field: 'id', message: 'Invalid UUID format', code: 'INVALID_UUID' }],
    }
  }
  
  return { success: true, data: result.data, errors: [] }
}

// ============================================================================
// Object Validator
// ============================================================================

export function objectValidator<T extends Record<string, unknown>>(
  schema: Record<keyof T, Validator>
): Validator<T> {
  return (value) => {
    if (!isObject(value)) {
      return {
        success: false,
        errors: [{ field: 'value', message: 'Expected object', code: 'INVALID_TYPE' }],
      }
    }
    
    const errors: ValidationError[] = []
    const data = {} as T
    
    for (const key of Object.keys(schema) as Array<keyof T>) {
      const validator = schema[key]
      const result = validator(value[key])
      
      if (result.success && result.data !== undefined) {
        data[key] = result.data
      } else if (!result.success) {
        errors.push(...result.errors.map(e => ({ ...e, field: `${String(key)}.${e.field}` })))
      }
    }
    
    if (errors.length > 0) {
      return { success: false, errors }
    }
    
    return { success: true, data, errors: [] }
  }
}

// ============================================================================
// Array Validator
// ============================================================================

export function arrayValidator<T>(
  itemValidator: Validator<T>
): Validator<ReadonlyArray<T>> {
  return (value) => {
    if (!isArray(value)) {
      return {
        success: false,
        errors: [{ field: 'value', message: 'Expected array', code: 'INVALID_TYPE' }],
      }
    }
    
    const errors: ValidationError[] = []
    const data: T[] = []
    
    for (let i = 0; i < value.length; i++) {
      const result = itemValidator(value[i])
      
      if (result.success && result.data !== undefined) {
        data.push(result.data)
      } else if (!result.success) {
        errors.push(...result.errors.map(e => ({ ...e, field: `[${i}].${e.field}` })))
      }
    }
    
    if (errors.length > 0) {
      return { success: false, errors }
    }
    
    return { success: true, data: data as ReadonlyArray<T>, errors: [] }
  }
}

// ============================================================================
// Optional Validator
// ============================================================================

export function optionalValidator<T>(validator: Validator<T>): Validator<T | undefined> {
  return (value) => {
    if (value === undefined || value === null) {
      return { success: true, data: undefined, errors: [] }
    }
    return validator(value)
  }
}

// ============================================================================
// Export
// ============================================================================

export {
  isValidEmail,
  isValidUrl,
  isValidUuid,
}
