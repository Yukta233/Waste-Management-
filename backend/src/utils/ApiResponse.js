/**
 * Standard API Response format for success responses
 */
class ApiResponse {
    /**
     * Create a new ApiResponse instance
     * @param {number} statusCode - HTTP status code
     * @param {*} data - Response data
     * @param {string} message - Success message
     */
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400;
    }
}

export { ApiResponse };