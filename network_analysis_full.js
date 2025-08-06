const sqlite3 = require('better-sqlite3');

class FullDatasetNetworkAnalysis {
    constructor(dbPath = 'investor_network_full.db') {
        this.db = new sqlite3(dbPath);
        this.setupEnhancedViews();
    }

    setupEnhancedViews() {
        // Create enhanced views for the full dataset
        const views = `
            -- Enhanced investor overview with full dataset metrics
            CREATE VIEW IF NOT EXISTS investor_overview_full AS
            SELECT 
                i.id,
                i.slug,
                p.full_name,
                p.first_name,
                p.last_name,
                p.linkedin_url,
                p.twitter_url,
                p.crunchbase_url,
                f.name as firm_name,
                f.current_fund_size,
                i.position,
                i.min_investment,
                i.max_investment,
                i.target_investment,
                i.headline,
                i.claimed,
                i.can_edit,
                i.include_in_list,
                i.in_founder_investor_list,
                i.in_diverse_investor_list,
                i.in_female_investor_list,
                i.leads_rounds,
                ns.investment_count,
                ns.connection_count,
                ns.first_degree_count,
                ns.network_tier,
                ns.data_quality_score,
                CASE 
                    WHEN ns.data_quality_score >= 80 THEN 'Premium'
                    WHEN ns.data_quality_score >= 60 THEN 'High Quality'
                    WHEN ns.data_quality_score >= 40 THEN 'Good Quality'
                    WHEN ns.data_quality_score >= 20 THEN 'Basic Quality'
                    ELSE 'Limited Data'
                END as data_tier
            FROM investors i
            LEFT JOIN investor_people ip ON i.id = ip.investor_id AND ip.is_primary = 1
            LEFT JOIN people p ON ip.person_id = p.id
            LEFT JOIN investor_firms if ON i.id = if.investor_id AND if.is_current = 1
            LEFT JOIN firms f ON if.firm_id = f.id
            LEFT JOIN network_stats ns ON i.id = ns.investor_id;

            -- Enhanced firm networks with full dataset
            CREATE VIEW IF NOT EXISTS firm_networks_full AS
            SELECT 
                f.id as firm_id,
                f.name as firm_name,
                f.current_fund_size,
                COUNT(DISTINCT i.id) as investor_count,
                AVG(ns.investment_count) as avg_investments,
                AVG(ns.first_degree_count) as avg_connections,
                AVG(ns.data_quality_score) as avg_quality_score,
                SUM(ns.investment_count) as total_investments,
                MAX(ns.first_degree_count) as max_connections,
                COUNT(CASE WHEN ns.network_tier = 'Super Connected' THEN 1 END) as super_connected_count,
                COUNT(CASE WHEN ns.network_tier = 'Highly Connected' THEN 1 END) as highly_connected_count
            FROM firms f
            JOIN investor_firms if ON f.id = if.firm_id
            JOIN investors i ON if.investor_id = i.id
            LEFT JOIN network_stats ns ON i.id = ns.investor_id
            GROUP BY f.id, f.name, f.current_fund_size;

            -- Investment stage analysis
            CREATE VIEW IF NOT EXISTS investment_stage_analysis AS
            SELECT 
                'seed' as stage,
                COUNT(CASE WHEN i.min_investment LIKE '%K%' OR i.min_investment LIKE '%k%' THEN 1 END) as potential_matches
            FROM investors i
            WHERE i.min_investment IS NOT NULL
            UNION ALL
            SELECT 
                'series_a' as stage,
                COUNT(CASE WHEN i.min_investment LIKE '%M%' OR i.min_investment LIKE '%m%' THEN 1 END) as potential_matches
            FROM investors i
            WHERE i.min_investment IS NOT NULL;
        `;

        this.db.exec(views);
    }

