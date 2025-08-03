const Database = require('duckdb').Database;
const sqlite3 = require('better-sqlite3');

class EfficientInvestorETL {
    constructor() {
        this.duckdb = new Database(':memory:');
        this.sqliteDb = new sqlite3('investor_network.db');
        this.setupSQLiteSchema();
    }

    setupSQLiteSchema() {
        console.log('Setting up SQLite database schema...');
        
        const sqliteSchema = `
            -- Core tables (simplified for efficiency)
            CREATE TABLE IF NOT EXISTS investors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT UNIQUE,
                position TEXT,
                min_investment TEXT,
                max_investment TEXT,
                vote_count INTEGER DEFAULT 0,
                headline TEXT,
                previous_firm TEXT
            );

            CREATE TABLE IF NOT EXISTS people (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT UNIQUE,
                first_name TEXT,
                last_name TEXT,
                full_name TEXT,
                linkedin_url TEXT,
                first_degree_count INTEGER DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS firms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT UNIQUE,
                name TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS investor_people (
                investor_id INTEGER,
                person_id INTEGER,
                PRIMARY KEY (investor_id, person_id)
            );

            CREATE TABLE IF NOT EXISTS investor_firms (
                investor_id INTEGER,
                firm_id INTEGER,
                PRIMARY KEY (investor_id, firm_id)
            );

            -- Network analysis table for quick lookups
            CREATE TABLE IF NOT EXISTS network_stats (
                investor_id INTEGER PRIMARY KEY,
                person_name TEXT,
                firm_name TEXT,
                linkedin_url TEXT,
                investment_count INTEGER DEFAULT 0,
                connection_count INTEGER DEFAULT 0,
                first_degree_count INTEGER DEFAULT 0
            );

            -- Indexes
            CREATE INDEX IF NOT EXISTS idx_investors_slug ON investors(slug);
            CREATE INDEX IF NOT EXISTS idx_people_slug ON people(slug);
            CREATE INDEX IF NOT EXISTS idx_people_linkedin ON people(linkedin_url);
            CREATE INDEX IF NOT EXISTS idx_firms_name ON firms(name);
        `;

        this.sqliteDb.exec(sqliteSchema);
        console.log('SQLite schema created successfully');
    }

