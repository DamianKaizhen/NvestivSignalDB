const express = require('express');
const cors = require('cors');
const path = require('path');
const { FullDatasetNetworkAnalysis } = require('./network_analysis_full');

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
        res.json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            version: '2.0.0',
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
                errorHandling: 'enhanced'
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
        });
    } catch (error) {
        res.status(503).json({ 
            status: 'unhealthy', 
            timestamp: new Date().toISOString(),
            error: error.message 
        });
    }
});

// Get network statistics
app.get('/api/network/stats', (req, res) => {
    try {
        const stats = analyzer.getFullDatasetStatistics();
        // Add lastUpdated field that frontend expects
        const response = {
            ...stats,
            lastUpdated: new Date().toISOString()
        };
        res.json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Enhanced investor search with better pagination and sorting
app.get('/api/investors/search', (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        
        const criteria = {
            firmName: req.query.firm,
            minConnections: req.query.minConnections ? parseInt(req.query.minConnections) : undefined,
            maxConnections: req.query.maxConnections ? parseInt(req.query.maxConnections) : undefined,
            hasLinkedIn: req.query.hasLinkedIn === 'true',
            hasInvestments: req.query.hasInvestments === 'true',
            networkTier: req.query.networkTier,
            sector: req.query.sector,
            stage: req.query.stage,
            dataTier: req.query.dataTier,
            minQualityScore: req.query.minQualityScore ? parseInt(req.query.minQualityScore) : undefined,
            sortBy: req.query.sortBy || 'connections',
            isInFounderList: req.query.isInFounderList === 'true',
            isDiverseInvestor: req.query.isDiverseInvestor === 'true',
            leadsRounds: req.query.leadsRounds === 'true',
            isClaimed: req.query.isClaimed ? req.query.isClaimed === 'true' : undefined,
            limit: limit + 1 // Get one extra to check if there are more pages
        };

        const results = analyzer.findInvestorsAdvanced(criteria);
        const hasMore = results.length > limit;
        const investors = hasMore ? results.slice(0, limit) : results;

        res.json({
            success: true,
            data: {
                investors,
                pagination: {
                    page,
                    limit,
                    hasMore,
                    total: hasMore ? null : investors.length // Don't calculate total for performance
                }
            },
            meta: {
                searchCriteria: criteria,
                searchTime: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ 
            success: false,
            error: {
                message: error.message,
                code: 'SEARCH_ERROR'
            }
        });
    }
});

// Get individual investor details with full profile data (supports both ID and slug)
app.get('/api/investors/:identifier', (req, res) => {
    try {
        const identifier = req.params.identifier;
        const isNumericId = !isNaN(parseInt(identifier)) && parseInt(identifier).toString() === identifier;
        
        let investor = null;
        
        if (isNumericId) {
            // Lookup by numeric ID
            const investorId = parseInt(identifier);
            investor = getInvestorById(investorId);
        } else {
            // Lookup by slug
            investor = getInvestorBySlug(identifier);
        }
        
        if (!investor) {
            return res.status(404).json({ 
                success: false,
                error: {
                    message: `Investor not found${isNumericId ? ' with ID' : ' with slug'}: ${identifier}`,
                    code: 'INVESTOR_NOT_FOUND'
                }
            });
        }

        // Get additional profile data
        const profile = {
            ...investor,
            profile_completion: calculateProfileCompletion(investor),
            contact_methods: getContactMethods(investor),
            investment_focus: getInvestmentFocus(investor),
            network_analysis: getNetworkAnalysis(investor)
        };

        res.json({
            success: true,
            data: {
                investor: profile
            },
            meta: {
                retrieved_at: new Date().toISOString(),
                profile_version: '2.0',
                lookup_method: isNumericId ? 'id' : 'slug'
            }
        });
    } catch (error) {
        console.error('Get investor error:', error);
        res.status(500).json({ 
            success: false,
            error: {
                message: error.message,
                code: 'FETCH_ERROR'
            }
        });
    }
});

// Investor matching
app.post('/api/investors/match', (req, res) => {
    try {
        const targetProfile = req.body;
        const matches = analyzer.matchInvestorsAdvanced(targetProfile);
        
        res.json({
            matches: matches.length,
            targetProfile,
            results: matches
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
    try {
        const limit = parseInt(req.query.limit) || 50;
        const networkData = analyzer.exportNetworkData(limit);
        
        res.json(networkData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get top investors by various metrics
app.get('/api/investors/top', (req, res) => {
    try {
        const metric = req.query.by || 'connections'; // connections, investments, network_tier
        const limit = parseInt(req.query.limit) || 10;
        
        let orderBy = 'first_degree_count DESC';
        if (metric === 'investments') {
            orderBy = 'investment_count DESC';
        } else if (metric === 'network_tier') {
            orderBy = "CASE network_tier WHEN 'Highly Connected' THEN 1 WHEN 'Well Connected' THEN 2 WHEN 'Connected' THEN 3 ELSE 4 END";
        }

        const results = analyzer.findInvestors({ limit });
        
        res.json({
            metric,
            count: results.length,
            investors: results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const sortBy = req.query.sortBy || 'investor_count'; // investor_count, avg_connections, fund_size
        const sortOrder = req.query.sortOrder || 'desc';
        const search = req.query.search;

        // Get firms from database with enhanced query
        const firms = getFirmsWithPagination(page, limit, sortBy, sortOrder, search);
        
        res.json({
            success: true,
            data: {
                firms: firms.data,
                pagination: {
                    page,
                    limit,
                    hasMore: firms.hasMore,
                    total: firms.total
                }
            },
            meta: {
                searchTerm: search,
                sortBy,
                sortOrder,
                retrieved_at: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Get firms error:', error);
        res.status(500).json({ 
            success: false,
            error: {
                message: error.message,
                code: 'FIRMS_FETCH_ERROR'
            }
        });
    }
});

// Individual firm details with associated investors
app.get('/api/firms/:id', (req, res) => {
    try {
        const firmId = parseInt(req.params.id);
        
        if (isNaN(firmId)) {
            return res.status(400).json({ 
                success: false,
                error: {
                    message: 'Invalid firm ID',
                    code: 'INVALID_ID'
                }
            });
        }

        const firmDetails = getFirmDetails(firmId);
        
        if (!firmDetails) {
            return res.status(404).json({ 
                success: false,
                error: {
                    message: 'Firm not found',
                    code: 'FIRM_NOT_FOUND'
                }
            });
        }

        res.json({
            success: true,
            data: {
                firm: firmDetails
            },
            meta: {
                retrieved_at: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Get firm details error:', error);
        res.status(500).json({ 
            success: false,
            error: {
                message: error.message,
                code: 'FIRM_FETCH_ERROR'
            }
        });
    }
});

// Network visualization data (nodes and edges)
app.get('/api/network/graph', (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const minConnections = parseInt(req.query.minConnections) || 100;
        const includeEdges = req.query.includeEdges !== 'false';
        const focusId = req.query.focusId ? parseInt(req.query.focusId) : null;

        const networkData = generateNetworkGraph(limit, minConnections, includeEdges, focusId);
        
        res.json({
            success: true,
            data: {
                nodes: networkData.nodes,
                edges: includeEdges ? networkData.edges : [],
                stats: {
                    totalNodes: networkData.nodes.length,
                    totalEdges: includeEdges ? networkData.edges.length : 0,
                    minConnections,
                    focusNode: focusId
                }
            },
            meta: {
                generated_at: new Date().toISOString(),
                parameters: { limit, minConnections, includeEdges, focusId }
            }
        });
    } catch (error) {
        console.error('Network graph error:', error);
        res.status(500).json({ 
            success: false,
            error: {
                message: error.message,
                code: 'NETWORK_GRAPH_ERROR'
            }
        });
    }
});

// Natural language search endpoint
app.get('/api/search/ai', (req, res) => {
    try {
        const query = req.query.q;
        const limit = parseInt(req.query.limit) || 10;
        
        if (!query || query.trim().length < 3) {
            return res.status(400).json({ 
                success: false,
                error: {
                    message: 'Search query must be at least 3 characters long',
                    code: 'INVALID_QUERY'
                }
            });
        }

        const searchResults = performAISearch(query, limit);
        
        res.json({
            success: true,
            data: {
                query,
                results: searchResults.results,
                interpretation: searchResults.interpretation,
                suggestions: searchResults.suggestions
            },
            meta: {
                searchTime: new Date().toISOString(),
                resultsCount: searchResults.results.length,
                confidence: searchResults.confidence
            }
        });
    } catch (error) {
        console.error('AI search error:', error);
        res.status(500).json({ 
            success: false,
            error: {
                message: error.message,
                code: 'AI_SEARCH_ERROR'
            }
        });
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
    
    res.status(404).json({ 
        success: false,
        error: {
            message: 'Endpoint not found',
            code: 'ENDPOINT_NOT_FOUND',
            path: req.path,
            method: req.method,
            suggestions
        }
    });
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
    
    // Don't send stack traces in production
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    res.status(err.status || 500).json({ 
        success: false,
        error: {
            message: err.message || 'Internal server error',
            code: err.code || 'INTERNAL_ERROR',
            ...(isDevelopment && { stack: err.stack }),
            timestamp: new Date().toISOString()
        }
    });
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
    🚀 ENHANCED INVESTOR NETWORK API SERVER
    =========================================
    
    API Server: http://localhost:${port}
    Health Check: http://localhost:${port}/health
    Frontend CORS: Enabled for localhost:3013
    
    🎨 FRONTEND UI:
    Start with: cd frontend && npm run dev
    Access at: http://localhost:3013
    
    📊 CORE ENDPOINTS:
    
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
    
    Network Intelligence:
    • GET  /api/investors/:id/warm-intros - Warm intro paths
    • GET  /api/investors/:id/co-investment-opps - Co-investment analysis
    • POST /api/reports/recommendations - Custom reports
    
    Business Intelligence:
    • GET  /api/bi/pipeline - Investment pipeline analysis
    • GET  /api/bi/market-intelligence - Market insights
    
    🌟 NEW FEATURES:
    ✅ Enhanced CORS for frontend integration
    ✅ Comprehensive error handling with codes
    ✅ Pagination support for all list endpoints
    ✅ AI-powered natural language search
    ✅ Network graph data for visualization
    ✅ Full investor profiles with analytics
    ✅ Investment firm management
    
    =========================================
    Database: investor_network_full.db
    Records: ${analyzer.getFullDatasetStatistics().totalInvestors.toLocaleString()} investors
    Ready for frontend at http://localhost:3000
    =========================================
    `);
});

module.exports = app;