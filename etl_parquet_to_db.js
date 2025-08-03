const Database = require('duckdb').Database;
const fs = require('fs');
const sqlite3 = require('better-sqlite3');

class InvestorETL {
    constructor() {
        this.duckdb = new Database(':memory:');
        this.sqliteDb = new sqlite3('investor_network.db');
        this.setupSQLiteSchema();
    }

    setupSQLiteSchema() {
        console.log('Setting up SQLite database schema...');
        
        // Read and execute the schema
        const schema = fs.readFileSync('database_schema.sql', 'utf8');
        
        // Split schema by statements and execute (simplified version for SQLite)
        const sqliteSchema = `
            -- Core tables
            CREATE TABLE IF NOT EXISTS investors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT UNIQUE,
                claimed BOOLEAN DEFAULT 0,
                can_edit BOOLEAN DEFAULT 0,
                include_in_list BOOLEAN DEFAULT 0,
                leads_rounds TEXT,
                position TEXT,
                min_investment TEXT,
                max_investment TEXT,
                target_investment TEXT,
                areas_of_interest_freeform TEXT,
                vote_count INTEGER DEFAULT 0,
                headline TEXT,
                previous_position TEXT,
                previous_firm TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS people (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT UNIQUE,
                first_name TEXT,
                last_name TEXT,
                full_name TEXT,
                linkedin_url TEXT,
                twitter_url TEXT,
                crunchbase_url TEXT,
                angellist_url TEXT,
                website_url TEXT,
                first_degree_count INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS firms (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT UNIQUE,
                name TEXT NOT NULL,
                current_fund_size TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS companies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT UNIQUE,
                name TEXT NOT NULL,
                display_name TEXT,
                total_employee_count INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS locations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kind TEXT,
                display_name TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS investment_stages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kind TEXT,
                display_name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS interest_areas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kind TEXT,
                display_name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            -- Relationship tables
            CREATE TABLE IF NOT EXISTS investor_people (
                investor_id INTEGER,
                person_id INTEGER,
                is_primary BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (investor_id, person_id),
                FOREIGN KEY (investor_id) REFERENCES investors(id),
                FOREIGN KEY (person_id) REFERENCES people(id)
            );

            CREATE TABLE IF NOT EXISTS investor_firms (
                investor_id INTEGER,
                firm_id INTEGER,
                is_current BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (investor_id, firm_id),
                FOREIGN KEY (investor_id) REFERENCES investors(id),
                FOREIGN KEY (firm_id) REFERENCES firms(id)
            );

            CREATE TABLE IF NOT EXISTS investor_locations (
                investor_id INTEGER,
                location_id INTEGER,
                location_type TEXT DEFAULT 'primary',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (investor_id, location_id, location_type),
                FOREIGN KEY (investor_id) REFERENCES investors(id),
                FOREIGN KEY (location_id) REFERENCES locations(id)
            );

            CREATE TABLE IF NOT EXISTS funding_rounds (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                company_id INTEGER,
                stage TEXT,
                amount TEXT,
                date DATETIME,
                total_raised_amount TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (company_id) REFERENCES companies(id)
            );

            CREATE TABLE IF NOT EXISTS investments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                investor_id INTEGER,
                funding_round_id INTEGER,
                company_id INTEGER,
                is_lead BOOLEAN DEFAULT 0,
                board_role_title TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (investor_id) REFERENCES investors(id),
                FOREIGN KEY (funding_round_id) REFERENCES funding_rounds(id),
                FOREIGN KEY (company_id) REFERENCES companies(id)
            );

            CREATE TABLE IF NOT EXISTS investor_connections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                source_investor_id INTEGER,
                target_investor_id INTEGER,
                connection_type TEXT DEFAULT 'direct',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (source_investor_id) REFERENCES investors(id),
                FOREIGN KEY (target_investor_id) REFERENCES investors(id)
            );

            CREATE TABLE IF NOT EXISTS co_investments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                investor1_id INTEGER,
                investor2_id INTEGER,
                company_id INTEGER,
                funding_round_id INTEGER,
                co_investment_count INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (investor1_id) REFERENCES investors(id),
                FOREIGN KEY (investor2_id) REFERENCES investors(id),
                FOREIGN KEY (company_id) REFERENCES companies(id)
            );

            CREATE TABLE IF NOT EXISTS investor_stages (
                investor_id INTEGER,
                stage_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (investor_id, stage_id),
                FOREIGN KEY (investor_id) REFERENCES investors(id),
                FOREIGN KEY (stage_id) REFERENCES investment_stages(id)
            );

            CREATE TABLE IF NOT EXISTS investor_interests (
                investor_id INTEGER,
                interest_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (investor_id, interest_id),
                FOREIGN KEY (investor_id) REFERENCES investors(id),
                FOREIGN KEY (interest_id) REFERENCES interest_areas(id)
            );

            -- Indexes
            CREATE INDEX IF NOT EXISTS idx_investors_slug ON investors(slug);
            CREATE INDEX IF NOT EXISTS idx_people_slug ON people(slug);
            CREATE INDEX IF NOT EXISTS idx_firms_slug ON firms(slug);
            CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
            CREATE INDEX IF NOT EXISTS idx_investor_connections_source ON investor_connections(source_investor_id);
            CREATE INDEX IF NOT EXISTS idx_investor_connections_target ON investor_connections(target_investor_id);
        `;

        this.sqliteDb.exec(sqliteSchema);
        console.log('SQLite schema created successfully');
    }