    async quickExtract() {
        console.log('Starting efficient data extraction...');
        
        const connection = this.duckdb.connect();
        
        try {
            // Single query to get all essential data
            const query = `
                SELECT 
                    person.slug as person_slug,
                    person.first_name,
                    person.last_name,
                    person.name as full_name,
                    person.linkedin_url,
                    person.first_degree_count,
                    position,
                    min_investment,
                    max_investment,
                    vote_count,
                    headline,
                    previous_firm,
                    firm.slug as firm_slug,
                    firm.name as firm_name,
                    investments_on_record.record_count as investment_count,
                    investing_connections.record_count as connection_count
                FROM 'Sample_Investor_DB/investors.parquet'
                WHERE person.slug IS NOT NULL
                LIMIT 1000
            `;

            console.log('Executing main query (limited to 1000 records for efficiency)...');
            
            const results = await new Promise((resolve, reject) => {
                connection.all(query, (err, res) => {
                    if (err) reject(err);
                    else resolve(res);
                });
            });

            console.log(`Processing ${results.length} records...`);

            // Prepare batch insert statements
            const insertInvestor = this.sqliteDb.prepare(`
                INSERT OR IGNORE INTO investors (slug, position, min_investment, max_investment, vote_count, headline, previous_firm)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            const insertPerson = this.sqliteDb.prepare(`
                INSERT OR IGNORE INTO people (slug, first_name, last_name, full_name, linkedin_url, first_degree_count)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            const insertFirm = this.sqliteDb.prepare(`
                INSERT OR IGNORE INTO firms (slug, name)
                VALUES (?, ?)
            `);

            const insertNetworkStats = this.sqliteDb.prepare(`
                INSERT OR REPLACE INTO network_stats (
                    investor_id, person_name, firm_name, linkedin_url, 
                    investment_count, connection_count, first_degree_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `);

            // Process in transaction for efficiency
            const transaction = this.sqliteDb.transaction(() => {
                let processedCount = 0;
                
                results.forEach(row => {
                    // Insert person
                    insertPerson.run([
                        row.person_slug,
                        row.first_name,
                        row.last_name,
                        row.full_name,
                        row.linkedin_url,
                        row.first_degree_count || 0
                    ]);

                    // Insert investor
                    insertInvestor.run([
                        row.person_slug,
                        row.position,
                        row.min_investment,
                        row.max_investment,
                        row.vote_count || 0,
                        row.headline,
                        row.previous_firm
                    ]);

                    // Insert firm if exists
                    if (row.firm_slug && row.firm_name) {
                        insertFirm.run([row.firm_slug, row.firm_name]);
                    }

                    // Get investor ID for network stats
                    const investorId = this.sqliteDb.prepare('SELECT id FROM investors WHERE slug = ?').get(row.person_slug)?.id;
                    
                    if (investorId) {
                        insertNetworkStats.run([
                            investorId,
                            row.full_name,
                            row.firm_name,
                            row.linkedin_url,
                            row.investment_count || 0,
                            row.connection_count || 0,
                            row.first_degree_count || 0
                        ]);
                    }

                    processedCount++;
                    if (processedCount % 100 === 0) {
                        console.log(`Processed ${processedCount}/${results.length} records...`);
                    }
                });
            });

            transaction();
            
            // Create relationships
            await this.createRelationships();
            
            console.log('Data extraction completed successfully!');
            
        } catch (error) {
            console.error('Error during extraction:', error);
        } finally {
            connection.close();
        }
    }

    async createRelationships() {
        console.log('Creating investor-people relationships...');
        
        const createIPRelations = this.sqliteDb.prepare(`
            INSERT OR IGNORE INTO investor_people (investor_id, person_id)
            SELECT i.id, p.id
            FROM investors i
            JOIN people p ON i.slug = p.slug
        `);
        
        const ipResult = createIPRelations.run();
        console.log(`Created ${ipResult.changes} investor-people relationships`);

        console.log('Creating investor-firm relationships...');
        
        const createIFRelations = this.sqliteDb.prepare(`
            INSERT OR IGNORE INTO investor_firms (investor_id, firm_id)
            SELECT i.id, f.id
            FROM investors i
            JOIN network_stats ns ON i.id = ns.investor_id
            JOIN firms f ON ns.firm_name = f.name
            WHERE ns.firm_name IS NOT NULL
        `);
        
        const ifResult = createIFRelations.run();
        console.log(`Created ${ifResult.changes} investor-firm relationships`);
    }

    generateNetworkAnalysis() {
        console.log('\n=== NETWORK ANALYSIS REPORT ===');
        
        // Basic statistics
        const stats = {
            investors: this.sqliteDb.prepare('SELECT COUNT(*) as count FROM investors').get().count,
            people: this.sqliteDb.prepare('SELECT COUNT(*) as count FROM people').get().count,
            firms: this.sqliteDb.prepare('SELECT COUNT(*) as count FROM firms').get().count,
            withLinkedIn: this.sqliteDb.prepare('SELECT COUNT(*) as count FROM people WHERE linkedin_url IS NOT NULL').get().count,
            withInvestments: this.sqliteDb.prepare('SELECT COUNT(*) as count FROM network_stats WHERE investment_count > 0').get().count,
            withConnections: this.sqliteDb.prepare('SELECT COUNT(*) as count FROM network_stats WHERE connection_count > 0').get().count
        };

        console.log(`Total investors: ${stats.investors}`);
        console.log(`Total people: ${stats.people}`);
        console.log(`Total firms: ${stats.firms}`);
        console.log(`With LinkedIn profiles: ${stats.withLinkedIn} (${(stats.withLinkedIn/stats.people*100).toFixed(1)}%)`);
        console.log(`With investment history: ${stats.withInvestments} (${(stats.withInvestments/stats.investors*100).toFixed(1)}%)`);
        console.log(`With direct connections: ${stats.withConnections} (${(stats.withConnections/stats.investors*100).toFixed(1)}%)`);

        // Top connected investors
        console.log('\n=== TOP CONNECTED INVESTORS ===');
        const topConnected = this.sqliteDb.prepare(`
            SELECT person_name, firm_name, first_degree_count, connection_count, investment_count
            FROM network_stats
            WHERE first_degree_count > 0
            ORDER BY first_degree_count DESC
            LIMIT 10
        `).all();

        topConnected.forEach((investor, index) => {
            console.log(`${index + 1}. ${investor.person_name} (${investor.firm_name || 'No firm'})`);
            console.log(`   - First degree connections: ${investor.first_degree_count}`);
            console.log(`   - Direct connections: ${investor.connection_count}`);
            console.log(`   - Investments: ${investor.investment_count}`);
        });

        // Top firms by investor count
        console.log('\n=== TOP FIRMS BY INVESTOR COUNT ===');
        const topFirms = this.sqliteDb.prepare(`
            SELECT f.name, COUNT(DISTINCT if.investor_id) as investor_count
            FROM firms f
            JOIN investor_firms if ON f.id = if.firm_id
            GROUP BY f.id, f.name
            ORDER BY investor_count DESC
            LIMIT 10
        `).all();

        topFirms.forEach((firm, index) => {
            console.log(`${index + 1}. ${firm.name}: ${firm.investor_count} investors`);
        });

        // Investment range analysis
        console.log('\n=== INVESTMENT RANGE ANALYSIS ===');
        const investmentRanges = this.sqliteDb.prepare(`
            SELECT 
                COUNT(CASE WHEN min_investment IS NOT NULL THEN 1 END) as with_min,
                COUNT(CASE WHEN max_investment IS NOT NULL THEN 1 END) as with_max,
                COUNT(CASE WHEN min_investment IS NOT NULL AND max_investment IS NOT NULL THEN 1 END) as with_range
            FROM investors
        `).get();

        console.log(`Investors with min investment: ${investmentRanges.with_min}`);
        console.log(`Investors with max investment: ${investmentRanges.with_max}`);
        console.log(`Investors with full range: ${investmentRanges.with_range}`);
    }

    generateNetworkQueries() {
        console.log('\n=== SAMPLE NETWORK QUERIES ===');
        
        // Find potential warm introductions
        console.log('\n1. Find investors with high first-degree connections (warm intro potential):');
        const warmIntros = this.sqliteDb.prepare(`
            SELECT person_name, firm_name, linkedin_url, first_degree_count
            FROM network_stats
            WHERE first_degree_count >= 50 AND linkedin_url IS NOT NULL
            ORDER BY first_degree_count DESC
            LIMIT 5
        `).all();

        warmIntros.forEach(investor => {
            console.log(`   - ${investor.person_name} (${investor.firm_name}): ${investor.first_degree_count} connections`);
            console.log(`     LinkedIn: ${investor.linkedin_url}`);
        });

        // Find co-investment opportunities
        console.log('\n2. Firms with multiple active investors:');
        const firmNetworks = this.sqliteDb.prepare(`
            SELECT f.name, COUNT(DISTINCT ns.investor_id) as investor_count,
                   AVG(ns.investment_count) as avg_investments,
                   AVG(ns.first_degree_count) as avg_connections
            FROM firms f
            JOIN investor_firms if ON f.id = if.firm_id
            JOIN network_stats ns ON if.investor_id = ns.investor_id
            WHERE ns.investment_count > 0
            GROUP BY f.id, f.name
            HAVING investor_count >= 2
            ORDER BY investor_count DESC, avg_investments DESC
            LIMIT 5
        `).all();

        firmNetworks.forEach(firm => {
            console.log(`   - ${firm.name}: ${firm.investor_count} investors, avg ${firm.avg_investments.toFixed(1)} investments`);
        });
    }

    close() {
        this.sqliteDb.close();
        this.duckdb.close();
    }
}

// Run the efficient ETL process
async function main() {
    const etl = new EfficientInvestorETL();
    
    try {
        await etl.quickExtract();
        etl.generateNetworkAnalysis();
        etl.generateNetworkQueries();
        
        console.log('\n=== ETL PROCESS COMPLETED ===');
        console.log('Database saved as: investor_network.db');
        console.log('You can now query this database for network analysis!');
        
    } catch (error) {
        console.error('ETL process failed:', error);
    } finally {
        etl.close();
    }
}

main();