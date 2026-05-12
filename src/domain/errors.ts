export class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotAuthenticatedError extends DomainError {
  constructor() {
    super('Not authenticated', 'NOT_AUTHENTICATED');
  }
}

export class NotAuthorizedError extends DomainError {
  constructor(missingPermission?: string) {
    super(
      missingPermission ? `Missing permission: ${missingPermission}` : 'Not authorized',
      'NOT_AUTHORIZED',
    );
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    super(`${resource}${id ? ` (${id})` : ''} not found`, 'NOT_FOUND');
  }
}

export class NotSupportedError extends DomainError {
  constructor(feature: string) {
    super(`${feature} is not supported by the active commerce adapter`, 'NOT_SUPPORTED');
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION');
  }
}