    async extractData() {
        console.log('Starting data extraction from parquet file...');
        
        const connection = this.duckdb.connect();
        
        try {
            // Extract basic investor data
            await this.extractInvestors(connection);
            await this.extractPeople(connection);
            await this.extractFirms(connection);
            await this.extractLocations(connection);
            await this.extractStagesAndInterests(connection);
            
            // Extract relationships
            await this.extractInvestorPeopleRelations(connection);
            await this.extractInvestorFirmRelations(connection);
            await this.extractInvestorLocationRelations(connection);
            
            // Extract investment data
            await this.extractInvestments(connection);
            await this.extractConnections(connection);
            
            console.log('Data extraction completed successfully!');
            
        } catch (error) {
            console.error('Error during extraction:', error);
        } finally {
            connection.close();
        }
    }

    async extractInvestors(connection) {
        console.log('Extracting investors...');
        
        const query = `
            SELECT 
                person.slug as person_slug,
                claimed,
                can_edit,
                include_in_list,
                leads_rounds,
                position,
                min_investment,
                max_investment,
                target_investment,
                areas_of_interest_freeform,
                vote_count,
                headline,
                previous_position,
                previous_firm
            FROM 'Sample_Investor_DB/investors.parquet'
            WHERE person.slug IS NOT NULL
        `;

        const results = await new Promise((resolve, reject) => {
            connection.all(query, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        const insertInvestor = this.sqliteDb.prepare(`
            INSERT OR IGNORE INTO investors (
                slug, claimed, can_edit, include_in_list, leads_rounds,
                position, min_investment, max_investment, target_investment,
                areas_of_interest_freeform, vote_count, headline,
                previous_position, previous_firm
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        results.forEach(row => {
            insertInvestor.run([
                row.person_slug,
                row.claimed ? 1 : 0,
                row.can_edit ? 1 : 0,
                row.include_in_list ? 1 : 0,
                row.leads_rounds,
                row.position,
                row.min_investment,
                row.max_investment,
                row.target_investment,
                row.areas_of_interest_freeform,
                row.vote_count || 0,
                row.headline,
                row.previous_position,
                row.previous_firm
            ]);
        });

        console.log(`Inserted ${results.length} investors`);
    }

    async extractPeople(connection) {
        console.log('Extracting people...');
        
        const query = `
            SELECT DISTINCT
                person.slug,
                person.first_name,
                person.last_name,
                person.name as full_name,
                person.linkedin_url,
                person.twitter_url,
                person.crunchbase_url,
                person.angellist_url,
                person.url as website_url,
                person.first_degree_count
            FROM 'Sample_Investor_DB/investors.parquet'
            WHERE person.slug IS NOT NULL
        `;

        const results = await new Promise((resolve, reject) => {
            connection.all(query, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        const insertPerson = this.sqliteDb.prepare(`
            INSERT OR IGNORE INTO people (
                slug, first_name, last_name, full_name,
                linkedin_url, twitter_url, crunchbase_url,
                angellist_url, website_url, first_degree_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        results.forEach(row => {
            insertPerson.run([
                row.slug,
                row.first_name,
                row.last_name,
                row.full_name,
                row.linkedin_url,
                row.twitter_url,
                row.crunchbase_url,
                row.angellist_url,
                row.website_url,
                row.first_degree_count || 0
            ]);
        });

        console.log(`Inserted ${results.length} people`);
    }

    async extractFirms(connection) {
        console.log('Extracting firms...');
        
        const query = `
            SELECT DISTINCT
                firm.slug,
                firm.name,
                firm.current_fund_size
            FROM 'Sample_Investor_DB/investors.parquet'
            WHERE firm.slug IS NOT NULL AND firm.name IS NOT NULL
        `;

        const results = await new Promise((resolve, reject) => {
            connection.all(query, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        const insertFirm = this.sqliteDb.prepare(`
            INSERT OR IGNORE INTO firms (slug, name, current_fund_size)
            VALUES (?, ?, ?)
        `);

        results.forEach(row => {
            insertFirm.run([row.slug, row.name, row.current_fund_size]);
        });

        console.log(`Inserted ${results.length} firms`);
    }

    async extractLocations(connection) {
        console.log('Extracting locations...');
        
        const query = `
            SELECT DISTINCT
                location.display_name
            FROM 'Sample_Investor_DB/investors.parquet'
            WHERE location.display_name IS NOT NULL
        `;

        const results = await new Promise((resolve, reject) => {
            connection.all(query, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        const insertLocation = this.sqliteDb.prepare(`
            INSERT OR IGNORE INTO locations (display_name)
            VALUES (?)
        `);

        results.forEach(row => {
            insertLocation.run([row.display_name]);
        });

        console.log(`Inserted ${results.length} locations`);
    }

    async extractStagesAndInterests(connection) {
        console.log('Extracting investment stages and interest areas...');
        
        // This would require more complex JSON parsing for nested arrays
        // For now, we'll create a placeholder
        const insertStage = this.sqliteDb.prepare(`
            INSERT OR IGNORE INTO investment_stages (kind, display_name)
            VALUES (?, ?)
        `);

        const stages = [
            ['seed', 'Seed'],
            ['series_a', 'Series A'],
            ['series_b', 'Series B'],
            ['series_c', 'Series C'],
            ['growth', 'Growth'],
            ['ipo', 'IPO']
        ];

        stages.forEach(([kind, display]) => {
            insertStage.run([kind, display]);
        });

        console.log('Inserted default investment stages');
    }

    async extractInvestorPeopleRelations(connection) {
        console.log('Extracting investor-people relationships...');
        
        const query = `
            SELECT 
                person.slug as person_slug
            FROM 'Sample_Investor_DB/investors.parquet'
            WHERE person.slug IS NOT NULL
        `;

        const results = await new Promise((resolve, reject) => {
            connection.all(query, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        const insertRelation = this.sqliteDb.prepare(`
            INSERT OR IGNORE INTO investor_people (investor_id, person_id, is_primary)
            SELECT i.id, p.id, 1
            FROM investors i, people p
            WHERE i.slug = ? AND p.slug = ?
        `);

        results.forEach(row => {
            insertRelation.run([row.person_slug, row.person_slug]);
        });

        console.log(`Linked ${results.length} investor-people relationships`);
    }

    async extractInvestorFirmRelations(connection) {
        console.log('Extracting investor-firm relationships...');
        
        const query = `
            SELECT 
                person.slug as person_slug,
                firm.slug as firm_slug
            FROM 'Sample_Investor_DB/investors.parquet'
            WHERE person.slug IS NOT NULL AND firm.slug IS NOT NULL
        `;

        const results = await new Promise((resolve, reject) => {
            connection.all(query, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        const insertRelation = this.sqliteDb.prepare(`
            INSERT OR IGNORE INTO investor_firms (investor_id, firm_id, is_current)
            SELECT i.id, f.id, 1
            FROM investors i, firms f
            WHERE i.slug = ? AND f.slug = ?
        `);

        results.forEach(row => {
            insertRelation.run([row.person_slug, row.firm_slug]);
        });

        console.log(`Linked ${results.length} investor-firm relationships`);
    }

    async extractInvestorLocationRelations(connection) {
        console.log('Extracting investor-location relationships...');
        
        const query = `
            SELECT 
                person.slug as person_slug,
                location.display_name
            FROM 'Sample_Investor_DB/investors.parquet'
            WHERE person.slug IS NOT NULL AND location.display_name IS NOT NULL
        `;

        const results = await new Promise((resolve, reject) => {
            connection.all(query, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        const insertRelation = this.sqliteDb.prepare(`
            INSERT OR IGNORE INTO investor_locations (investor_id, location_id, location_type)
            SELECT i.id, l.id, 'primary'
            FROM investors i, locations l
            WHERE i.slug = ? AND l.display_name = ?
        `);

        results.forEach(row => {
            insertRelation.run([row.person_slug, row.display_name]);
        });

        console.log(`Linked ${results.length} investor-location relationships`);
    }

    async extractInvestments(connection) {
        console.log('Extracting investment data...');
        
        // This is complex due to nested JSON structure
        // For now, we'll extract basic investment counts
        const query = `
            SELECT 
                person.slug as person_slug,
                investments_on_record.record_count as investment_count
            FROM 'Sample_Investor_DB/investors.parquet'
            WHERE person.slug IS NOT NULL 
            AND investments_on_record.record_count > 0
        `;

        const results = await new Promise((resolve, reject) => {
            connection.all(query, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        console.log(`Found ${results.length} investors with investment records`);
        
        // More detailed investment extraction would require parsing the nested JSON
        // This is a placeholder for the full implementation
    }

    async extractConnections(connection) {
        console.log('Extracting investor connections...');
        
        const query = `
            SELECT 
                person.slug as source_slug,
                investing_connections.record_count as connection_count
            FROM 'Sample_Investor_DB/investors.parquet'
            WHERE person.slug IS NOT NULL 
            AND investing_connections.record_count > 0
        `;

        const results = await new Promise((resolve, reject) => {
            connection.all(query, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        console.log(`Found ${results.length} investors with direct connections`);
        
        // Detailed connection extraction would require parsing nested JSON arrays
        // This is a placeholder for the full implementation
    }

    generateSummaryReport() {
        console.log('\n=== DATABASE SUMMARY REPORT ===');
        
        const tables = [
            'investors', 'people', 'firms', 'companies', 'locations',
            'investment_stages', 'interest_areas', 'investor_people',
            'investor_firms', 'investor_locations'
        ];

        tables.forEach(table => {
            const result = this.sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
            console.log(`${table}: ${result.count} records`);
        });

        // Sample queries for network analysis
        console.log('\n=== SAMPLE NETWORK QUERIES ===');
        
        const investorsWithFirms = this.sqliteDb.prepare(`
            SELECT COUNT(DISTINCT i.id) as count
            FROM investors i
            JOIN investor_firms if ON i.id = if.investor_id
        `).get();
        console.log(`Investors with firm affiliations: ${investorsWithFirms.count}`);

        const investorsWithLinkedIn = this.sqliteDb.prepare(`
            SELECT COUNT(DISTINCT i.id) as count
            FROM investors i
            JOIN investor_people ip ON i.id = ip.investor_id
            JOIN people p ON ip.person_id = p.id
            WHERE p.linkedin_url IS NOT NULL
        `).get();
        console.log(`Investors with LinkedIn profiles: ${investorsWithLinkedIn.count}`);

        const topFirms = this.sqliteDb.prepare(`
            SELECT f.name, COUNT(i.id) as investor_count
            FROM firms f
            JOIN investor_firms if ON f.id = if.firm_id
            JOIN investors i ON if.investor_id = i.id
            GROUP BY f.id, f.name
            ORDER BY investor_count DESC
            LIMIT 10
        `).all();
        
        console.log('\nTop 10 firms by investor count:');
        topFirms.forEach((firm, index) => {
            console.log(`${index + 1}. ${firm.name}: ${firm.investor_count} investors`);
        });
    }

    close() {
        this.sqliteDb.close();
        this.duckdb.close();
    }
}

// Run the ETL process
async function main() {
    const etl = new InvestorETL();
    
    try {
        await etl.extractData();
        etl.generateSummaryReport();
    } catch (error) {
        console.error('ETL process failed:', error);
    } finally {
        etl.close();
    }
}

main();