    // Enhanced investor search with full dataset capabilities
    findInvestorsAdvanced(criteria = {}) {
        let query = `
            SELECT * FROM investor_overview_full
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

        if (criteria.maxConnections) {
            query += ` AND first_degree_count <= ?`;
            params.push(criteria.maxConnections);
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

        if (criteria.dataTier) {
            query += ` AND data_tier = ?`;
            params.push(criteria.dataTier);
        }

        if (criteria.isClaimed !== undefined) {
            query += ` AND claimed = ?`;
            params.push(criteria.isClaimed ? 1 : 0);
        }

        if (criteria.isInFounderList) {
            query += ` AND in_founder_investor_list = 1`;
        }

        if (criteria.isDiverseInvestor) {
            query += ` AND in_diverse_investor_list = 1`;
        }

        if (criteria.leadsRounds) {
            query += ` AND leads_rounds IS NOT NULL`;
        }

        if (criteria.minQualityScore) {
            query += ` AND data_quality_score >= ?`;
            params.push(criteria.minQualityScore);
        }

        if (criteria.sector) {
            query += ` AND (headline LIKE ? OR firm_name LIKE ? OR position LIKE ?)`;
            params.push(`%${criteria.sector}%`, `%${criteria.sector}%`, `%${criteria.sector}%`);
        }

        if (criteria.stage) {
            const stageKeywords = {
                'seed': ['seed', 'pre-seed', 'angel', 'early'],
                'series_a': ['series a', 'series-a', 'growth', 'expansion'],
                'series_b': ['series b', 'series-b', 'late stage'],
                'growth': ['growth', 'late stage', 'expansion', 'mature']
            };

            if (stageKeywords[criteria.stage]) {
                const stageConditions = stageKeywords[criteria.stage]
                    .map(() => `(headline LIKE ? OR position LIKE ? OR firm_name LIKE ?)`)
                    .join(' OR ');
                query += ` AND (${stageConditions})`;
                
                stageKeywords[criteria.stage].forEach(keyword => {
                    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
                });
            }
        }

        // Enhanced sorting options
        if (criteria.sortBy) {
            switch (criteria.sortBy) {
                case 'connections':
                    query += ` ORDER BY first_degree_count DESC, data_quality_score DESC`;
                    break;
                case 'investments':
                    query += ` ORDER BY investment_count DESC, first_degree_count DESC`;
                    break;
                case 'quality':
                    query += ` ORDER BY data_quality_score DESC, first_degree_count DESC`;
                    break;
                case 'recent':
                    query += ` ORDER BY claimed DESC, data_quality_score DESC`;
                    break;
                default:
                    query += ` ORDER BY first_degree_count DESC, data_quality_score DESC`;
            }
        } else {
            query += ` ORDER BY first_degree_count DESC, data_quality_score DESC`;
        }

        if (criteria.limit) {
            query += ` LIMIT ?`;
            params.push(criteria.limit);
        }

        return this.db.prepare(query).all(params);
    }

    // Advanced matching algorithm for full dataset
    matchInvestorsAdvanced(targetProfile) {
        let baseScore = 0;
        let query = `
            SELECT 
                *,
                (
                    CASE WHEN firm_name IS NOT NULL THEN 25 ELSE 0 END +
                    CASE WHEN linkedin_url IS NOT NULL THEN 20 ELSE 0 END +
                    CASE WHEN investment_count > 0 THEN 30 ELSE 0 END +
                    CASE WHEN first_degree_count > 100 THEN 15 ELSE 0 END +
                    CASE WHEN first_degree_count > 1000 THEN 10 ELSE 0 END +
                    CASE WHEN position LIKE '%Partner%' OR position LIKE '%Managing%' OR position LIKE '%Principal%' THEN 20 ELSE 0 END +
                    CASE WHEN claimed = 1 THEN 15 ELSE 0 END +
                    CASE WHEN data_quality_score >= 80 THEN 15 ELSE data_quality_score / 10 END +
                    CASE WHEN headline IS NOT NULL THEN 5 ELSE 0 END +
                    CASE WHEN leads_rounds IS NOT NULL THEN 10 ELSE 0 END
                ) as base_match_score
            FROM investor_overview_full
            WHERE 1=1
        `;
        const params = [];

        // Stage-specific matching
        if (targetProfile.stage) {
            query += ` AND (headline LIKE ? OR position LIKE ? OR firm_name LIKE ? OR min_investment LIKE ?)`;
            const stageKeyword = `%${targetProfile.stage}%`;
            params.push(stageKeyword, stageKeyword, stageKeyword, stageKeyword);
            baseScore += 20;
        }

        // Sector-specific matching
        if (targetProfile.sector) {
            query += ` AND (headline LIKE ? OR firm_name LIKE ? OR position LIKE ?)`;
            const sectorKeyword = `%${targetProfile.sector}%`;
            params.push(sectorKeyword, sectorKeyword, sectorKeyword);
            baseScore += 15;
        }

        // Investment size matching
        if (targetProfile.minInvestment) {
            query += ` AND (min_investment IS NOT NULL)`;
            baseScore += 10;
        }

        // Geographic matching
        if (targetProfile.location) {
            // This would require location data to be properly implemented
            baseScore += 5;
        }

        // Quality requirements
        if (targetProfile.requireLinkedIn) {
            query += ` AND linkedin_url IS NOT NULL`;
        }

        if (targetProfile.requireHighQuality) {
            query += ` AND data_quality_score >= 60`;
        }

        if (targetProfile.requireActive) {
            query += ` AND investment_count > 0`;
        }

        if (targetProfile.requireClaimed) {
            query += ` AND claimed = 1`;
        }

        // Diversity criteria
        if (targetProfile.diversityFocus) {
            query += ` AND (in_diverse_investor_list = 1 OR in_female_investor_list = 1 OR in_invests_in_diverse_founders_investor_list = 1)`;
            baseScore += 10;
        }

        query += ` ORDER BY base_match_score DESC, first_degree_count DESC LIMIT ?`;
        params.push(targetProfile.limit || 50);

        const results = this.db.prepare(query).all(params);
        
        // Add additional scoring for context
        return results.map(result => ({
            ...result,
            final_match_score: result.base_match_score + baseScore,
            match_reasons: this.generateMatchReasons(result, targetProfile)
        }));
    }

    generateMatchReasons(investor, targetProfile) {
        const reasons = [];
        
        if (investor.firm_name) reasons.push(`Affiliated with ${investor.firm_name}`);
        if (investor.first_degree_count > 1000) reasons.push(`Highly connected (${investor.first_degree_count.toLocaleString()} connections)`);
        if (investor.investment_count > 0) reasons.push(`Active investor (${investor.investment_count} investments)`);
        if (investor.leads_rounds) reasons.push(`Leads investment rounds`);
        if (investor.claimed) reasons.push(`Verified profile`);
        if (investor.data_quality_score >= 80) reasons.push(`High data quality (${investor.data_quality_score}/100)`);
        if (investor.position && (investor.position.includes('Partner') || investor.position.includes('Managing'))) {
            reasons.push(`Senior position: ${investor.position}`);
        }
        
        return reasons;
    }

    // Enhanced network statistics for full dataset
    getFullDatasetStatistics() {
        const stats = {};

        // Basic counts
        stats.totalInvestors = this.db.prepare('SELECT COUNT(*) as count FROM investors').get().count;
        stats.totalPeople = this.db.prepare('SELECT COUNT(*) as count FROM people').get().count;
        stats.totalFirms = this.db.prepare('SELECT COUNT(*) as count FROM firms').get().count;

        // Quality metrics
        stats.withLinkedIn = this.db.prepare('SELECT COUNT(*) as count FROM people WHERE linkedin_url IS NOT NULL').get().count;
        stats.withInvestments = this.db.prepare('SELECT COUNT(*) as count FROM network_stats WHERE investment_count > 0').get().count;
        stats.claimedProfiles = this.db.prepare('SELECT COUNT(*) as count FROM investors WHERE claimed = 1').get().count;
        stats.highQuality = this.db.prepare('SELECT COUNT(*) as count FROM network_stats WHERE data_quality_score >= 80').get().count;

        // Network tiers
        stats.networkTiers = this.db.prepare(`
            SELECT network_tier, COUNT(*) as count 
            FROM network_stats 
            WHERE network_tier IS NOT NULL
            GROUP BY network_tier
            ORDER BY 
                CASE network_tier 
                    WHEN 'Super Connected' THEN 1
                    WHEN 'Highly Connected' THEN 2
                    WHEN 'Well Connected' THEN 3
                    WHEN 'Connected' THEN 4
                    ELSE 5
                END
        `).all();

        // Data quality distribution
        stats.qualityTiers = this.db.prepare(`
            SELECT 
                CASE 
                    WHEN data_quality_score >= 80 THEN 'Premium'
                    WHEN data_quality_score >= 60 THEN 'High Quality'
                    WHEN data_quality_score >= 40 THEN 'Good Quality'
                    WHEN data_quality_score >= 20 THEN 'Basic Quality'
                    ELSE 'Limited Data'
                END as quality_tier,
                COUNT(*) as count 
            FROM network_stats 
            GROUP BY quality_tier
            ORDER BY AVG(data_quality_score) DESC
        `).all();

        // Top firms with enhanced metrics
        stats.topFirms = this.db.prepare(`
            SELECT 
                firm_name, 
                investor_count, 
                avg_investments,
                avg_quality_score,
                super_connected_count,
                highly_connected_count
            FROM firm_networks_full 
            ORDER BY investor_count DESC, avg_quality_score DESC
            LIMIT 15
        `).all();

        // Investment focus analysis
        stats.investmentFocus = this.db.prepare(`
            SELECT 
                COUNT(CASE WHEN in_founder_investor_list = 1 THEN 1 END) as founder_focused,
                COUNT(CASE WHEN in_diverse_investor_list = 1 THEN 1 END) as diversity_focused,
                COUNT(CASE WHEN in_female_investor_list = 1 THEN 1 END) as female_focused,
                COUNT(CASE WHEN leads_rounds IS NOT NULL THEN 1 END) as lead_investors
            FROM investors
        `).get();

        return stats;
    }

    // Market intelligence for specific sectors/stages
    getMarketIntelligence(sector = null, stage = null) {
        const intelligence = {
            sector,
            stage,
            timestamp: new Date().toISOString()
        };

        let baseQuery = `
            SELECT 
                COUNT(*) as total_matches,
                AVG(first_degree_count) as avg_connections,
                AVG(investment_count) as avg_investments,
                AVG(data_quality_score) as avg_quality,
                COUNT(CASE WHEN linkedin_url IS NOT NULL THEN 1 END) as linkedin_coverage,
                COUNT(CASE WHEN claimed = 1 THEN 1 END) as verified_profiles
            FROM investor_overview_full
            WHERE 1=1
        `;
        const params = [];

        if (sector) {
            baseQuery += ` AND (headline LIKE ? OR firm_name LIKE ? OR position LIKE ?)`;
            params.push(`%${sector}%`, `%${sector}%`, `%${sector}%`);
        }

        if (stage) {
            baseQuery += ` AND (headline LIKE ? OR position LIKE ?)`;
            params.push(`%${stage}%`, `%${stage}%`);
        }

        intelligence.overview = this.db.prepare(baseQuery).get(params);

        // Top players in this space
        let topPlayersQuery = `
            SELECT full_name as person_name, firm_name, first_degree_count, investment_count, data_quality_score
            FROM investor_overview_full
            WHERE 1=1
        `;
        const topParams = [];

        if (sector) {
            topPlayersQuery += ` AND (headline LIKE ? OR firm_name LIKE ? OR position LIKE ?)`;
            topParams.push(`%${sector}%`, `%${sector}%`, `%${sector}%`);
        }

        if (stage) {
            topPlayersQuery += ` AND (headline LIKE ? OR position LIKE ?)`;
            topParams.push(`%${stage}%`, `%${stage}%`);
        }

        topPlayersQuery += ` ORDER BY first_degree_count DESC, investment_count DESC LIMIT 10`;
        intelligence.topPlayers = this.db.prepare(topPlayersQuery).all(topParams);

        return intelligence;
    }

    close() {
        this.db.close();
    }
}

module.exports = { FullDatasetNetworkAnalysis };

// Demo function for testing
async function demonstrateFullDatasetAnalysis() {
    const analyzer = new FullDatasetNetworkAnalysis();

    console.log('=== FULL DATASET NETWORK ANALYSIS DEMO ===\n');

    try {
        // 1. Full dataset statistics
        console.log('1. Full Dataset Statistics:');
        const stats = analyzer.getFullDatasetStatistics();
        console.log(`   - Total investors: ${stats.totalInvestors.toLocaleString()}`);
        console.log(`   - With LinkedIn: ${stats.withLinkedIn.toLocaleString()} (${(stats.withLinkedIn/stats.totalPeople*100).toFixed(1)}%)`);
        console.log(`   - Claimed profiles: ${stats.claimedProfiles.toLocaleString()}`);
        console.log(`   - High quality data: ${stats.highQuality.toLocaleString()}`);

        // 2. Advanced search
        console.log('\n2. Advanced Search - FinTech Series A Investors:');
        const fintechInvestors = analyzer.findInvestorsAdvanced({
            sector: 'fintech',
            stage: 'series_a',
            hasLinkedIn: true,
            minQualityScore: 60,
            limit: 5
        });

        fintechInvestors.forEach((investor, index) => {
            console.log(`   ${index + 1}. ${investor.full_name} (${investor.firm_name || 'Independent'})`);
            console.log(`      Quality: ${investor.data_quality_score}/100 | Connections: ${investor.first_degree_count.toLocaleString()}`);
        });

        // 3. Advanced matching
        console.log('\n3. Advanced AI Matching:');
        const matches = analyzer.matchInvestorsAdvanced({
            sector: 'saas',
            stage: 'seed',
            requireLinkedIn: true,
            requireHighQuality: true,
            limit: 3
        });

        matches.forEach((match, index) => {
            console.log(`   ${index + 1}. ${match.full_name} (Score: ${match.final_match_score})`);
            console.log(`      Reasons: ${match.match_reasons.slice(0, 2).join(', ')}`);
        });

    } catch (error) {
        console.error('Demo error:', error.message);
    } finally {
        analyzer.close();
    }
}

if (require.main === module) {
    demonstrateFullDatasetAnalysis();
}