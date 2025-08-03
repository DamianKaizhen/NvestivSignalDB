const sqlite3 = require('better-sqlite3');

class InvestorNetworkAnalysis {
    constructor(dbPath = 'investor_network.db') {
        this.db = new sqlite3(dbPath);
        this.setupNetworkFunctions();
    }

    setupNetworkFunctions() {
        // Create additional views and functions for network analysis
        const views = `
            -- Investor overview with all key metrics
            CREATE VIEW IF NOT EXISTS investor_overview AS
            SELECT 
                i.id,
                i.slug,
                p.full_name,
                p.first_name,
                p.last_name,
                p.linkedin_url,
                f.name as firm_name,
                i.position,
                i.min_investment,
                i.max_investment,
                i.headline,
                ns.investment_count,
                ns.connection_count,
                ns.first_degree_count,
                CASE 
                    WHEN ns.first_degree_count > 1000 THEN 'Highly Connected'
                    WHEN ns.first_degree_count > 500 THEN 'Well Connected'
                    WHEN ns.first_degree_count > 100 THEN 'Connected'
                    ELSE 'Limited Network'
                END as network_tier
            FROM investors i
            LEFT JOIN investor_people ip ON i.id = ip.investor_id
            LEFT JOIN people p ON ip.person_id = p.id
            LEFT JOIN investor_firms if ON i.id = if.investor_id
            LEFT JOIN firms f ON if.firm_id = f.id
            LEFT JOIN network_stats ns ON i.id = ns.investor_id;

            -- Firm networks
            CREATE VIEW IF NOT EXISTS firm_networks AS
            SELECT 
                f.id as firm_id,
                f.name as firm_name,
                COUNT(DISTINCT i.id) as investor_count,
                AVG(ns.investment_count) as avg_investments,
                AVG(ns.first_degree_count) as avg_connections,
                SUM(ns.investment_count) as total_investments,
                MAX(ns.first_degree_count) as max_connections
            FROM firms f
            JOIN investor_firms if ON f.id = if.firm_id
            JOIN investors i ON if.investor_id = i.id
            LEFT JOIN network_stats ns ON i.id = ns.investor_id
            GROUP BY f.id, f.name;
        `;

        this.db.exec(views);
    }

    // Find investors by criteria
    findInvestors(criteria = {}) {
        let query = `
            SELECT * FROM investor_overview
            WHERE 1=1
        `;
        const params = [];

        if (criteria.firmName) {
            query += ` AND firm_name LIKE ?`;
            params.push(`%${criteria.firmName}%`);
        }

        if (criteria.minConnections) {
            query += ` AND first_degree_count >= ?`;
            params.push(criteria.minConnections);
        }

        if (criteria.hasLinkedIn) {
            query += ` AND linkedin_url IS NOT NULL`;
        }

        if (criteria.hasInvestments) {
            query += ` AND investment_count > 0`;
        }

        if (criteria.networkTier) {
            query += ` AND network_tier = ?`;
            params.push(criteria.networkTier);
        }

        if (criteria.limit) {
            query += ` LIMIT ?`;
            params.push(criteria.limit);
        }

        return this.db.prepare(query).all(params);
    }

    // Find potential warm introductions
    findWarmIntroductions(targetInvestorId, maxDegrees = 2) {
        // For now, return investors from the same firms or with high connection counts
        const query = `
            SELECT DISTINCT 
                io.*,
                'Same Firm' as connection_type,
                1 as degree_separation
            FROM investor_overview io
            JOIN investor_firms if1 ON io.id = if1.investor_id
            JOIN investor_firms if2 ON if1.firm_id = if2.firm_id
            WHERE if2.investor_id = ? AND io.id != ?
            
            UNION
            
            SELECT DISTINCT
                io.*,
                'High Network Overlap' as connection_type,
                2 as degree_separation
            FROM investor_overview io
            WHERE io.first_degree_count > 500 
            AND io.id != ?
            
            ORDER BY first_degree_count DESC
            LIMIT 20
        `;

        return this.db.prepare(query).all([targetInvestorId, targetInvestorId, targetInvestorId]);
    }

