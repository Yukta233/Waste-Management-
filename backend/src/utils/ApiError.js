/**
 * Custom API Error class for consistent error handling
 */
class ApiError extends Error {
    /**
     * Create a new ApiError instance
     * @param {number} statusCode - HTTP status code
     * @param {string} message - Error message
     * @param {Array} errors - Additional error details
     * @param {string} stack - Error stack trace
     */
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export { ApiError };