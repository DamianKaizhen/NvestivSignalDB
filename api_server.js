const express = require('express');
const cors = require('cors');
const { InvestorNetworkAnalysis } = require('./network_analysis');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize network analyzer
const analyzer = new InvestorNetworkAnalysis();

// =====================================================
// API ENDPOINTS
// =====================================================

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Get network statistics
app.get('/api/network/stats', (req, res) => {
    try {
        const stats = analyzer.getNetworkStatistics();
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Search investors
app.get('/api/investors/search', (req, res) => {
    try {
        const criteria = {
            firmName: req.query.firm,
            minConnections: req.query.minConnections ? parseInt(req.query.minConnections) : undefined,
            hasLinkedIn: req.query.hasLinkedIn === 'true',
            hasInvestments: req.query.hasInvestments === 'true',
            networkTier: req.query.networkTier,
            limit: req.query.limit ? parseInt(req.query.limit) : 20
        };

        const results = analyzer.findInvestors(criteria);
        res.json({
            count: results.length,
            criteria,
            investors: results
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get investor by ID
app.get('/api/investors/:id', (req, res) => {
    try {
        const investorId = parseInt(req.params.id);
        const investor = analyzer.findInvestors({ limit: 1 }).find(i => i.id === investorId);
        
        if (!investor) {
            return res.status(404).json({ error: 'Investor not found' });
        }

        // Get additional details
        const warmIntros = analyzer.findWarmIntroductions(investorId);
        const coInvestmentOpps = analyzer.findCoInvestmentOpportunities(investorId);

        res.json({
            investor,
            warmIntroductions: warmIntros,
            coInvestmentOpportunities: coInvestmentOpps
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Investor matching
app.post('/api/investors/match', (req, res) => {
    try {
        const targetProfile = req.body;
        const matches = analyzer.matchInvestors(targetProfile);
        
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
        
        const introductions = analyzer.findWarmIntroductions(investorId, maxDegrees);
        
        res.json({
            targetInvestorId: investorId,
            maxDegrees,
            introductions
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Co-investment opportunities
app.get('/api/investors/:id/co-investment-opps', (req, res) => {
    try {
        const investorId = parseInt(req.params.id);
        const opportunities = analyzer.findCoInvestmentOpportunities(investorId);
        
        res.json({
            targetInvestorId: investorId,
            opportunities
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Generate comprehensive recommendation report
app.post('/api/reports/recommendations', (req, res) => {
    try {
        const criteria = req.body;
        const report = analyzer.generateRecommendationReport(criteria);
        
        res.json(report);
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

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
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
    🚀 INVESTOR NETWORK API SERVER STARTED
    =========================================
    
    Server: http://localhost:${port}
    Health: http://localhost:${port}/health
    
    📊 AVAILABLE ENDPOINTS:
    
    Network Analysis:
    • GET  /api/network/stats
    • GET  /api/network/export?limit=50
    
    Investor Search & Matching:
    • GET  /api/investors/search?firm=...&minConnections=...
    • GET  /api/investors/:id
    • POST /api/investors/match
    • GET  /api/investors/top?by=connections&limit=10
    
    Network Intelligence:
    • GET  /api/investors/:id/warm-intros
    • GET  /api/investors/:id/co-investment-opps
    • POST /api/reports/recommendations
    
    Business Intelligence:
    • GET  /api/bi/pipeline?stage=seed&sector=saas
    • GET  /api/bi/market-intelligence
    • GET  /api/firms/analysis
    
    =========================================
    Database: investor_network.db
    Records: ${analyzer.getNetworkStatistics().totalInvestors} investors
    =========================================
    `);
});

module.exports = app;