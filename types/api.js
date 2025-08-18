/**
 * API Constants for JavaScript/Node.js
 * 
 * JavaScript version of the TypeScript API types for use in Node.js backend
 */

// =====================================================
// ERROR CODES
// =====================================================

const API_ERROR_CODES = {
  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Resource errors
  INVESTOR_NOT_FOUND: 'INVESTOR_NOT_FOUND',
  FIRM_NOT_FOUND: 'FIRM_NOT_FOUND',
  ENDPOINT_NOT_FOUND: 'ENDPOINT_NOT_FOUND',
  
  // Search errors
  INVALID_QUERY: 'INVALID_QUERY',
  SEARCH_ERROR: 'SEARCH_ERROR',
  AI_SEARCH_ERROR: 'AI_SEARCH_ERROR',
  
  // Data errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  FETCH_ERROR: 'FETCH_ERROR',
  NETWORK_GRAPH_ERROR: 'NETWORK_GRAPH_ERROR',
  FIRMS_FETCH_ERROR: 'FIRMS_FETCH_ERROR',
  FIRM_FETCH_ERROR: 'FIRM_FETCH_ERROR',
  
  // Validation errors
  INVALID_ID: 'INVALID_ID',
  MISSING_PARAMETER: 'MISSING_PARAMETER',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  
  // Authentication errors (for future use)
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED'
};

// =====================================================
// HTTP STATUS CODES
// =====================================================

const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
};

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

const VALIDATION_SCHEMAS = {
  // Investor search parameters
  investorSearch: {
    page: { type: 'number', min: 1, max: 1000, default: 1 },
    limit: { type: 'number', min: 1, max: 100, default: 20 },
    minConnections: { type: 'number', min: 0, max: 100000 },
    maxConnections: { type: 'number', min: 0, max: 100000 },
    minQualityScore: { type: 'number', min: 0, max: 100 },
    hasLinkedIn: { type: 'boolean' },
    hasInvestments: { type: 'boolean' },
    isInFounderList: { type: 'boolean' },
    isDiverseInvestor: { type: 'boolean' },
    leadsRounds: { type: 'boolean' },
    isClaimed: { type: 'boolean' },
    sortBy: { 
      type: 'string', 
      enum: ['connections', 'investments', 'quality', 'name'],
      default: 'connections'
    },
    sortOrder: { 
      type: 'string', 
      enum: ['asc', 'desc'],
      default: 'desc'
    },
    networkTier: {
      type: 'string',
      enum: ['Super Connected', 'Highly Connected', 'Well Connected', 'Connected', 'Limited Network']
    },
    dataTier: {
      type: 'string',
      enum: ['Premium', 'High Quality', 'Good Quality', 'Basic Quality']
    },
    sector: {
      type: 'string',
      enum: ['fintech', 'saas', 'healthcare', 'consumer', 'enterprise', 'climate', 'ai', 'blockchain', 'edtech', 'proptech', 'biotech', 'mobility', 'gaming', 'social', 'general']
    },
    stage: {
      type: 'string',
      enum: ['pre_seed', 'seed', 'series_a', 'series_b', 'series_c', 'growth', 'late_stage', 'unknown']
    }
  },

  // Firm search parameters
  firmSearch: {
    page: { type: 'number', min: 1, max: 1000, default: 1 },
    limit: { type: 'number', min: 1, max: 100, default: 20 },
    search: { type: 'string', maxLength: 100 },
    sortBy: { 
      type: 'string', 
      enum: ['investor_count', 'avg_connections', 'fund_size', 'name'],
      default: 'investor_count'
    },
    sortOrder: { 
      type: 'string', 
      enum: ['asc', 'desc'],
      default: 'desc'
    }
  },

  // Network graph parameters
  networkGraph: {
    limit: { type: 'number', min: 10, max: 1000, default: 100 },
    minConnections: { type: 'number', min: 0, max: 10000, default: 100 },
    includeEdges: { type: 'boolean', default: true },
    focusId: { type: 'number', min: 1 }
  },

  // AI search parameters
  aiSearch: {
    q: { type: 'string', required: true, minLength: 3, maxLength: 200 },
    limit: { type: 'number', min: 1, max: 50, default: 10 }
  }
};

// =====================================================
// RESPONSE TEMPLATES
// =====================================================

const RESPONSE_TEMPLATES = {
  // Standard success response
  success: (data, meta = {}) => ({
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  }),

  // Standard error response
  error: (message, code, details = null) => ({
    success: false,
    error: {
      message,
      code,
      timestamp: new Date().toISOString(),
      ...(details && { details })
    }
  }),

  // Paginated response
  paginated: (items, pagination, meta = {}) => ({
    success: true,
    data: {
      items,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 20,
        hasMore: pagination.hasMore || false,
        total: pagination.total || null,
        ...(pagination.totalPages && { totalPages: pagination.totalPages })
      }
    },
    meta: {
      timestamp: new Date().toISOString(),
      resultsCount: items.length,
      ...meta
    }
  })
};

// =====================================================
// FIELD MAPPINGS
// =====================================================

const FIELD_MAPPINGS = {
  // Investor field mappings for consistent naming
  investor: {
    id: 'id',
    slug: 'slug',
    full_name: 'full_name',
    first_name: 'first_name',
    last_name: 'last_name',
    linkedin_url: 'linkedin_url',
    twitter_url: 'twitter_url',
    crunchbase_url: 'crunchbase_url',
    firm_name: 'firm_name',
    position: 'position',
    headline: 'headline',
    investment_count: 'investment_count',
    first_degree_count: 'first_degree_count',
    network_tier: 'network_tier',
    data_quality_score: 'data_quality_score',
    data_tier: 'data_tier'
  },

  // Firm field mappings
  firm: {
    id: 'id',
    name: 'name',
    current_fund_size: 'current_fund_size',
    investor_count: 'investor_count',
    avg_connections: 'avg_connections',
    avg_investments: 'avg_investments',
    avg_quality_score: 'avg_quality_score'
  }
};

module.exports = {
  API_ERROR_CODES,
  HTTP_STATUS_CODES,
  VALIDATION_SCHEMAS,
  RESPONSE_TEMPLATES,
  FIELD_MAPPINGS
};