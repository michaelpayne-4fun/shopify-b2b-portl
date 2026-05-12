export class DomainError extends Error {
  constructor(message: string, public readonly code: string, public readonly status: number) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotAuthenticatedError extends DomainError {
  constructor() {
    super('Not authenticated', 'NOT_AUTHENTICATED', 401);
  }
}

export class NotAuthorizedError extends DomainError {
  constructor(missing?: string) {
    super(missing ? `Missing permission: ${missing}` : 'Not authorized', 'NOT_AUTHORIZED', 403);
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` (${id})` : ''} not found`, 'NOT_FOUND', 404);
  }
}

export class FeatureDisabledError extends DomainError {
  constructor(feature: string) {
    super(`${feature} is disabled`, 'FEATURE_DISABLED', 404);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION', 400);
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409);
  }
}
