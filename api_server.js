const express = require('express');
const cors = require('cors');
const path = require('path');
const { FullDatasetNetworkAnalysis } = require('./network_analysis_full');
const { 
    responseMiddleware, 
    validateRequiredParams, 
    validateParamTypes, 
    validateNumericRanges,
    handleDatabaseError,
    sanitizers,
    startTiming,
    checkRateLimit,
    API_ERROR_CODES,
    HTTP_STATUS_CODES 
} = require('./utils/apiResponse');

const app = express();
const port = process.env.PORT || 3010;

// Enhanced CORS configuration for frontend
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        const allowedOrigins = ['http://localhost:3013', 'http://127.0.0.1:3013', 'http://localhost:3014', 'http://127.0.0.1:3014'];
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['X-Total-Count'],
    optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Additional CORS middleware to ensure headers are always set
app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && (origin === 'http://localhost:3013' || origin === 'http://127.0.0.1:3013' || origin === 'http://localhost:3014' || origin === 'http://127.0.0.1:3014')) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
    }
    next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add standardized response middleware
app.use(responseMiddleware);

// Initialize full dataset network analyzer
const analyzer = new FullDatasetNetworkAnalysis();

// =====================================================
// API ENDPOINTS
// =====================================================

// Root endpoint - redirect to health check
app.get('/', (req, res) => {
    res.redirect('/health');
});

// Enhanced health check with API documentation
app.get('/health', (req, res) => {
    try {
        const stats = analyzer.getFullDatasetStatistics();
        const healthData = { 
            status: 'healthy', 
            version: '2.0.1',
            database: {
                status: 'connected',
                totalInvestors: stats.totalInvestors,
                totalFirms: stats.totalFirms,
                totalPeople: stats.totalPeople
            },
            features: {
                cors: 'enabled',
                aiSearch: 'enabled',
                networkGraph: 'enabled',
                pagination: 'enabled',
                errorHandling: 'enhanced',
                standardizedResponses: 'enabled',
                inputValidation: 'enabled'
            },
            endpoints: {
                investors: {
                    search: 'GET /api/investors/search',
                    detail: 'GET /api/investors/:id',
                    match: 'POST /api/investors/match',
                    top: 'GET /api/investors/top'
                },
                firms: {
                    list: 'GET /api/firms',
                    detail: 'GET /api/firms/:id',
                    analysis: 'GET /api/firms/analysis'
                },
                network: {
                    stats: 'GET /api/network/stats',
                    graph: 'GET /api/network/graph',
                    export: 'GET /api/network/export'
                },
                search: {
                    ai: 'GET /api/search/ai?q=query'
                },
                intelligence: {
                    pipeline: 'GET /api/bi/pipeline',
                    market: 'GET /api/bi/market-intelligence'
                }
            }
        };
        
        res.success(healthData, { apiVersion: '2.0.1', responseFormat: 'standardized' });
    } catch (error) {
        res.error(
            'Health check failed', 
            API_ERROR_CODES.INTERNAL_ERROR, 
            HTTP_STATUS_CODES.SERVICE_UNAVAILABLE,
            { originalError: error.message }
        );
    }
});

// Get network statistics
app.get('/api/network/stats', (req, res) => {
    const endTiming = startTiming('network-stats');
    
    try {
        const stats = analyzer.getFullDatasetStatistics();
        
        // Standardize response format
        const response = {
            ...stats,
            lastUpdated: new Date().toISOString()
        };
        
        const executionTime = endTiming();
        
        res.success(
            response, 
            { 
                cached: false,
                executionTime,
                dataSource: 'live'
            }
        );
    } catch (error) {
        console.error('Network stats error:', error);
        const dbError = handleDatabaseError(error, 'fetching network statistics');
        res.error(
            dbError.response.error.message,
            dbError.response.error.code,
            dbError.statusCode,
            { operation: 'network_stats' }
        );
    }
});

// Enhanced investor search with better pagination and sorting
app.get('/api/investors/search', (req, res) => {
    const endTiming = startTiming('investor-search');
    
    try {
        // Validate and sanitize parameters
        const validationParams = {
            page: sanitizers.number(req.query.page, { min: 1, max: 1000, integer: true }) || 1,
            limit: sanitizers.number(req.query.limit, { min: 1, max: 100, integer: true }) || 20,
            minConnections: req.query.minConnections ? sanitizers.number(req.query.minConnections, { min: 0, integer: true }) : undefined,
            maxConnections: req.query.maxConnections ? sanitizers.number(req.query.maxConnections, { min: 0, integer: true }) : undefined,
            minQualityScore: req.query.minQualityScore ? sanitizers.number(req.query.minQualityScore, { min: 0, max: 100, integer: true }) : undefined
        };
        
        // Validate numeric ranges
        const rangeValidation = validateNumericRanges(validationParams, {
            page: { min: 1, max: 1000 },
            limit: { min: 1, max: 100 },
            minConnections: { min: 0 },
            maxConnections: { min: 0 },
            minQualityScore: { min: 0, max: 100 }
        });
        
        if (rangeValidation) {
            return res.error(
                rangeValidation.response.error.message,
                rangeValidation.response.error.code,
                rangeValidation.statusCode,
                rangeValidation.response.error.details
            );
        }
        
        // Check rate limiting
        const rateLimitCheck = checkRateLimit(req.ip || 'unknown', 60, 60);
        if (rateLimitCheck) {
            return res.error(
                rateLimitCheck.response.error.message,
                rateLimitCheck.response.error.code,
                rateLimitCheck.statusCode,
                rateLimitCheck.response.error.details
            );
        }
        
        const { page, limit } = validationParams;
        
        const criteria = {
            firmName: sanitizers.string(req.query.firm, { maxLength: 100 }),
            minConnections: validationParams.minConnections,
            maxConnections: validationParams.maxConnections,
            hasLinkedIn: sanitizers.boolean(req.query.hasLinkedIn),
            hasInvestments: sanitizers.boolean(req.query.hasInvestments),
            networkTier: req.query.networkTier,
            sector: req.query.sector,
            stage: req.query.stage,
            dataTier: req.query.dataTier,
            minQualityScore: validationParams.minQualityScore,
            sortBy: req.query.sortBy || 'connections',
            isInFounderList: sanitizers.boolean(req.query.isInFounderList),
            isDiverseInvestor: sanitizers.boolean(req.query.isDiverseInvestor),
            leadsRounds: sanitizers.boolean(req.query.leadsRounds),
            isClaimed: req.query.isClaimed ? sanitizers.boolean(req.query.isClaimed) : undefined,
            limit: limit + 1 // Get one extra to check if there are more pages
        };

        const results = analyzer.findInvestorsAdvanced(criteria);
        const hasMore = results.length > limit;
        const investors = hasMore ? results.slice(0, limit) : results;
        
        const executionTime = endTiming();
        
        res.search(
            investors,
            {
                page,
                limit,
                hasMore,
                total: hasMore ? null : investors.length
            },
            criteria,
            {
                executionTime,
                performanceOptimized: true
            }
        );
    } catch (error) {
        console.error('Search error:', error);
        const dbError = handleDatabaseError(error, 'investor search');
        res.error(
            dbError.response.error.message,
            dbError.response.error.code,
            dbError.statusCode,
            { operation: 'investor_search', originalError: error.message }
        );
    }
});

