/** Errors the API layer knows how to translate into HTTP responses. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class BadRequestError extends Error {
  constructor(
    message: string,
    readonly code = "invalid_request",
  ) {
    super(message);
    this.name = "BadRequestError";
  }
}

/** The request is fine but the account or the market cannot do it right now (409). */
export class ConflictError extends Error {
  constructor(
    readonly code: string,
    message: string,
    /** Custom error name decoded from a reverted simulation, for the UI to translate. */
    readonly contractError?: string,
  ) {
    super(message);
    this.name = "ConflictError";
  }
}

/** The request comes from a country where the app is not offered (451). */
export class UnavailableRegionError extends Error {
  constructor() {
    super("Not available in this region");
    this.name = "UnavailableRegionError";
  }
}