    // Find co-investment opportunities
    findCoInvestmentOpportunities(investorId) {
        // Find investors from firms that frequently co-invest
        const query = `
            SELECT 
                io.*,
                fn.investor_count as firm_size,
                fn.avg_investments as firm_avg_investments,
                'Firm Network' as opportunity_type
            FROM investor_overview io
            JOIN investor_firms if ON io.id = if.investor_id
            JOIN firm_networks fn ON if.firm_id = fn.firm_id
            WHERE fn.investor_count > 1 AND io.id != ?
            ORDER BY fn.avg_investments DESC, fn.investor_count DESC
            LIMIT 15
        `;

        return this.db.prepare(query).all([investorId]);
    }

    // Investor matching algorithm
    matchInvestors(targetProfile) {
        let query = `
            SELECT 
                *,
                (
                    CASE WHEN firm_name IS NOT NULL THEN 20 ELSE 0 END +
                    CASE WHEN linkedin_url IS NOT NULL THEN 15 ELSE 0 END +
                    CASE WHEN investment_count > 0 THEN 25 ELSE 0 END +
                    CASE WHEN first_degree_count > 100 THEN 20 ELSE 0 END +
                    CASE WHEN position LIKE '%Partner%' OR position LIKE '%Managing%' THEN 15 ELSE 0 END +
                    CASE WHEN headline IS NOT NULL THEN 5 ELSE 0 END
                ) as match_score
            FROM investor_overview
            WHERE 1=1
        `;
        const params = [];

        // Add criteria based on target profile
        if (targetProfile.stage) {
            // This would need more sophisticated stage matching
            query += ` AND (headline LIKE ? OR position LIKE ?)`;
            params.push(`%${targetProfile.stage}%`, `%${targetProfile.stage}%`);
        }

        if (targetProfile.sector) {
            query += ` AND (headline LIKE ? OR firm_name LIKE ?)`;
            params.push(`%${targetProfile.sector}%`, `%${targetProfile.sector}%`);
        }

        if (targetProfile.requireLinkedIn) {
            query += ` AND linkedin_url IS NOT NULL`;
        }

        query += ` ORDER BY match_score DESC, first_degree_count DESC LIMIT ?`;
        params.push(targetProfile.limit || 50);

        return this.db.prepare(query).all(params);
    }

    // Network statistics
    getNetworkStatistics() {
        const stats = {};

        // Basic counts
        stats.totalInvestors = this.db.prepare('SELECT COUNT(*) as count FROM investors').get().count;
        stats.totalPeople = this.db.prepare('SELECT COUNT(*) as count FROM people').get().count;
        stats.totalFirms = this.db.prepare('SELECT COUNT(*) as count FROM firms').get().count;

        // Network quality metrics
        stats.withLinkedIn = this.db.prepare('SELECT COUNT(*) as count FROM people WHERE linkedin_url IS NOT NULL').get().count;
        stats.withInvestments = this.db.prepare('SELECT COUNT(*) as count FROM network_stats WHERE investment_count > 0').get().count;
        stats.highlyConnected = this.db.prepare('SELECT COUNT(*) as count FROM network_stats WHERE first_degree_count > 1000').get().count;

        // Distribution by network tier
        stats.networkTiers = this.db.prepare(`
            SELECT network_tier, COUNT(*) as count 
            FROM investor_overview 
            GROUP BY network_tier
            ORDER BY count DESC
        `).all();

        // Top firms
        stats.topFirms = this.db.prepare(`
            SELECT firm_name, investor_count, avg_investments 
            FROM firm_networks 
            ORDER BY investor_count DESC 
            LIMIT 10
        `).all();

        return stats;
    }

    // Generate investor recommendation report
    generateRecommendationReport(targetCriteria) {
        const report = {
            timestamp: new Date().toISOString(),
            criteria: targetCriteria,
            results: {}
        };

        // Find matching investors
        const matches = this.matchInvestors(targetCriteria);
        report.results.topMatches = matches.slice(0, 10);

        // Find warm introduction opportunities
        if (matches.length > 0) {
            const topMatch = matches[0];
            report.results.warmIntros = this.findWarmIntroductions(topMatch.id);
        }

        // Find co-investment opportunities
        report.results.coInvestmentOpps = this.findCoInvestmentOpportunities(matches[0]?.id || 1);

        // Network insights
        report.results.networkInsights = {
            highValueTargets: this.db.prepare(`
                SELECT full_name, firm_name, first_degree_count, linkedin_url
                FROM investor_overview
                WHERE first_degree_count > 500 AND linkedin_url IS NOT NULL
                ORDER BY first_degree_count DESC
                LIMIT 5
            `).all(),
            
            emergingFirms: this.db.prepare(`
                SELECT firm_name, investor_count, avg_investments
                FROM firm_networks
                WHERE investor_count BETWEEN 2 AND 5 AND avg_investments > 10
                ORDER BY avg_investments DESC
                LIMIT 5
            `).all()
        };

        return report;
    }

