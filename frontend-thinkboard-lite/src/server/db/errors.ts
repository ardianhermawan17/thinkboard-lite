// The typed vocabulary the route layer maps to HTTP. A service raises one of these; the route turns it into a
// status without ever inspecting domain state (RULE-22).

export class UnauthorizedError extends Error {
  constructor(message = "missing or invalid credentials") {
    super(message)
    this.name = "UnauthorizedError"
  }
}

export class ForbiddenError extends Error {
  constructor(message = "forbidden") {
    super(message)
    this.name = "ForbiddenError"
  }
}

export class NotFoundError extends Error {
  constructor(message = "not found") {
    super(message)
    this.name = "NotFoundError"
  }
}

export class ValidationError extends Error {
  constructor(message = "invalid request") {
    super(message)
    this.name = "ValidationError"
  }
}

export function httpStatusFor(error: unknown): number {
  if (error instanceof UnauthorizedError) return 401
  if (error instanceof ForbiddenError) return 403
  if (error instanceof NotFoundError) return 404
  if (error instanceof ValidationError) return 400
  return 500
}

/** The only thing a route returns about an error: its status and a message. Never a stack, never a row. */
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "internal error"
}
