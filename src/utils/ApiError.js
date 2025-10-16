// ...existing code...
export class ApiError extends Error {
  constructor(
    statusCode = 500,
    message = "Something went wrong",
    errors = null,
    stack = ""
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.message = message;
    this.errors = errors;
    this.data = null;
    this.success = false;
    if (stack) {
      this.stack = stack;
    } else if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
// ...existing code...
