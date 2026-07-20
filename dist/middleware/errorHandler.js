"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const environment_1 = require("../config/environment");
class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
const errorHandler = (err, _req, res, _next) => {
    console.error('Error:', {
        name: err.name,
        message: err.message,
        stack: environment_1.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
        return;
    }
    // Handle specific error types
    if (err.name === 'JsonWebTokenError') {
        res.status(401).json({
            success: false,
            error: 'Invalid token.',
        });
        return;
    }
    if (err.name === 'TokenExpiredError') {
        res.status(401).json({
            success: false,
            error: 'Token has expired.',
        });
        return;
    }
    if (err.name === 'SyntaxError' && 'body' in err) {
        res.status(400).json({
            success: false,
            error: 'Invalid JSON in request body.',
        });
        return;
    }
    // Generic server error
    const statusCode = 500;
    const message = environment_1.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred. Please try again later.'
        : err.message;
    res.status(statusCode).json({
        success: false,
        error: message,
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map