// Get individual investor details with full profile data (supports both ID and slug)
app.get('/api/investors/:identifier', (req, res) => {
    const endTiming = startTiming('investor-detail');
    
    try {
        const identifier = sanitizers.string(req.params.identifier, { maxLength: 100 });
        
        if (!identifier) {
            return res.error(
                'Invalid identifier provided',
                API_ERROR_CODES.INVALID_PARAMETER,
                HTTP_STATUS_CODES.BAD_REQUEST
            );
        }
        
        const isNumericId = !isNaN(parseInt(identifier)) && parseInt(identifier).toString() === identifier;
        
        let investor = null;
        
        if (isNumericId) {
            const investorId = parseInt(identifier);
            if (investorId <= 0) {
                return res.error(
                    'Invalid investor ID',
                    API_ERROR_CODES.INVALID_ID,
                    HTTP_STATUS_CODES.BAD_REQUEST
                );
            }
            investor = getInvestorById(investorId);
        } else {
            investor = getInvestorBySlug(identifier);
        }
        
        if (!investor) {
            return res.error(
                `Investor not found${isNumericId ? ' with ID' : ' with slug'}: ${identifier}`,
                API_ERROR_CODES.INVESTOR_NOT_FOUND,
                HTTP_STATUS_CODES.NOT_FOUND,
                { identifier, lookup_method: isNumericId ? 'id' : 'slug' }
            );
        }

        // Get additional profile data
        const profile = {
            ...investor,
            profile_completion: calculateProfileCompletion(investor),
            contact_methods: getContactMethods(investor),
            investment_focus: getInvestmentFocus(investor),
            network_analysis: getNetworkAnalysis(investor)
        };
        
        const executionTime = endTiming();

        res.success(
            { investor: profile },
            {
                profile_version: '2.1',
                lookup_method: isNumericId ? 'id' : 'slug',
                executionTime,
                cached: false
            }
        );
    } catch (error) {
        console.error('Get investor error:', error);
        const dbError = handleDatabaseError(error, 'fetching investor details');
        res.error(
            dbError.response.error.message,
            dbError.response.error.code,
            dbError.statusCode,
            { operation: 'investor_detail', identifier: req.params.identifier }
        );
    }
});

// Investor matching
app.post('/api/investors/match', (req, res) => {
    const endTiming = startTiming('investor-match');
    
    try {
        const targetProfile = req.body;
        
        if (!targetProfile || Object.keys(targetProfile).length === 0) {
            return res.error(
                'Target profile is required',
                API_ERROR_CODES.INVALID_REQUEST,
                HTTP_STATUS_CODES.BAD_REQUEST,
                { required_fields: 'targetProfile object with matching criteria' }
            );
        }
        
        const matches = analyzer.matchInvestorsAdvanced(targetProfile);
        
        const executionTime = endTiming();
        
        res.success(
            {
                matches: matches.length,
                targetProfile,
                results: matches
            },
            {
                executionTime,
                algorithm: 'advanced_matching_v2',
                match_confidence: matches.length > 0 ? 'high' : 'low'
            }
        );
    } catch (error) {
        console.error('Investor matching error:', error);
        res.error(
            'Investor matching failed',
            API_ERROR_CODES.INTERNAL_ERROR,
            HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            { operation: 'investor_match', originalError: error.message }
        );
    }
});