    // Export network data for visualization
    exportNetworkData(limit = 100) {
        const nodes = this.db.prepare(`
            SELECT 
                id,
                full_name as name,
                firm_name,
                first_degree_count as connections,
                investment_count as investments,
                network_tier,
                linkedin_url
            FROM investor_overview
            WHERE first_degree_count > 0
            ORDER BY first_degree_count DESC
            LIMIT ?
        `).all([limit]);

        // Create edges based on firm relationships (simplified)
        const edges = this.db.prepare(`
            SELECT DISTINCT
                if1.investor_id as source,
                if2.investor_id as target,
                'firm_connection' as type
            FROM investor_firms if1
            JOIN investor_firms if2 ON if1.firm_id = if2.firm_id
            WHERE if1.investor_id != if2.investor_id
            AND if1.investor_id IN (${nodes.map(() => '?').join(',')})
            AND if2.investor_id IN (${nodes.map(() => '?').join(',')})
            LIMIT 500
        `).all([...nodes.map(n => n.id), ...nodes.map(n => n.id)]);

        return { nodes, edges };
    }

    close() {
        this.db.close();
    }
}

// Example usage and testing
async function demonstrateNetworkAnalysis() {
    const analyzer = new InvestorNetworkAnalysis();

    console.log('=== NETWORK ANALYSIS DEMONSTRATION ===\n');

    // 1. Basic network statistics
    console.log('1. Network Statistics:');
    const stats = analyzer.getNetworkStatistics();
    console.log(`   - Total investors: ${stats.totalInvestors}`);
    console.log(`   - With LinkedIn: ${stats.withLinkedIn} (${(stats.withLinkedIn/stats.totalPeople*100).toFixed(1)}%)`);
    console.log(`   - Highly connected: ${stats.highlyConnected}`);
    console.log(`   - Top firm: ${stats.topFirms[0].firm_name} (${stats.topFirms[0].investor_count} investors)`);

    // 2. Find high-value targets
    console.log('\n2. High-Value Investment Targets:');
    const highValue = analyzer.findInvestors({
        minConnections: 1000,
        hasLinkedIn: true,
        hasInvestments: true,
        limit: 5
    });

    highValue.forEach((investor, index) => {
        console.log(`   ${index + 1}. ${investor.full_name} (${investor.firm_name})`);
        console.log(`      - ${investor.first_degree_count} connections, ${investor.investment_count} investments`);
        console.log(`      - ${investor.linkedin_url}`);
    });

    // 3. Investor matching demo
    console.log('\n3. Investor Matching for B2B SaaS Seed Round:');
    const matches = analyzer.matchInvestors({
        stage: 'seed',
        sector: 'saas',
        requireLinkedIn: true,
        limit: 5
    });

    matches.forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.full_name} (Score: ${match.match_score})`);
        console.log(`      - ${match.firm_name} | ${match.position}`);
        console.log(`      - Network: ${match.network_tier} (${match.first_degree_count} connections)`);
    });

    // 4. Generate comprehensive report
    console.log('\n4. Generating Comprehensive Recommendation Report...');
    const report = analyzer.generateRecommendationReport({
        stage: 'series_a',
        sector: 'fintech',
        requireLinkedIn: true,
        limit: 10
    });

    console.log(`   - Found ${report.results.topMatches.length} matching investors`);
    console.log(`   - ${report.results.warmIntros.length} warm introduction opportunities`);
    console.log(`   - ${report.results.coInvestmentOpps.length} co-investment opportunities`);

    // 5. Network visualization data
    console.log('\n5. Network Visualization Data:');
    const networkData = analyzer.exportNetworkData(20);
    console.log(`   - ${networkData.nodes.length} nodes (investors)`);
    console.log(`   - ${networkData.edges.length} edges (connections)`);

    analyzer.close();
    return report;
}

module.exports = { InvestorNetworkAnalysis, demonstrateNetworkAnalysis };

// Run demonstration if this file is executed directly
if (require.main === module) {
    demonstrateNetworkAnalysis();
}