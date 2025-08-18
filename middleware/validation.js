/**
 * Validation Middleware for Nvestiv API
 * 
 * Provides comprehensive input validation for all API endpoints
 */

const { 
    API_ERROR_CODES, 
    HTTP_STATUS_CODES, 
    VALIDATION_SCHEMAS 
} = require('../types/api.js');

/**
 * Validate request parameters against a schema
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware function
 */
function validateParams(schema) {
    return (req, res, next) => {
        const errors = [];
        const warnings = [];
        const sanitized = {};

        // Combine query, params, and body for validation
        const allParams = { ...req.query, ...req.params, ...req.body };

        for (const [paramName, rules] of Object.entries(schema)) {
            const value = allParams[paramName];
            
            // Check required fields
            if (rules.required && (value === undefined || value === null || value === '')) {
                errors.push({
                    field: paramName,
                    message: `${paramName} is required`,
                    code: 'REQUIRED_FIELD_MISSING'
                });
                continue;
            }

            // Skip validation if field is not provided and not required
            if (value === undefined || value === null || value === '') {
                if (rules.default !== undefined) {
                    sanitized[paramName] = rules.default;
                }
                continue;
            }

            // Type validation and conversion
            let sanitizedValue = value;
            
            switch (rules.type) {
                case 'number':
                    sanitizedValue = Number(value);
                    if (isNaN(sanitizedValue)) {
                        errors.push({
                            field: paramName,
                            message: `${paramName} must be a valid number`,
                            code: 'INVALID_NUMBER',
                            provided: value
                        });
                        continue;
                    }
                    
                    // Integer validation
                    if (rules.integer && !Number.isInteger(sanitizedValue)) {
                        sanitizedValue = Math.round(sanitizedValue);
                        warnings.push({
                            field: paramName,
                            message: `${paramName} rounded to nearest integer`,
                            original: value,
                            sanitized: sanitizedValue
                        });
                    }
                    
                    // Range validation
                    if (rules.min !== undefined && sanitizedValue < rules.min) {
                        errors.push({
                            field: paramName,
                            message: `${paramName} must be at least ${rules.min}`,
                            code: 'VALUE_TOO_SMALL',
                            provided: sanitizedValue,
                            minimum: rules.min
                        });
                        continue;
                    }
                    
                    if (rules.max !== undefined && sanitizedValue > rules.max) {
                        errors.push({
                            field: paramName,
                            message: `${paramName} must be at most ${rules.max}`,
                            code: 'VALUE_TOO_LARGE',
                            provided: sanitizedValue,
                            maximum: rules.max
                        });
                        continue;
                    }
                    break;

                case 'string':
                    sanitizedValue = String(value).trim();
                    
                    // Length validation
                    if (rules.minLength && sanitizedValue.length < rules.minLength) {
                        errors.push({
                            field: paramName,
                            message: `${paramName} must be at least ${rules.minLength} characters`,
                            code: 'STRING_TOO_SHORT',
                            provided_length: sanitizedValue.length,
                            minimum_length: rules.minLength
                        });
                        continue;
                    }
                    
                    if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
                        sanitizedValue = sanitizedValue.substring(0, rules.maxLength);
                        warnings.push({
                            field: paramName,
                            message: `${paramName} truncated to ${rules.maxLength} characters`,
                            original_length: String(value).length,
                            truncated_length: rules.maxLength
                        });
                    }
                    
                    // Enum validation
                    if (rules.enum && !rules.enum.includes(sanitizedValue)) {
                        errors.push({
                            field: paramName,
                            message: `${paramName} must be one of: ${rules.enum.join(', ')}`,
                            code: 'INVALID_ENUM_VALUE',
                            provided: sanitizedValue,
                            valid_values: rules.enum
                        });
                        continue;
                    }
                    
                    // Pattern validation
                    if (rules.pattern && !rules.pattern.test(sanitizedValue)) {
                        errors.push({
                            field: paramName,
                            message: `${paramName} format is invalid`,
                            code: 'INVALID_FORMAT',
                            provided: sanitizedValue
                        });
                        continue;
                    }
                    break;

                case 'boolean':
                    if (typeof value === 'boolean') {
                        sanitizedValue = value;
                    } else if (typeof value === 'string') {
                        const lowerValue = value.toLowerCase();
                        if (['true', '1', 'yes', 'on'].includes(lowerValue)) {
                            sanitizedValue = true;
                        } else if (['false', '0', 'no', 'off'].includes(lowerValue)) {
                            sanitizedValue = false;
                        } else {
                            errors.push({
                                field: paramName,
                                message: `${paramName} must be a valid boolean value`,
                                code: 'INVALID_BOOLEAN',
                                provided: value,
                                valid_values: ['true', 'false', '1', '0', 'yes', 'no']
                            });
                            continue;
                        }
                    } else {
                        sanitizedValue = Boolean(value);
                    }
                    break;

                case 'array':
                    if (!Array.isArray(value)) {
                        // Try to parse as comma-separated string
                        if (typeof value === 'string') {
                            sanitizedValue = value.split(',').map(item => item.trim()).filter(item => item);
                        } else {
                            errors.push({
                                field: paramName,
                                message: `${paramName} must be an array`,
                                code: 'INVALID_ARRAY',
                                provided: value
                            });
                            continue;
                        }
                    } else {
                        sanitizedValue = value;
                    }
                    
                    // Array length validation
                    if (rules.minItems && sanitizedValue.length < rules.minItems) {
                        errors.push({
                            field: paramName,
                            message: `${paramName} must have at least ${rules.minItems} items`,
                            code: 'ARRAY_TOO_SHORT',
                            provided_length: sanitizedValue.length,
                            minimum_length: rules.minItems
                        });
                        continue;
                    }
                    
                    if (rules.maxItems && sanitizedValue.length > rules.maxItems) {
                        sanitizedValue = sanitizedValue.slice(0, rules.maxItems);
                        warnings.push({
                            field: paramName,
                            message: `${paramName} truncated to ${rules.maxItems} items`,
                            original_length: value.length,
                            truncated_length: rules.maxItems
                        });
                    }
                    break;

                default:
                    // Unknown type, just pass through
                    sanitizedValue = value;
            }

            sanitized[paramName] = sanitizedValue;
        }

        // If there are validation errors, return them
        if (errors.length > 0) {
            return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    code: API_ERROR_CODES.VALIDATION_ERROR,
                    timestamp: new Date().toISOString(),
                    details: {
                        errors,
                        warnings: warnings.length > 0 ? warnings : undefined
                    }
                }
            });
        }

        // Add sanitized values to request
        req.sanitized = sanitized;
        req.validationWarnings = warnings;

        next();
    };
}

