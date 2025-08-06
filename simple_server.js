const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3010;

// Global error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('🚨 Uncaught Exception:', error);
    console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

// Server state tracking
let analyzer = null;
let serverStartTime = new Date();
let serverHealth = {
    status: 'starting',
    database: 'not_connected',
    errors: []
};

// Middleware with enhanced logging
app.use((req, res, next) => {
    const start = Date.now();
    console.log(`📥 ${req.method} ${req.url} - ${req.ip || 'unknown'}`);
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`📤 ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
    });
    
    next();
});

app.use(cors({
    origin: ['http://localhost:3010', 'http://127.0.0.1:3010'],
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database analyzer with enhanced error handling
async function initializeAnalyzer() {
    try {
        console.log('🔄 Initializing database analyzer...');
        
        // Check if database file exists
        const dbPath = 'investor_network_full.db';
        if (!fs.existsSync(dbPath)) {
            throw new Error(`Database file not found: ${dbPath}`);
        }
        
        // Get database file info
        const dbStats = fs.statSync(dbPath);
        console.log(`📊 Database file: ${dbPath} (${(dbStats.size / 1024 / 1024).toFixed(2)}MB)`);
        
        // Initialize the analyzer
        const { FullDatasetNetworkAnalysis } = require('./network_analysis_full');
        analyzer = new FullDatasetNetworkAnalysis(dbPath);
        
        // Test database connection
        const stats = analyzer.getFullDatasetStatistics();
        console.log(`✅ Database connected - ${stats.totalInvestors.toLocaleString()} investors loaded`);
        
        serverHealth.status = 'healthy';
        serverHealth.database = 'connected';
        
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize database analyzer:', error.message);
        serverHealth.status = 'degraded';
        serverHealth.database = 'error';
        serverHealth.errors.push({
            timestamp: new Date().toISOString(),
            error: error.message,
            component: 'database'
        });
        return false;
    }
}

// Enhanced health endpoint with detailed diagnostics
app.get('/health', (req, res) => {
    const healthInfo = {
        ...serverHealth,
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - serverStartTime.getTime()) / 1000),
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version
    };
    
    const statusCode = serverHealth.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthInfo);
});

// Diagnostic endpoint
app.get('/api/diagnostics', (req, res) => {
    const diagnostics = {
        server: {
            status: serverHealth.status,
            uptime: Math.floor((Date.now() - serverStartTime.getTime()) / 1000),
            port: port,
            environment: process.env.NODE_ENV || 'development'
        },
        database: {
            status: serverHealth.database,
            path: 'investor_network_full.db',
            exists: fs.existsSync('investor_network_full.db'),
            size: fs.existsSync('investor_network_full.db') 
                ? `${(fs.statSync('investor_network_full.db').size / 1024 / 1024).toFixed(2)}MB` 
                : 'N/A'
        },
        files: {
            webInterface: fs.existsSync('web_interface.html'),
            networkAnalysis: fs.existsSync('network_analysis_full.js')
        },
        errors: serverHealth.errors.slice(-10), // Last 10 errors
        timestamp: new Date().toISOString()
    };
    
    res.json(diagnostics);
});

// API Routes with enhanced error handling
app.get('/api/network/stats', async (req, res) => {
    try {
        if (!analyzer) {
            throw new Error('Database analyzer not initialized');
        }
        
        const stats = analyzer.getFullDatasetStatistics();
        res.json({
            ...stats,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Stats API error:', error.message);
        res.status(500).json({ 
            error: error.message,
            timestamp: new Date().toISOString(),
            endpoint: '/api/network/stats'
        });
    }
});

app.get('/api/investors/search', async (req, res) => {
    try {
        if (!analyzer) {
            throw new Error('Database analyzer not initialized');
        }
        
        const criteria = {
            firmName: req.query.firm,
            minConnections: req.query.minConnections ? parseInt(req.query.minConnections) : undefined,
            hasLinkedIn: req.query.hasLinkedIn === 'true',
            hasInvestments: req.query.hasInvestments === 'true',
            networkTier: req.query.networkTier,
            limit: Math.min(parseInt(req.query.limit) || 20, 100) // Cap at 100
        };

        console.log('🔍 Search criteria:', criteria);
        const results = analyzer.findInvestorsAdvanced(criteria);
        
        res.json({
            count: results.length,
            criteria,
            investors: results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Search API error:', error.message);
        res.status(500).json({ 
            error: error.message,
            timestamp: new Date().toISOString(),
            endpoint: '/api/investors/search'
        });
    }
});

app.post('/api/investors/match', async (req, res) => {
    try {
        if (!analyzer) {
            throw new Error('Database analyzer not initialized');
        }
        
        const targetProfile = req.body;
        const matches = analyzer.matchInvestorsAdvanced(targetProfile);
        
        res.json({
            matches: matches.length,
            targetProfile,
            results: matches,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Match API error:', error.message);
        res.status(500).json({ 
            error: error.message,
            timestamp: new Date().toISOString(),
            endpoint: '/api/investors/match'
        });
    }
});

// Serve static files from current directory
app.use('/static', express.static('.', {
    dotfiles: 'deny',
    index: false,
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// Root route - serve web interface with error handling
app.get('/', (req, res) => {
    try {
        const htmlPath = path.join(__dirname, 'web_interface.html');
        
        if (!fs.existsSync(htmlPath)) {
            console.error('❌ Web interface file not found:', htmlPath);
            return res.status(404).send(`
                <html>
                    <head><title>Interface Not Found</title></head>
                    <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                        <h1>🚨 Web Interface Not Found</h1>
                        <p>The web interface file is missing: <code>web_interface.html</code></p>
                        <p><a href="/health">Check Server Health</a> | <a href="/api/diagnostics">View Diagnostics</a></p>
                    </body>
                </html>
            `);
        }
        
        res.sendFile(htmlPath);
    } catch (error) {
        console.error('❌ Error serving web interface:', error.message);
        res.status(500).send(`
            <html>
                <head><title>Server Error</title></head>
                <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                    <h1>🚨 Server Error</h1>
                    <p>Error serving web interface: ${error.message}</p>
                    <p><a href="/health">Check Server Health</a> | <a href="/api/diagnostics">View Diagnostics</a></p>
                </body>
            </html>
        `);
    }
});

// Catch-all route for undefined API endpoints
app.all('/api/*', (req, res) => {
    res.status(404).json({
        error: 'API endpoint not found',
        path: req.path,
        method: req.method,
        availableEndpoints: [
            'GET /health',
            'GET /api/diagnostics',
            'GET /api/network/stats',
            'GET /api/investors/search',
            'POST /api/investors/match'
        ],
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('🚨 Express error handler:', err);
    
    serverHealth.errors.push({
        timestamp: new Date().toISOString(),
        error: err.message,
        path: req.path,
        method: req.method
    });
    
    res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
    });
});

// Graceful shutdown
const shutdown = async () => {
    console.log('\n🛑 Shutting down gracefully...');
    
    try {
        if (analyzer) {
            analyzer.close();
            console.log('✅ Database connection closed');
        }
    } catch (error) {
        console.error('❌ Error during shutdown:', error.message);
    }
    
    process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start server with enhanced initialization
async function startServer() {
    try {
        console.log('🚀 Starting Investor Database Browser...');
        console.log(`📝 Process ID: ${process.pid}`);
        console.log(`🗂️ Working Directory: ${process.cwd()}`);
        
        // Initialize database
        const dbInitialized = await initializeAnalyzer();
        
        // Start HTTP server
        const server = app.listen(port, () => {
            const dbStatus = dbInitialized ? '✅ Connected' : '❌ Error';
            const dbInfo = dbInitialized && fs.existsSync('investor_network_full.db') 
                ? `(${(fs.statSync('investor_network_full.db').size / 1024 / 1024).toFixed(2)}MB)`
                : '(Not Available)';
            
            const recordCount = dbInitialized && analyzer 
                ? analyzer.getFullDatasetStatistics().totalInvestors.toLocaleString()
                : 'Unknown';
            
            console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🚀 INVESTOR DATABASE BROWSER STARTED                     ║
║                                                                              ║
║  Status:        ${serverHealth.status.toUpperCase().padEnd(58)} ║
║  Web Interface: http://localhost:${port.toString().padEnd(54)} ║
║  API Health:    http://localhost:${port}/health${' '.repeat(45)} ║
║  Diagnostics:   http://localhost:${port}/api/diagnostics${' '.repeat(36)} ║
║  Database:      ${dbStatus} ${dbInfo.padEnd(52)} ║
║  Records:       ${recordCount} investors${' '.repeat(50 - recordCount.length)} ║
║                                                                              ║
║  🔧 Troubleshooting:                                                        ║
║     - Visit /health for server status                                       ║
║     - Visit /api/diagnostics for detailed info                              ║
║     - Check console for real-time logs                                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
            `);
        });
        
        server.on('error', (error) => {
            console.error('🚨 Server error:', error);
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${port} is already in use. Please close other applications or use a different port.`);
            }
            process.exit(1);
        });
        
    } catch (error) {
        console.error('🚨 Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

module.exports = app;