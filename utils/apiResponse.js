/**
 * Standardized API Response Utilities
 * 
 * This module provides utility functions to create consistent API responses
 * across all endpoints, ensuring proper error handling and data formatting.
 */

const { API_ERROR_CODES, HTTP_STATUS_CODES } = require('../types/api.js');

/**
 * Create a successful API response
 * @param {Object} data - The response data
 * @param {Object} meta - Optional metadata
 * @param {number} statusCode - HTTP status code (default: 200)
 * @returns {Object} Standardized success response
 */
function createSuccessResponse(data, meta = {}, statusCode = 200) {
    const response = {
        success: true,
        data,
        meta: {
            timestamp: new Date().toISOString(),
            ...meta
        }
    };

    return { response, statusCode };
}

/**
 * Create an error API response
 * @param {string} message - Error message
 * @param {string} code - Error code
 * @param {number} statusCode - HTTP status code
 * @param {Object} details - Additional error details
 * @param {string} path - Request path
 * @returns {Object} Standardized error response
 */
function createErrorResponse(message, code, statusCode = 500, details = null, path = null) {
    const response = {
        success: false,
        error: {
            message,
            code,
            timestamp: new Date().toISOString(),
            ...(details && { details }),
            ...(path && { path })
        }
    };

    // Include stack trace only in development
    if (process.env.NODE_ENV !== 'production' && details && details.stack) {
        response.error.stack = details.stack;
    }

    return { response, statusCode };
}

/**
 * Create a paginated response
 * @param {Array} items - Array of items
 * @param {Object} pagination - Pagination metadata
 * @param {Object} meta - Additional metadata
 * @returns {Object} Standardized paginated response
 */
function createPaginatedResponse(items, pagination, meta = {}) {
    return createSuccessResponse(
        {
            items,
            pagination: {
                page: pagination.page || 1,
                limit: pagination.limit || 20,
                hasMore: pagination.hasMore || false,
                total: pagination.total || null,
                ...(pagination.totalPages && { totalPages: pagination.totalPages }),
                ...(pagination.nextCursor && { nextCursor: pagination.nextCursor }),
                ...(pagination.prevCursor && { prevCursor: pagination.prevCursor })
            }
        },
        meta
    );
}

/**
 * Create a search response
 * @param {Array} results - Search results
 * @param {Object} pagination - Pagination metadata
 * @param {Object} searchCriteria - Search criteria used
 * @param {Object} meta - Additional metadata
 * @returns {Object} Standardized search response
 */
function createSearchResponse(results, pagination, searchCriteria, meta = {}) {
    return createSuccessResponse(
        {
            results,
            pagination,
            searchCriteria
        },
        {
            resultsCount: results.length,
            searchTime: new Date().toISOString(),
            ...meta
        }
    );
}

/**
 * Validate required parameters
 * @param {Object} params - Parameters to validate
 * @param {Array} required - Array of required parameter names
 * @returns {Object|null} Error response if validation fails, null if valid
 */
function validateRequiredParams(params, required) {
    const missing = required.filter(param => 
        params[param] === undefined || params[param] === null || params[param] === ''
    );

    if (missing.length > 0) {
        return createErrorResponse(
            `Missing required parameters: ${missing.join(', ')}`,
            API_ERROR_CODES.MISSING_PARAMETER,
            HTTP_STATUS_CODES.BAD_REQUEST,
            { missing_parameters: missing }
        );
    }

    return null;
}

/**
 * Validate parameter types
 * @param {Object} params - Parameters to validate
 * @param {Object} types - Object mapping parameter names to expected types
 * @returns {Object|null} Error response if validation fails, null if valid
 */
function validateParamTypes(params, types) {
    const invalid = [];

    for (const [param, expectedType] of Object.entries(types)) {
        if (params[param] !== undefined) {
            const actualType = typeof params[param];
            
            if (expectedType === 'number' && (isNaN(params[param]) || actualType !== 'number')) {
                invalid.push({ param, expected: expectedType, actual: actualType });
            } else if (expectedType !== 'number' && actualType !== expectedType) {
                invalid.push({ param, expected: expectedType, actual: actualType });
            }
        }
    }

    if (invalid.length > 0) {
        return createErrorResponse(
            'Invalid parameter types',
            API_ERROR_CODES.INVALID_PARAMETER,
            HTTP_STATUS_CODES.BAD_REQUEST,
            { invalid_parameters: invalid }
        );
    }

    return null;
}

/**
 * Validate numeric ranges
 * @param {Object} params - Parameters to validate
 * @param {Object} ranges - Object mapping parameter names to {min, max} objects
 * @returns {Object|null} Error response if validation fails, null if valid
 */
function validateNumericRanges(params, ranges) {
    const invalid = [];

    for (const [param, range] of Object.entries(ranges)) {
        if (params[param] !== undefined) {
            const value = Number(params[param]);
            
            if (range.min !== undefined && value < range.min) {
                invalid.push({ param, value, min: range.min, error: 'below_minimum' });
            }
            
            if (range.max !== undefined && value > range.max) {
                invalid.push({ param, value, max: range.max, error: 'above_maximum' });
            }
        }
    }

    if (invalid.length > 0) {
        return createErrorResponse(
            'Parameter values out of range',
            API_ERROR_CODES.INVALID_PARAMETER,
            HTTP_STATUS_CODES.BAD_REQUEST,
            { range_violations: invalid }
        );
    }

    return null;
}

