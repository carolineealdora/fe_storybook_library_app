export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e
  return new ApiError(0, 'NETWORK_ERROR', "We can't reach the library right now. Please try again.")
}