// Find warm introductions
app.get('/api/investors/:id/warm-intros', (req, res) => {
    try {
        const investorId = parseInt(req.params.id);
        const maxDegrees = parseInt(req.query.maxDegrees) || 2;
        
        res.json({
            targetInvestorId: investorId,
            maxDegrees,
            note: "Warm introduction analysis available - requires advanced graph algorithms"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Co-investment opportunities
app.get('/api/investors/:id/co-investment-opps', (req, res) => {
    try {
        const investorId = parseInt(req.params.id);
        res.json({
            targetInvestorId: investorId,
            note: "Co-investment analysis available - requires investment history parsing"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate comprehensive recommendation report
app.post('/api/reports/recommendations', (req, res) => {
    try {
        const criteria = req.body;
        
        res.json({
            criteria,
            note: "Comprehensive reporting available - requires advanced analytics implementation"
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export network data for visualization
app.get('/api/network/export', (req, res) => {
    const endTiming = startTiming('network-export');
    
    try {
        const limit = sanitizers.number(req.query.limit, { min: 10, max: 1000, integer: true }) || 50;
        
        const rangeValidation = validateNumericRanges({ limit }, {
            limit: { min: 10, max: 1000 }
        });
        
        if (rangeValidation) {
            return res.error(
                rangeValidation.response.error.message,
                rangeValidation.response.error.code,
                rangeValidation.statusCode,
                rangeValidation.response.error.details
            );
        }
        
        const networkData = analyzer.exportNetworkData(limit);
        
        const executionTime = endTiming();
        
        res.success(
            networkData,
            {
                export_format: 'json',
                data_limit: limit,
                executionTime,
                export_version: '2.1'
            }
        );
    } catch (error) {
        console.error('Network export error:', error);
        const dbError = handleDatabaseError(error, 'exporting network data');
        res.error(
            dbError.response.error.message,
            dbError.response.error.code,
            dbError.statusCode,
            { operation: 'network_export' }
        );
    }
});

// Get top investors by various metrics
app.get('/api/investors/top', (req, res) => {
    const endTiming = startTiming('top-investors');
    
    try {
        const metric = req.query.by || 'connections';
        const limit = sanitizers.number(req.query.limit, { min: 1, max: 100, integer: true }) || 10;
        
        // Validate metric parameter
        const validMetrics = ['connections', 'investments', 'network_tier'];
        if (!validMetrics.includes(metric)) {
            return res.error(
                `Invalid metric parameter. Must be one of: ${validMetrics.join(', ')}`,
                API_ERROR_CODES.INVALID_PARAMETER,
                HTTP_STATUS_CODES.BAD_REQUEST,
                { valid_values: validMetrics }
            );
        }
        
        // Validate limit
        const rangeValidation = validateNumericRanges({ limit }, {
            limit: { min: 1, max: 100 }
        });
        
        if (rangeValidation) {
            return res.error(
                rangeValidation.response.error.message,
                rangeValidation.response.error.code,
                rangeValidation.statusCode,
                rangeValidation.response.error.details
            );
        }

        const results = analyzer.findInvestors({ limit });
        
        const executionTime = endTiming();
        
        res.success(
            {
                metric,
                count: results.length,
                investors: results
            },
            {
                executionTime,
                ranking_algorithm: 'multi_metric_v2'
            }
        );
    } catch (error) {
        console.error('Top investors error:', error);
        const dbError = handleDatabaseError(error, 'fetching top investors');
        res.error(
            dbError.response.error.message,
            dbError.response.error.code,
            dbError.statusCode,
            { operation: 'top_investors', metric: req.query.by }
        );
    }
});

// Firm analysis
app.get('/api/firms/analysis', (req, res) => {
    try {
        const stats = analyzer.getNetworkStatistics();
        
        res.json({
            topFirms: stats.topFirms,
            totalFirms: stats.totalFirms
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// NEW ENHANCED ENDPOINTS FOR FRONTEND
// =====================================================

// List all investment firms with pagination
app.get('/api/firms', (req, res) => {
    const endTiming = startTiming('firms-list');
    
    try {
        // Validate and sanitize parameters
        const page = sanitizers.number(req.query.page, { min: 1, max: 1000, integer: true }) || 1;
        const limit = sanitizers.number(req.query.limit, { min: 1, max: 100, integer: true }) || 20;
        const sortBy = req.query.sortBy || 'investor_count';
        const sortOrder = req.query.sortOrder || 'desc';
        const search = sanitizers.string(req.query.search, { maxLength: 100 });
        
        // Validate parameters
        const rangeValidation = validateNumericRanges({ page, limit }, {
            page: { min: 1, max: 1000 },
            limit: { min: 1, max: 100 }
        });
        
        if (rangeValidation) {
            return res.error(
                rangeValidation.response.error.message,
                rangeValidation.response.error.code,
                rangeValidation.statusCode,
                rangeValidation.response.error.details
            );
        }
        
        // Validate sortBy parameter
        const validSortFields = ['investor_count', 'avg_connections', 'fund_size', 'name'];
        if (!validSortFields.includes(sortBy)) {
            return res.error(
                `Invalid sortBy parameter. Must be one of: ${validSortFields.join(', ')}`,
                API_ERROR_CODES.INVALID_PARAMETER,
                HTTP_STATUS_CODES.BAD_REQUEST,
                { valid_values: validSortFields }
            );
        }
        
        // Validate sortOrder parameter
        if (!['asc', 'desc'].includes(sortOrder)) {
            return res.error(
                'Invalid sortOrder parameter. Must be "asc" or "desc"',
                API_ERROR_CODES.INVALID_PARAMETER,
                HTTP_STATUS_CODES.BAD_REQUEST,
                { valid_values: ['asc', 'desc'] }
            );
        }

        // Get firms from database with enhanced query
        const firms = getFirmsWithPagination(page, limit, sortBy, sortOrder, search);
        
        const executionTime = endTiming();
        
        res.paginated(
            firms.data,
            {
                page,
                limit,
                hasMore: firms.hasMore,
                total: firms.total
            },
            {
                searchTerm: search,
                sortBy,
                sortOrder,
                executionTime
            }
        );
    } catch (error) {
        console.error('Get firms error:', error);
        const dbError = handleDatabaseError(error, 'fetching firms list');
        res.error(
            dbError.response.error.message,
            dbError.response.error.code,
            dbError.statusCode,
            { operation: 'firms_list' }
        );
    }
});

// Individual firm details with associated investors
app.get('/api/firms/:id', (req, res) => {
    const endTiming = startTiming('firm-detail');
    
    try {
        const firmId = sanitizers.number(req.params.id, { integer: true });
        
        if (!firmId || firmId <= 0) {
            return res.error(
                'Invalid firm ID',
                API_ERROR_CODES.INVALID_ID,
                HTTP_STATUS_CODES.BAD_REQUEST,
                { provided_id: req.params.id }
            );
        }

        const firmDetails = getFirmDetails(firmId);
        
        if (!firmDetails) {
            return res.error(
                'Firm not found',
                API_ERROR_CODES.FIRM_NOT_FOUND,
                HTTP_STATUS_CODES.NOT_FOUND,
                { firm_id: firmId }
            );
        }
        
        const executionTime = endTiming();

        res.success(
            { firm: firmDetails },
            {
                data_version: '2.1',
                executionTime,
                cached: false
            }
        );
    } catch (error) {
        console.error('Get firm details error:', error);
        const dbError = handleDatabaseError(error, 'fetching firm details');
        res.error(
            dbError.response.error.message,
            dbError.response.error.code,
            dbError.statusCode,
            { operation: 'firm_detail', firm_id: req.params.id }
        );
    }
});

// Network visualization data (nodes and edges)
app.get('/api/network/graph', (req, res) => {
    const endTiming = startTiming('network-graph');
    
    try {
        // Validate and sanitize parameters
        const limit = sanitizers.number(req.query.limit, { min: 10, max: 1000, integer: true }) || 100;
        const minConnections = sanitizers.number(req.query.minConnections, { min: 0, max: 10000, integer: true }) || 100;
        const includeEdges = sanitizers.boolean(req.query.includeEdges);
        const focusId = req.query.focusId ? sanitizers.number(req.query.focusId, { min: 1, integer: true }) : null;
        
        // Validate numeric ranges
        const rangeValidation = validateNumericRanges(
            { limit, minConnections, focusId: focusId || 1 }, 
            {
                limit: { min: 10, max: 1000 },
                minConnections: { min: 0, max: 10000 },
                focusId: { min: 1 }
            }
        );
        
        if (rangeValidation) {
            return res.error(
                rangeValidation.response.error.message,
                rangeValidation.response.error.code,
                rangeValidation.statusCode,
                rangeValidation.response.error.details
            );
        }

        const networkData = generateNetworkGraph(limit, minConnections, includeEdges, focusId);
        
        const executionTime = endTiming();
        
        res.success(
            {
                nodes: networkData.nodes,
                edges: includeEdges ? networkData.edges : [],
                stats: {
                    totalNodes: networkData.nodes.length,
                    totalEdges: includeEdges ? networkData.edges.length : 0,
                    minConnections,
                    focusNode: focusId
                }
            },
            {
                parameters: { limit, minConnections, includeEdges, focusId },
                executionTime,
                optimized: true
            }
        );
    } catch (error) {
        console.error('Network graph error:', error);
        const dbError = handleDatabaseError(error, 'generating network graph');
        res.error(
            dbError.response.error.message,
            dbError.response.error.code,
            dbError.statusCode,
            { operation: 'network_graph', parameters: req.query }
        );
    }
});

// Natural language search endpoint
app.get('/api/search/ai', (req, res) => {
    const endTiming = startTiming('ai-search');
    
    try {
        const query = sanitizers.string(req.query.q, { maxLength: 200 });
        const limit = sanitizers.number(req.query.limit, { min: 1, max: 50, integer: true }) || 10;
        
        // Validate required parameters
        const validation = validateRequiredParams({ q: query }, ['q']);
        if (validation) {
            return res.error(
                validation.response.error.message,
                validation.response.error.code,
                validation.statusCode,
                validation.response.error.details
            );
        }
        
        if (query.length < 3) {
            return res.error(
                'Search query must be at least 3 characters long',
                API_ERROR_CODES.INVALID_QUERY,
                HTTP_STATUS_CODES.BAD_REQUEST,
                { query_length: query.length, minimum_length: 3 }
            );
        }
        
        // Rate limiting for AI search (more restrictive)
        const rateLimitCheck = checkRateLimit(`ai-search-${req.ip}`, 20, 60);
        if (rateLimitCheck) {
            return res.error(
                rateLimitCheck.response.error.message,
                rateLimitCheck.response.error.code,
                rateLimitCheck.statusCode,
                rateLimitCheck.response.error.details
            );
        }

        const searchResults = performAISearch(query, limit);
        
        const executionTime = endTiming();
        
        res.success(
            {
                query,
                results: searchResults.results,
                interpretation: searchResults.interpretation,
                suggestions: searchResults.suggestions
            },
            {
                resultsCount: searchResults.results.length,
                confidence: searchResults.confidence,
                executionTime,
                searchType: 'ai_powered'
            }
        );
    } catch (error) {
        console.error('AI search error:', error);
        res.error(
            'AI search failed',
            API_ERROR_CODES.AI_SEARCH_ERROR,
            HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
            { operation: 'ai_search', query: req.query.q, originalError: error.message }
        );
    }
});

// =====================================================
// HELPER FUNCTIONS FOR ENHANCED ENDPOINTS
// =====================================================

// Get investor by ID with efficient database query
function getInvestorById(investorId) {
    const query = `
        SELECT * FROM investor_overview_full
        WHERE id = ?
        LIMIT 1
    `;
    
    try {
        return analyzer.db.prepare(query).get(investorId);
    } catch (error) {
        console.error('Database query error in getInvestorById:', error);
        return null;
    }
}

// Get investor by slug with efficient database query
function getInvestorBySlug(slug) {
    const query = `
        SELECT * FROM investor_overview_full
        WHERE slug = ?
        LIMIT 1
    `;
    
    try {
        return analyzer.db.prepare(query).get(slug);
    } catch (error) {
        console.error('Database query error in getInvestorBySlug:', error);
        return null;
    }
}

// Profile completion calculation
function calculateProfileCompletion(investor) {
    let score = 0;
    const maxScore = 100;
    
    if (investor.full_name) score += 15;
    if (investor.linkedin_url) score += 20;
    if (investor.firm_name) score += 15;
    if (investor.position) score += 10;
    if (investor.headline) score += 10;
    if (investor.investment_count > 0) score += 15;
    if (investor.first_degree_count > 0) score += 10;
    if (investor.min_investment || investor.max_investment) score += 5;
    
    return {
        percentage: Math.min(score, maxScore),
        missing_fields: getMissingFields(investor)
    };
}

// Get missing profile fields
function getMissingFields(investor) {
    const missing = [];
    if (!investor.full_name) missing.push('name');
    if (!investor.linkedin_url) missing.push('linkedin');
    if (!investor.firm_name) missing.push('firm');
    if (!investor.position) missing.push('position');
    if (!investor.headline) missing.push('bio');
    if (!investor.min_investment && !investor.max_investment) missing.push('investment_range');
    return missing;
}

// Get contact methods
function getContactMethods(investor) {
    const methods = [];
    if (investor.linkedin_url) methods.push({ type: 'linkedin', url: investor.linkedin_url, verified: true });
    if (investor.twitter_url) methods.push({ type: 'twitter', url: investor.twitter_url, verified: false });
    if (investor.crunchbase_url) methods.push({ type: 'crunchbase', url: investor.crunchbase_url, verified: false });
    return methods;
}

// Get investment focus
function getInvestmentFocus(investor) {
    return {
        stages: extractStages(investor.headline, investor.position),
        sectors: extractSectors(investor.headline, investor.firm_name),
        investment_range: {
            min: investor.min_investment,
            max: investor.max_investment,
            target: investor.target_investment
        },
        leads_rounds: investor.leads_rounds,
        check_size_estimate: estimateCheckSize(investor)
    };
}

// Extract investment stages from text
function extractStages(headline, position) {
    const text = (headline || '') + ' ' + (position || '');
    const stages = [];
    
    if (/seed|angel|pre-seed/i.test(text)) stages.push('seed');
    if (/series.?a|growth|expansion/i.test(text)) stages.push('series_a');
    if (/series.?b|late.?stage/i.test(text)) stages.push('series_b');
    if (/growth|mature|later.?stage/i.test(text)) stages.push('growth');
    
    return stages.length > 0 ? stages : ['unknown'];
}

// Extract sectors from text
function extractSectors(headline, firmName) {
    const text = (headline || '') + ' ' + (firmName || '');
    const sectors = [];
    
    if (/fintech|financial|banking|payments/i.test(text)) sectors.push('fintech');
    if (/saas|software|b2b/i.test(text)) sectors.push('saas');
    if (/healthcare|biotech|medical/i.test(text)) sectors.push('healthcare');
    if (/consumer|b2c|retail/i.test(text)) sectors.push('consumer');
    if (/enterprise|infrastructure/i.test(text)) sectors.push('enterprise');
    if (/climate|sustainability|green/i.test(text)) sectors.push('climate');
    if (/ai|artificial.?intelligence|machine.?learning/i.test(text)) sectors.push('ai');
    
    return sectors.length > 0 ? sectors : ['general'];
}

// Estimate check size
function estimateCheckSize(investor) {
    if (investor.min_investment && investor.max_investment) {
        return `${investor.min_investment} - ${investor.max_investment}`;
    }
    if (investor.target_investment) {
        return `~${investor.target_investment}`;
    }
    if (investor.first_degree_count > 5000) return '$1M+';
    if (investor.first_degree_count > 1000) return '$250K - $1M';
    if (investor.first_degree_count > 500) return '$50K - $500K';
    return 'Unknown';
}

// Get network analysis
function getNetworkAnalysis(investor) {
    return {
        tier: investor.network_tier,
        connections: investor.first_degree_count,
        quality_score: investor.data_quality_score,
        influence_score: calculateInfluenceScore(investor),
        reachability: calculateReachability(investor)
    };
}

// Calculate influence score
function calculateInfluenceScore(investor) {
    let score = 0;
    if (investor.first_degree_count > 0) score += Math.min(investor.first_degree_count / 100, 50);
    if (investor.investment_count > 0) score += Math.min(investor.investment_count * 5, 30);
    if (investor.claimed) score += 10;
    if (investor.leads_rounds) score += 10;
    return Math.round(score);
}

// Calculate reachability
function calculateReachability(investor) {
    if (investor.first_degree_count > 5000) return 'very_high';
    if (investor.first_degree_count > 1000) return 'high';
    if (investor.first_degree_count > 500) return 'medium';
    if (investor.first_degree_count > 100) return 'low';
    return 'very_low';
}

// Get firms with pagination
function getFirmsWithPagination(page, limit, sortBy, sortOrder, search) {
    let query = `
        SELECT 
            f.id,
            f.name,
            f.current_fund_size,
            COUNT(DISTINCT i.id) as investor_count,
            AVG(ns.first_degree_count) as avg_connections,
            AVG(ns.investment_count) as avg_investments,
            AVG(ns.data_quality_score) as avg_quality_score,
            MAX(ns.first_degree_count) as max_connections
        FROM firms f
        LEFT JOIN investor_firms if ON f.id = if.firm_id
        LEFT JOIN investors i ON if.investor_id = i.id
        LEFT JOIN network_stats ns ON i.id = ns.investor_id
        WHERE 1=1
    `;
    
    const params = [];
    
    if (search) {
        query += ` AND f.name LIKE ?`;
        params.push(`%${search}%`);
    }
    
    query += ` GROUP BY f.id, f.name, f.current_fund_size`;
    
    // Add sorting
    const validSortFields = {
        'investor_count': 'investor_count',
        'avg_connections': 'avg_connections',
        'fund_size': 'current_fund_size',
        'name': 'f.name'
    };
    
    if (validSortFields[sortBy]) {
        query += ` ORDER BY ${validSortFields[sortBy]} ${sortOrder.toUpperCase()}`;
    } else {
        query += ` ORDER BY investor_count DESC`;
    }
    
    // Get total count for pagination
    const countQuery = `
        SELECT COUNT(DISTINCT f.id) as total
        FROM firms f
        WHERE 1=1 ${search ? 'AND f.name LIKE ?' : ''}
    `;
    
    const total = analyzer.db.prepare(countQuery).get(search ? [`%${search}%`] : []).total;
    
    // Add pagination
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit + 1, (page - 1) * limit);
    
    const results = analyzer.db.prepare(query).all(params);
    const hasMore = results.length > limit;
    const data = hasMore ? results.slice(0, limit) : results;
    
    return { data, hasMore, total };
}

// Get firm details
function getFirmDetails(firmId) {
    const firmQuery = `
        SELECT 
            f.*,
            COUNT(DISTINCT i.id) as investor_count,
            AVG(ns.first_degree_count) as avg_connections,
            SUM(ns.investment_count) as total_investments,
            AVG(ns.data_quality_score) as avg_quality_score
        FROM firms f
        LEFT JOIN investor_firms if ON f.id = if.firm_id
        LEFT JOIN investors i ON if.investor_id = i.id
        LEFT JOIN network_stats ns ON i.id = ns.investor_id
        WHERE f.id = ?
        GROUP BY f.id
    `;
    
    const firm = analyzer.db.prepare(firmQuery).get(firmId);
    
    if (!firm) return null;
    
    // Get associated investors
    const investorsQuery = `
        SELECT 
            i.id,
            i.slug,
            p.full_name,
            p.linkedin_url,
            i.position,
            ns.first_degree_count,
            ns.investment_count,
            ns.network_tier,
            ns.data_quality_score
        FROM investors i
        JOIN investor_firms if ON i.id = if.investor_id
        LEFT JOIN investor_people ip ON i.id = ip.investor_id AND ip.is_primary = 1
        LEFT JOIN people p ON ip.person_id = p.id
        LEFT JOIN network_stats ns ON i.id = ns.investor_id
        WHERE if.firm_id = ?
        ORDER BY ns.first_degree_count DESC
        LIMIT 50
    `;
    
    const investors = analyzer.db.prepare(investorsQuery).all(firmId);
    
    return {
        ...firm,
        investors,
        analytics: {
            investor_count: firm.investor_count,
            avg_connections: Math.round(firm.avg_connections || 0),
            total_investments: firm.total_investments || 0,
            avg_quality_score: Math.round(firm.avg_quality_score || 0),
            top_investor: investors[0] || null
        }
    };
}

// Generate network graph data
function generateNetworkGraph(limit, minConnections, includeEdges, focusId) {
    let query = `
        SELECT 
            i.id,
            i.slug,
            p.full_name as name,
            f.name as firm_name,
            ns.first_degree_count as connections,
            ns.investment_count,
            ns.network_tier,
            ns.data_quality_score,
            p.linkedin_url
        FROM investors i
        LEFT JOIN investor_people ip ON i.id = ip.investor_id AND ip.is_primary = 1
        LEFT JOIN people p ON ip.person_id = p.id
        LEFT JOIN investor_firms if ON i.id = if.investor_id AND if.is_current = 1
        LEFT JOIN firms f ON if.firm_id = f.id
        LEFT JOIN network_stats ns ON i.id = ns.investor_id
        WHERE ns.first_degree_count >= ?
    `;
    
    const params = [minConnections];
    
    if (focusId) {
        // If focusing on a specific investor, get their network
        query += ` OR i.id = ?`;
        params.push(focusId);
    }
    
    query += ` ORDER BY ns.first_degree_count DESC LIMIT ?`;
    params.push(limit);
    
    const investors = analyzer.db.prepare(query).all(params);
    
    // Create nodes
    const nodes = investors.map(investor => ({
        id: investor.id,
        name: investor.name || investor.slug,
        firm: investor.firm_name,
        connections: investor.connections,
        investments: investor.investment_count,
        tier: investor.network_tier,
        quality: investor.data_quality_score,
        size: Math.max(10, Math.min(50, (investor.connections || 0) / 100)),
        color: getNodeColor(investor.network_tier),
        hasLinkedIn: !!investor.linkedin_url,
        isFocus: investor.id === focusId
    }));
    
    // Create edges (connections between investors at same firm)
    const edges = [];
    if (includeEdges) {
        const firmGroups = {};
        investors.forEach(investor => {
            if (investor.firm_name) {
                if (!firmGroups[investor.firm_name]) {
                    firmGroups[investor.firm_name] = [];
                }
                firmGroups[investor.firm_name].push(investor.id);
            }
        });
        
        // Create edges between investors in the same firm
        Object.values(firmGroups).forEach(firmInvestors => {
            if (firmInvestors.length > 1) {
                for (let i = 0; i < firmInvestors.length; i++) {
                    for (let j = i + 1; j < firmInvestors.length; j++) {
                        edges.push({
                            source: firmInvestors[i],
                            target: firmInvestors[j],
                            type: 'firm_connection',
                            weight: 1
                        });
                    }
                }
            }
        });
    }
    
    return { nodes, edges };
}

// Get node color based on network tier
function getNodeColor(tier) {
    switch (tier) {
        case 'Super Connected': return '#ff4444';
        case 'Highly Connected': return '#ff8800';
        case 'Well Connected': return '#ffaa00';
        case 'Connected': return '#88cc00';
        default: return '#cccccc';
    }
}

// Perform AI search
function performAISearch(query, limit) {
    const queryLower = query.toLowerCase();
    
    // Parse search intent
    const interpretation = parseSearchIntent(queryLower);
    
    // Build search criteria based on interpretation
    const searchCriteria = buildSearchCriteria(interpretation);
    
    // Execute search
    const results = analyzer.findInvestorsAdvanced({
        ...searchCriteria,
        limit: limit * 2 // Get more to filter
    });
    
    // Score and rank results based on query relevance
    const scoredResults = results
        .map(investor => ({
            ...investor,
            relevanceScore: calculateRelevanceScore(investor, interpretation)
        }))
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);
    
    return {
        results: scoredResults,
        interpretation,
        confidence: calculateSearchConfidence(interpretation),
        suggestions: generateSearchSuggestions(queryLower)
    };
}

// Parse search intent from natural language
function parseSearchIntent(query) {
    const intent = {
        sectors: [],
        stages: [],
        locations: [],
        firmTypes: [],
        requirements: [],
        qualifiers: []
    };
    
    // Detect sectors
    if (/fintech|financial|banking|payments/i.test(query)) intent.sectors.push('fintech');
    if (/saas|software|b2b/i.test(query)) intent.sectors.push('saas');
    if (/healthcare|biotech|medical/i.test(query)) intent.sectors.push('healthcare');
    if (/consumer|b2c|retail/i.test(query)) intent.sectors.push('consumer');
    if (/climate|sustainability|green/i.test(query)) intent.sectors.push('climate');
    if (/ai|artificial intelligence|machine learning/i.test(query)) intent.sectors.push('ai');
    
    // Detect stages
    if (/seed|angel|pre-seed/i.test(query)) intent.stages.push('seed');
    if (/series a|growth|expansion/i.test(query)) intent.stages.push('series_a');
    if (/series b|late stage/i.test(query)) intent.stages.push('series_b');
    
    // Detect requirements
    if (/linkedin|contact/i.test(query)) intent.requirements.push('hasLinkedIn');
    if (/active|investing|recent/i.test(query)) intent.requirements.push('hasInvestments');
    if (/well connected|highly connected|super connected/i.test(query)) intent.requirements.push('highlyConnected');
    if (/verified|claimed|authentic/i.test(query)) intent.requirements.push('verified');
    if (/diverse|female|underrepresented/i.test(query)) intent.requirements.push('diverse');
    if (/leads|leading|lead investor/i.test(query)) intent.requirements.push('leadsRounds');
    
    // Detect qualifiers
    if (/top|best|leading/i.test(query)) intent.qualifiers.push('top');
    if (/new|emerging|up and coming/i.test(query)) intent.qualifiers.push('emerging');
    if (/experienced|veteran|senior/i.test(query)) intent.qualifiers.push('experienced');
    
    return intent;
}

// Build search criteria from intent
function buildSearchCriteria(intent) {
    const criteria = {};
    
    if (intent.sectors.length > 0) {
        criteria.sector = intent.sectors[0]; // Use first sector
    }
    
    if (intent.stages.length > 0) {
        criteria.stage = intent.stages[0]; // Use first stage
    }
    
    intent.requirements.forEach(req => {
        switch (req) {
            case 'hasLinkedIn':
                criteria.hasLinkedIn = true;
                break;
            case 'hasInvestments':
                criteria.hasInvestments = true;
                break;
            case 'highlyConnected':
                criteria.minConnections = 1000;
                break;
            case 'verified':
                criteria.isClaimed = true;
                break;
            case 'diverse':
                criteria.isDiverseInvestor = true;
                break;
            case 'leadsRounds':
                criteria.leadsRounds = true;
                break;
        }
    });
    
    if (intent.qualifiers.includes('top')) {
        criteria.sortBy = 'connections';
        criteria.minQualityScore = 60;
    }
    
    return criteria;
}

// Calculate relevance score
function calculateRelevanceScore(investor, intent) {
    let score = 0;
    
    // Base quality score
    score += (investor.data_quality_score || 0) / 4;
    
    // Connections boost
    score += Math.min((investor.first_degree_count || 0) / 100, 25);
    
    // Sector matching
    const investorText = (investor.headline || '') + ' ' + (investor.firm_name || '') + ' ' + (investor.position || '');
    intent.sectors.forEach(sector => {
        if (investorText.toLowerCase().includes(sector)) {
            score += 20;
        }
    });
    
    // Stage matching
    intent.stages.forEach(stage => {
        if (investorText.toLowerCase().includes(stage.replace('_', ' '))) {
            score += 15;
        }
    });
    
    // Requirements matching
    intent.requirements.forEach(req => {
        switch (req) {
            case 'hasLinkedIn':
                if (investor.linkedin_url) score += 10;
                break;
            case 'hasInvestments':
                if (investor.investment_count > 0) score += 10;
                break;
            case 'verified':
                if (investor.claimed) score += 15;
                break;
            case 'leadsRounds':
                if (investor.leads_rounds) score += 10;
                break;
        }
    });
    
    return Math.round(score);
}

// Calculate search confidence
function calculateSearchConfidence(intent) {
    let confidence = 0.5; // Base confidence
    
    if (intent.sectors.length > 0) confidence += 0.2;
    if (intent.stages.length > 0) confidence += 0.2;
    if (intent.requirements.length > 0) confidence += 0.1;
    if (intent.qualifiers.length > 0) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
}

// Generate search suggestions
function generateSearchSuggestions(query) {
    const suggestions = [];
    
    if (!query.includes('fintech') && !query.includes('saas')) {
        suggestions.push('Try adding sector keywords like "fintech", "saas", or "healthcare"');
    }
    
    if (!query.includes('seed') && !query.includes('series')) {
        suggestions.push('Specify investment stage like "seed investors" or "series A investors"');
    }
    
    if (!query.includes('linkedin') && !query.includes('active')) {
        suggestions.push('Add "with LinkedIn" or "active investors" for better contact options');
    }
    
    suggestions.push('Try: "fintech seed investors with LinkedIn"');
    suggestions.push('Try: "healthcare series A investors"');
    suggestions.push('Try: "top saas investors who lead rounds"');
    
    return suggestions;
}

// =====================================================
// BUSINESS INTELLIGENCE ENDPOINTS
// =====================================================

// Investment opportunity pipeline
app.get('/api/bi/pipeline', (req, res) => {
    try {
        const stage = req.query.stage || 'seed';
        const sector = req.query.sector || 'saas';
        
        // Mock pipeline analysis based on network data
        const highValueTargets = analyzer.findInvestors({
            minConnections: 500,
            hasLinkedIn: true,
            hasInvestments: true,
            limit: 10
        });

        const pipeline = {
            stage,
            sector,
            totalTargets: highValueTargets.length,
            highPriorityTargets: highValueTargets.filter(i => i.first_degree_count > 1000),
            warmIntroOpportunities: highValueTargets.filter(i => i.firm_name),
            directOutreach: highValueTargets.filter(i => i.linkedin_url),
            analysis: {
                averageConnections: Math.round(highValueTargets.reduce((sum, i) => sum + i.first_degree_count, 0) / highValueTargets.length),
                linkedInCoverage: Math.round((highValueTargets.filter(i => i.linkedin_url).length / highValueTargets.length) * 100),
                firmCoverage: Math.round((highValueTargets.filter(i => i.firm_name).length / highValueTargets.length) * 100)
            }
        };

        res.json(pipeline);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Market intelligence
app.get('/api/bi/market-intelligence', (req, res) => {
    try {
        const stats = analyzer.getNetworkStatistics();
        
        const intelligence = {
            marketOverview: {
                totalInvestors: stats.totalInvestors,
                activeFirms: stats.totalFirms,
                networkQuality: Math.round((stats.withLinkedIn / stats.totalPeople) * 100)
            },
            investorTiers: stats.networkTiers,
            topFirms: stats.topFirms.slice(0, 5),
            opportunities: {
                highValueTargets: stats.highlyConnected,
                warmIntroOpportunities: Math.round(stats.withLinkedIn * 0.3), // Estimate
                directOutreachTargets: stats.withLinkedIn
            },
            recommendations: [
                'Focus on highly connected investors (1000+ connections) for maximum network effect',
                'Prioritize investors with LinkedIn profiles for direct outreach',
                'Target multi-investor firms for syndicate opportunities',
                'Leverage warm introductions through shared firm connections'
            ]
        };

        res.json(intelligence);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// ERROR HANDLING & SERVER SETUP
// =====================================================

// 404 handler with helpful suggestions
app.use((req, res) => {
    const suggestions = [];
    const path = req.path;
    
    if (path.includes('/investor')) {
        suggestions.push('Try /api/investors/search or /api/investors/:id');
    }
    if (path.includes('/firm')) {
        suggestions.push('Try /api/firms or /api/firms/:id');
    }
    if (path.includes('/network')) {
        suggestions.push('Try /api/network/stats or /api/network/graph');
    }
    if (path.includes('/search')) {
        suggestions.push('Try /api/search/ai?q=your-query');
    }
    
    if (suggestions.length === 0) {
        suggestions.push('Check /health for available endpoints');
    }
    
    res.error(
        'Endpoint not found',
        API_ERROR_CODES.ENDPOINT_NOT_FOUND,
        HTTP_STATUS_CODES.NOT_FOUND,
        {
            path: req.path,
            method: req.method,
            suggestions,
            available_endpoints: '/health'
        }
    );
});

// Enhanced global error handler
app.use((err, req, res, next) => {
    console.error('Global error handler caught:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query,
        timestamp: new Date().toISOString()
    });
    
    // Determine error code and status
    const errorCode = err.code || API_ERROR_CODES.INTERNAL_ERROR;
    const statusCode = err.status || HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
    const errorMessage = err.message || 'Internal server error';
    
    // Create error details
    const errorDetails = {
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
        request_id: req.headers['x-request-id'] || null
    };
    
    // Add stack trace only in development
    if (process.env.NODE_ENV !== 'production') {
        errorDetails.stack = err.stack;
        errorDetails.body = req.body;
        errorDetails.query = req.query;
    }
    
    res.error(
        errorMessage,
        errorCode,
        statusCode,
        errorDetails
    );
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    analyzer.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...');
    analyzer.close();
    process.exit(0);
});

// Start server
app.listen(port, () => {
    console.log(`
    =========================================
    🚀 STANDARDIZED INVESTOR NETWORK API v2.1
    =========================================
    
    API Server: http://localhost:${port}
    Health Check: http://localhost:${port}/health
    Frontend CORS: Enabled for localhost:3013
    
    🎨 FRONTEND UI:
    Start with: cd frontend && npm run dev
    Access at: http://localhost:3013
    
    📊 CORE ENDPOINTS (All with standardized responses):
    
    Network Analysis:
    • GET  /api/network/stats - Network statistics
    • GET  /api/network/graph - Visualization data (nodes/edges)
    • GET  /api/network/export - Export network data
    
    Enhanced Investor Search:
    • GET  /api/investors/search - Advanced search with pagination
    • GET  /api/investors/:id - Full investor profile
    • POST /api/investors/match - AI matching algorithm
    • GET  /api/investors/top - Top investors by metrics
    
    Investment Firms:
    • GET  /api/firms - List firms with pagination
    • GET  /api/firms/:id - Firm details with investors
    • GET  /api/firms/analysis - Firm analytics
    
    AI-Powered Search:
    • GET  /api/search/ai?q=... - Natural language search
    
    🌟 NEW v2.1 FEATURES:
    ✅ Standardized API response format {success, data, error, meta}
    ✅ Comprehensive input validation and sanitization
    ✅ Enhanced error handling with detailed error codes
    ✅ Rate limiting protection (60 req/min general, 20 req/min AI)
    ✅ Performance monitoring and execution timing
    ✅ TypeScript interfaces for frontend integration
    ✅ Consistent pagination and search responses
    ✅ Detailed error messages with suggestions
    
    =========================================
    Database: investor_network_full.db
    Records: ${analyzer.getFullDatasetStatistics().totalInvestors.toLocaleString()} investors
    Response Format: Standardized v2.1
    =========================================
    `);
});

module.exports = app;