/**
 * Standardized error handler for database operations
 * @param {Error} error - Database error
 * @param {string} operation - Description of the operation
 * @returns {Object} Error response
 */
function handleDatabaseError(error, operation = 'database operation') {
    console.error(`Database error during ${operation}:`, {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });

    return createErrorResponse(
        `Database error during ${operation}`,
        API_ERROR_CODES.DATABASE_ERROR,
        HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        { operation, originalError: error.message }
    );
}

/**
 * Express middleware to send standardized responses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
function responseMiddleware(req, res, next) {
    // Add helper methods to response object
    res.success = (data, meta = {}, statusCode = 200) => {
        const { response, statusCode: code } = createSuccessResponse(data, meta, statusCode);
        res.status(code).json(response);
    };

    res.error = (message, code, statusCode = 500, details = null) => {
        const { response, statusCode: responseCode } = createErrorResponse(
            message, 
            code, 
            statusCode, 
            details, 
            req.path
        );
        res.status(responseCode).json(response);
    };

    res.paginated = (items, pagination, meta = {}) => {
        const { response, statusCode } = createPaginatedResponse(items, pagination, meta);
        res.status(statusCode).json(response);
    };

    res.search = (results, pagination, searchCriteria, meta = {}) => {
        const { response, statusCode } = createSearchResponse(results, pagination, searchCriteria, meta);
        res.status(statusCode).json(response);
    };

    next();
}

/**
 * Input sanitization utilities
 */
const sanitizers = {
    /**
     * Sanitize string input
     * @param {string} input - Input string
     * @param {Object} options - Sanitization options
     * @returns {string} Sanitized string
     */
    string: (input, options = {}) => {
        if (typeof input !== 'string') return '';
        
        let sanitized = input.trim();
        
        if (options.maxLength) {
            sanitized = sanitized.substring(0, options.maxLength);
        }
        
        if (options.allowedChars) {
            const regex = new RegExp(`[^${options.allowedChars}]`, 'g');
            sanitized = sanitized.replace(regex, '');
        }
        
        return sanitized;
    },

    /**
     * Sanitize numeric input
     * @param {any} input - Input value
     * @param {Object} options - Sanitization options
     * @returns {number|null} Sanitized number or null if invalid
     */
    number: (input, options = {}) => {
        const num = Number(input);
        
        if (isNaN(num)) return null;
        
        if (options.min !== undefined && num < options.min) return options.min;
        if (options.max !== undefined && num > options.max) return options.max;
        if (options.integer) return Math.round(num);
        
        return num;
    },

    /**
     * Sanitize boolean input
     * @param {any} input - Input value
     * @returns {boolean} Sanitized boolean
     */
    boolean: (input) => {
        if (typeof input === 'boolean') return input;
        if (typeof input === 'string') {
            return input.toLowerCase() === 'true' || input === '1';
        }
        return Boolean(input);
    }
};

/**
 * Performance monitoring utility
 * @param {string} operation - Operation name
 * @returns {Function} Function to end timing
 */
function startTiming(operation) {
    const start = Date.now();
    
    return () => {
        const duration = Date.now() - start;
        console.log(`Performance: ${operation} took ${duration}ms`);
        return duration;
    };
}

/**
 * Rate limiting check (basic implementation)
 * @param {string} key - Rate limiting key (IP, user ID, etc.)
 * @param {number} limit - Requests per window
 * @param {number} window - Time window in seconds
 * @returns {Object|null} Error response if rate limited, null if allowed
 */
function checkRateLimit(key, limit = 100, window = 60) {
    // This is a basic in-memory implementation
    // In production, use Redis or similar
    if (!global.rateLimitStore) {
        global.rateLimitStore = new Map();
    }

    const now = Date.now();
    const windowStart = now - (window * 1000);

    // Clean old entries
    const entry = global.rateLimitStore.get(key);
    if (entry) {
        entry.requests = entry.requests.filter(time => time > windowStart);
    }

    // Check current count
    const currentEntry = global.rateLimitStore.get(key) || { requests: [] };
    
    if (currentEntry.requests.length >= limit) {
        return createErrorResponse(
            'Rate limit exceeded',
            API_ERROR_CODES.RATE_LIMIT_EXCEEDED,
            HTTP_STATUS_CODES.TOO_MANY_REQUESTS,
            { 
                limit, 
                window,
                reset_time: new Date(windowStart + (window * 1000)).toISOString()
            }
        );
    }

    // Add current request
    currentEntry.requests.push(now);
    global.rateLimitStore.set(key, currentEntry);

    return null;
}

module.exports = {
    createSuccessResponse,
    createErrorResponse,
    createPaginatedResponse,
    createSearchResponse,
    validateRequiredParams,
    validateParamTypes,
    validateNumericRanges,
    handleDatabaseError,
    responseMiddleware,
    sanitizers,
    startTiming,
    checkRateLimit,
    API_ERROR_CODES: require('../types/api.js').API_ERROR_CODES,
    HTTP_STATUS_CODES: require('../types/api.js').HTTP_STATUS_CODES
};