/**
 * Middleware factory for common validation patterns
 */
const validators = {
    /**
     * Validate pagination parameters
     */
    pagination: () => validateParams({
        page: { type: 'number', min: 1, max: 1000, default: 1, integer: true },
        limit: { type: 'number', min: 1, max: 100, default: 20, integer: true }
    }),

    /**
     * Validate investor search parameters
     */
    investorSearch: () => validateParams(VALIDATION_SCHEMAS.investorSearch),

    /**
     * Validate firm search parameters
     */
    firmSearch: () => validateParams(VALIDATION_SCHEMAS.firmSearch),

    /**
     * Validate network graph parameters
     */
    networkGraph: () => validateParams(VALIDATION_SCHEMAS.networkGraph),

    /**
     * Validate AI search parameters
     */
    aiSearch: () => validateParams(VALIDATION_SCHEMAS.aiSearch),

    /**
     * Validate numeric ID parameter
     */
    numericId: (paramName = 'id') => validateParams({
        [paramName]: { type: 'number', min: 1, required: true, integer: true }
    }),

    /**
     * Validate search query parameter
     */
    searchQuery: (minLength = 3, maxLength = 200) => validateParams({
        q: { type: 'string', minLength, maxLength, required: true }
    })
};

/**
 * Security validation middleware
 */
function securityValidation() {
    return (req, res, next) => {
        const issues = [];

        // Check for SQL injection patterns
        const sqlPatterns = [
            /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER)\b)/i,
            /(UNION\s+SELECT)/i,
            /('|\"|;|--|\*\/|\*)/,
            /(0x[0-9a-fA-F]+)/,
            /(EXEC|EXECUTE)\s*\(/i
        ];

        // Check for XSS patterns
        const xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe\b/gi,
            /<object\b/gi,
            /<embed\b/gi
        ];

        // Validate all input fields
        const allInputs = { ...req.query, ...req.params, ...req.body };
        
        for (const [key, value] of Object.entries(allInputs)) {
            if (typeof value === 'string') {
                // Check for SQL injection
                sqlPatterns.forEach(pattern => {
                    if (pattern.test(value)) {
                        issues.push({
                            field: key,
                            issue: 'Potential SQL injection detected',
                            pattern: pattern.toString()
                        });
                    }
                });

                // Check for XSS
                xssPatterns.forEach(pattern => {
                    if (pattern.test(value)) {
                        issues.push({
                            field: key,
                            issue: 'Potential XSS detected',
                            pattern: pattern.toString()
                        });
                    }
                });

                // Check for excessive length (DoS protection)
                if (value.length > 10000) {
                    issues.push({
                        field: key,
                        issue: 'Input too long (potential DoS)',
                        length: value.length,
                        max_allowed: 10000
                    });
                }
            }
        }

        if (issues.length > 0) {
            console.warn('Security validation issues detected:', {
                ip: req.ip,
                path: req.path,
                issues,
                timestamp: new Date().toISOString()
            });

            return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
                success: false,
                error: {
                    message: 'Security validation failed',
                    code: API_ERROR_CODES.VALIDATION_ERROR,
                    timestamp: new Date().toISOString(),
                    details: {
                        message: 'Input contains potentially harmful content',
                        issues_count: issues.length
                    }
                }
            });
        }

        next();
    };
}

module.exports = {
    validateParams,
    validators,
    securityValidation
};