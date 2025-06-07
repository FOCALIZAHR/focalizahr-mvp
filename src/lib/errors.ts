// src/lib/errors.ts
// Custom error classes for better error handling
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class BusinessRuleError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message)
    this.name = 'BusinessRuleError'
  }
}

export class NotFoundError extends Error {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` with id ${id}` : ''} not found`)
    this.name = 'NotFoundError'
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string = 'Unauthorized access') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

// Error response helper
export function createErrorResponse(
  error: Error, 
  defaultStatus: number = 500
): Response {
  let status = defaultStatus
  let code = 'INTERNAL_ERROR'

  if (error instanceof ValidationError) {
    status = 400
    code = 'VALIDATION_ERROR'
  } else if (error instanceof BusinessRuleError) {
    status = 409
    code = error.code
  } else if (error instanceof NotFoundError) {
    status = 404
    code = 'NOT_FOUND'
  } else if (error instanceof UnauthorizedError) {
    status = 401
    code = 'UNAUTHORIZED'
  }

  return new Response(
    JSON.stringify({
      error: error.message,
      code,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}