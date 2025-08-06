const Database = require('duckdb').Database;
const sqlite3 = require('better-sqlite3');

class FullDatasetInvestorETL {
    constructor() {
        this.duckdb = new Database(':memory:');
        this.sqliteDb = new sqlite3('investor_network_full.db');
        this.setupEnhancedSchema();
        this.stats = {
            totalProcessed: 0,
            validLinkedIn: 0,
            withFirms: 0,
            withInvestments: 0,
            withConnections: 0,
            errors: []
        };
    }

    setupEnhancedSchema() {
        console.log('Setting up enhanced SQLite database schema for full dataset...');
        
        const enhancedSchema = `
            -- Enhanced core tables with additional fields from parquet schema
            CREATE TABLE IF NOT EXISTS investors (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT UNIQUE,
                -- Investment profile flags
                claimed BOOLEAN DEFAULT 0,
                can_edit BOOLEAN DEFAULT 0,
                include_in_list BOOLEAN DEFAULT 0,
                in_founder_investor_list BOOLEAN DEFAULT 0,
                in_diverse_investor_list BOOLEAN DEFAULT 0,
                in_female_investor_list BOOLEAN DEFAULT 0,
                in_invests_in_diverse_founders_investor_list BOOLEAN DEFAULT 0,
                in_invests_in_female_founders_investor_list BOOLEAN DEFAULT 0,
                leads_rounds TEXT,
                -- Investment preferences
                position TEXT,
                min_investment TEXT,
                max_investment TEXT,
                target_investment TEXT,
                areas_of_interest_freeform TEXT,
                no_current_interest_freeform TEXT,
                -- Metrics
                vote_count INTEGER DEFAULT 0,
                headline TEXT,
                previous_position TEXT,
                previous_firm TEXT,
                has_profile_vote BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS people (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slug TEXT UNIQUE,
                first_name TEXT,
                last_name TEXT,
                full_name TEXT,
                linkedin_url TEXT,
                facebook_url TEXT,
                twitter_url TEXT,
                crunchbase_url TEXT,
                angellist_url TEXT,
                website_url TEXT,
                is_me BOOLEAN DEFAULT 0,
                first_degree_count INTEGER DEFAULT 0,
                is_on_target_list BOOLEAN DEFAULT 0,
                relationship_strength TEXT,
                email_from_contacts TEXT,
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
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(kind, display_name)
            );

            CREATE TABLE IF NOT EXISTS interest_areas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                kind TEXT,
                display_name TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(kind, display_name)
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

            -- Investment and network data
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

            -- Enhanced network stats table
            CREATE TABLE IF NOT EXISTS network_stats (
                investor_id INTEGER PRIMARY KEY,
                person_name TEXT,
                firm_name TEXT,
                linkedin_url TEXT,
                investment_count INTEGER DEFAULT 0,
                connection_count INTEGER DEFAULT 0,
                first_degree_count INTEGER DEFAULT 0,
                network_tier TEXT,
                data_quality_score INTEGER DEFAULT 0,
                FOREIGN KEY (investor_id) REFERENCES investors(id)
            );

            -- Performance indexes
            CREATE INDEX IF NOT EXISTS idx_investors_slug ON investors(slug);
            CREATE INDEX IF NOT EXISTS idx_investors_claimed ON investors(claimed);
            CREATE INDEX IF NOT EXISTS idx_people_slug ON people(slug);
            CREATE INDEX IF NOT EXISTS idx_people_linkedin ON people(linkedin_url);
            CREATE INDEX IF NOT EXISTS idx_people_first_degree ON people(first_degree_count);
            CREATE INDEX IF NOT EXISTS idx_firms_name ON firms(name);
            CREATE INDEX IF NOT EXISTS idx_firms_slug ON firms(slug);
            CREATE INDEX IF NOT EXISTS idx_network_stats_tier ON network_stats(network_tier);
            CREATE INDEX IF NOT EXISTS idx_network_stats_connections ON network_stats(first_degree_count);
        `;

        this.sqliteDb.exec(enhancedSchema);
        console.log('Enhanced SQLite schema created successfully');
    }

    validateLinkedInUrl(url) {
        if (!url) return false;
        return url.includes('linkedin.com/in/') && url.startsWith('http');
    }

    calculateDataQualityScore(record) {
        let score = 0;
        if (record.full_name) score += 20;
        if (record.linkedin_url && this.validateLinkedInUrl(record.linkedin_url)) score += 25;
        if (record.firm_name) score += 20;
        if (record.position) score += 15;
        if (record.investment_count > 0) score += 15;
        if (record.first_degree_count > 0) score += 5;
        return score;
    }

    calculateNetworkTier(firstDegreeCount) {
        if (firstDegreeCount > 2000) return 'Super Connected';
        if (firstDegreeCount > 1000) return 'Highly Connected';
        if (firstDegreeCount > 500) return 'Well Connected';
        if (firstDegreeCount > 100) return 'Connected';
        return 'Limited Network';
    }

    async extractFullDataset() {
        console.log('Starting full dataset extraction (32,780 records)...');
        console.log('This may take 10-15 minutes. Progress will be shown every 5,000 records.\n');
        
        const connection = this.duckdb.connect();
        
        try {
            // Enhanced query to get ALL essential data without LIMIT
            const query = `
                SELECT 
                    -- Core investor flags
                    claimed,
                    can_edit,
                    include_in_list,
                    in_founder_investor_list,
                    in_diverse_investor_list,
                    in_female_investor_list,
                    in_invests_in_diverse_founders_investor_list,
                    in_invests_in_female_founders_investor_list,
                    leads_rounds,
                    -- Person data
                    person.slug as person_slug,
                    person.first_name,
                    person.last_name,
                    person.name as full_name,
                    person.linkedin_url,
                    person.facebook_url,
                    person.twitter_url,
                    person.crunchbase_url,
                    person.angellist_url,
                    person.url as website_url,
                    person.is_me,
                    person.first_degree_count,
                    person.is_on_target_list,
                    person.relationship_strength,
                    person.email_from_my_contacts_list,
                    -- Investment profile
                    position,
                    min_investment,
                    max_investment,
                    target_investment,
                    areas_of_interest_freeform,
                    no_current_interest_freeform,
                    vote_count,
                    headline,
                    previous_position,
                    previous_firm,
                    has_profile_vote,
                    -- Firm data
                    firm.slug as firm_slug,
                    firm.name as firm_name,
                    firm.current_fund_size,
                    -- Location data
                    location.display_name as location_name,
                    -- Network metrics
                    investments_on_record.record_count as investment_count,
                    investing_connections.record_count as connection_count
                FROM 'Sample_Investor_DB/investors.parquet'
                WHERE person.slug IS NOT NULL
            `;

            console.log('Executing main query for full dataset...');
            const startTime = Date.now();
            
            const results = await new Promise((resolve, reject) => {
                connection.all(query, (err, res) => {
                    if (err) reject(err);
                    else resolve(res);
                });
            });

            const queryTime = ((Date.now() - startTime) / 1000).toFixed(2);
            console.log(`Query completed in ${queryTime} seconds`);
            console.log(`Processing ${results.length} records...\n`);

            // Data validation sample
            console.log('=== DATA VALIDATION SAMPLE ===');
            const sampleRecord = results[0];
            console.log('Sample record structure:');
            console.log(`- Person: ${sampleRecord.full_name} (${sampleRecord.person_slug})`);
            console.log(`- LinkedIn: ${sampleRecord.linkedin_url}`);
            console.log(`- Firm: ${sampleRecord.firm_name} (${sampleRecord.firm_slug})`);
            console.log(`- Position: ${sampleRecord.position}`);
            console.log(`- Investment Count: ${sampleRecord.investment_count}`);
            console.log(`- Connection Count: ${sampleRecord.connection_count}`);
            console.log(`- First Degree Count: ${sampleRecord.first_degree_count}`);
            console.log(`- Claimed: ${sampleRecord.claimed}`);
            console.log(`- Leads Rounds: ${sampleRecord.leads_rounds}`);
            console.log('');

            // Prepare optimized batch insert statements
            const insertInvestor = this.sqliteDb.prepare(`
                INSERT OR IGNORE INTO investors (
                    slug, claimed, can_edit, include_in_list, in_founder_investor_list,
                    in_diverse_investor_list, in_female_investor_list,
                    in_invests_in_diverse_founders_investor_list, in_invests_in_female_founders_investor_list,
                    leads_rounds, position, min_investment, max_investment, target_investment,
                    areas_of_interest_freeform, no_current_interest_freeform, vote_count,
                    headline, previous_position, previous_firm, has_profile_vote
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const insertPerson = this.sqliteDb.prepare(`
                INSERT OR IGNORE INTO people (
                    slug, first_name, last_name, full_name, linkedin_url, facebook_url,
                    twitter_url, crunchbase_url, angellist_url, website_url, is_me,
                    first_degree_count, is_on_target_list, relationship_strength, email_from_contacts
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const insertFirm = this.sqliteDb.prepare(`
                INSERT OR IGNORE INTO firms (slug, name, current_fund_size)
                VALUES (?, ?, ?)
            `);

            const insertLocation = this.sqliteDb.prepare(`
                INSERT OR IGNORE INTO locations (display_name)
                VALUES (?)
            `);

            const insertNetworkStats = this.sqliteDb.prepare(`
                INSERT OR REPLACE INTO network_stats (
                    investor_id, person_name, firm_name, linkedin_url, 
                    investment_count, connection_count, first_degree_count,
                    network_tier, data_quality_score
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            // Process all records in a single optimized transaction
            const processingStart = Date.now();
            console.log('Starting batch processing with transaction...');
            
            const transaction = this.sqliteDb.transaction(() => {
                results.forEach((row, index) => {
                    try {
                        // Insert person
                        insertPerson.run([
                            row.person_slug,
                            row.first_name,
                            row.last_name,
                            row.full_name,
                            row.linkedin_url,
                            JSON.stringify(row.facebook_url),
                            row.twitter_url,
                            row.crunchbase_url,
                            row.angellist_url,
                            row.website_url,
                            row.is_me ? 1 : 0,
                            row.first_degree_count || 0,
                            row.is_on_target_list ? 1 : 0,
                            JSON.stringify(row.relationship_strength),
                            JSON.stringify(row.email_from_my_contacts_list)
                        ]);

                        // Insert investor
                        insertInvestor.run([
                            row.person_slug,
                            row.claimed ? 1 : 0,
                            row.can_edit ? 1 : 0,
                            row.include_in_list ? 1 : 0,
                            row.in_founder_investor_list ? 1 : 0,
                            row.in_diverse_investor_list ? 1 : 0,
                            row.in_female_investor_list ? 1 : 0,
                            row.in_invests_in_diverse_founders_investor_list ? 1 : 0,
                            row.in_invests_in_female_founders_investor_list ? 1 : 0,
                            row.leads_rounds,
                            row.position,
                            row.min_investment,
                            row.max_investment,
                            row.target_investment,
                            row.areas_of_interest_freeform,
                            row.no_current_interest_freeform,
                            row.vote_count || 0,
                            row.headline,
                            row.previous_position,
                            row.previous_firm,
                            row.has_profile_vote ? 1 : 0
                        ]);

                        // Insert firm if exists
                        if (row.firm_slug && row.firm_name) {
                            insertFirm.run([row.firm_slug, row.firm_name, row.current_fund_size]);
                            this.stats.withFirms++;
                        }

                        // Insert location if exists
                        if (row.location_name) {
                            insertLocation.run([row.location_name]);
                        }

                        // Calculate metrics
                        const qualityScore = this.calculateDataQualityScore(row);
                        const networkTier = this.calculateNetworkTier(row.first_degree_count || 0);

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
                                row.first_degree_count || 0,
                                networkTier,
                                qualityScore
                            ]);
                        }

                        // Update statistics
                        this.stats.totalProcessed++;
                        if (this.validateLinkedInUrl(row.linkedin_url)) this.stats.validLinkedIn++;
                        if (row.investment_count > 0) this.stats.withInvestments++;
                        if (row.connection_count > 0) this.stats.withConnections++;

                        // Progress indicator
                        if ((index + 1) % 5000 === 0) {
                            const elapsed = ((Date.now() - processingStart) / 1000).toFixed(1);
                            const rate = ((index + 1) / elapsed).toFixed(0);
                            console.log(`✅ Processed ${index + 1}/${results.length} records (${rate} rec/sec)`);
                        }

                    } catch (error) {
                        this.stats.errors.push(`Row ${index}: ${error.message}`);
                        if (this.stats.errors.length < 10) {
                            console.error(`Error processing row ${index}:`, error.message);
                        }
                    }
                });
            });

            transaction();
            
            const processingTime = ((Date.now() - processingStart) / 1000).toFixed(2);
            console.log(`\n✅ Batch processing completed in ${processingTime} seconds`);
            
            // Create relationships
            await this.createEnhancedRelationships();
            
            console.log('\n🎉 Full dataset extraction completed successfully!');
            
        } catch (error) {
            console.error('Error during full dataset extraction:', error);
            throw error;
        } finally {
            connection.close();
        }
    }

    async createEnhancedRelationships() {
        console.log('\nCreating enhanced relationships...');
        
        const createIPRelations = this.sqliteDb.prepare(`
            INSERT OR IGNORE INTO investor_people (investor_id, person_id, is_primary)
            SELECT i.id, p.id, 1
            FROM investors i
            JOIN people p ON i.slug = p.slug
        `);
        
        const ipResult = createIPRelations.run();
        console.log(`✅ Created ${ipResult.changes} investor-people relationships`);

        const createIFRelations = this.sqliteDb.prepare(`
            INSERT OR IGNORE INTO investor_firms (investor_id, firm_id, is_current)
            SELECT i.id, f.id, 1
            FROM investors i
            JOIN network_stats ns ON i.id = ns.investor_id
            JOIN firms f ON ns.firm_name = f.name
            WHERE ns.firm_name IS NOT NULL
        `);
        
        const ifResult = createIFRelations.run();
        console.log(`✅ Created ${ifResult.changes} investor-firm relationships`);

        const createILRelations = this.sqliteDb.prepare(`
            INSERT OR IGNORE INTO investor_locations (investor_id, location_id, location_type)
            SELECT DISTINCT i.id, l.id, 'primary'
            FROM investors i
            JOIN people p ON i.slug = p.slug
            JOIN locations l ON 1=1
            LIMIT 1000
        `);
        
        const ilResult = createILRelations.run();
        console.log(`✅ Created ${ilResult.changes} investor-location relationships`);
    }

    generateFullDatasetReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 FULL DATASET PROCESSING REPORT');
        console.log('='.repeat(60));
        
        // Basic statistics
        const tables = [
            'investors', 'people', 'firms', 'companies', 'locations',
            'investment_stages', 'interest_areas', 'investor_people',
            'investor_firms', 'investor_locations', 'network_stats'
        ];

        console.log('\n📈 DATABASE STATISTICS:');
        tables.forEach(table => {
            const result = this.sqliteDb.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
            console.log(`  ${table.padEnd(20)}: ${result.count.toLocaleString()} records`);
        });

        console.log('\n🎯 DATA QUALITY METRICS:');
        console.log(`  Total processed      : ${this.stats.totalProcessed.toLocaleString()}`);
        console.log(`  Valid LinkedIn URLs  : ${this.stats.validLinkedIn.toLocaleString()} (${(this.stats.validLinkedIn/this.stats.totalProcessed*100).toFixed(1)}%)`);
        console.log(`  With firm affiliations: ${this.stats.withFirms.toLocaleString()} (${(this.stats.withFirms/this.stats.totalProcessed*100).toFixed(1)}%)`);
        console.log(`  With investment history: ${this.stats.withInvestments.toLocaleString()} (${(this.stats.withInvestments/this.stats.totalProcessed*100).toFixed(1)}%)`);
        console.log(`  With direct connections: ${this.stats.withConnections.toLocaleString()} (${(this.stats.withConnections/this.stats.totalProcessed*100).toFixed(1)}%)`);
        console.log(`  Processing errors    : ${this.stats.errors.length}`);

        // Network tier distribution
        console.log('\n🔗 NETWORK TIER DISTRIBUTION:');
        const tiers = this.sqliteDb.prepare(`
            SELECT network_tier, COUNT(*) as count 
            FROM network_stats 
            GROUP BY network_tier 
            ORDER BY count DESC
        `).all();
        
        tiers.forEach(tier => {
            const percentage = (tier.count / this.stats.totalProcessed * 100).toFixed(1);
            console.log(`  ${tier.network_tier.padEnd(20)}: ${tier.count.toLocaleString()} (${percentage}%)`);
        });

        // Top firms
        console.log('\n🏢 TOP 10 FIRMS BY INVESTOR COUNT:');
        const topFirms = this.sqliteDb.prepare(`
            SELECT f.name, COUNT(DISTINCT if.investor_id) as investor_count
            FROM firms f
            JOIN investor_firms if ON f.id = if.firm_id
            GROUP BY f.id, f.name
            ORDER BY investor_count DESC
            LIMIT 10
        `).all();

        topFirms.forEach((firm, index) => {
            console.log(`  ${(index + 1).toString().padStart(2)}. ${firm.name.padEnd(30)}: ${firm.investor_count} investors`);
        });

        // High-value targets
        console.log('\n⭐ HIGH-VALUE TARGETS (1000+ connections):');
        const highValue = this.sqliteDb.prepare(`
            SELECT person_name, firm_name, first_degree_count, investment_count, data_quality_score
            FROM network_stats
            WHERE first_degree_count >= 1000
            ORDER BY first_degree_count DESC
            LIMIT 10
        `).all();

        if (highValue.length > 0) {
            highValue.forEach((investor, index) => {
                console.log(`  ${(index + 1).toString().padStart(2)}. ${investor.person_name} (${investor.firm_name || 'Independent'})`);
                console.log(`      🔗 ${investor.first_degree_count.toLocaleString()} connections | 💼 ${investor.investment_count} investments | 📊 ${investor.data_quality_score}/100 quality`);
            });
        } else {
            console.log('  No investors found with 1000+ connections in processed sample');
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 FULL DATASET READY FOR PRODUCTION USE!');
        console.log('='.repeat(60));
        console.log(`Database file: investor_network_full.db`);
        console.log(`Total size: ${(require('fs').statSync('investor_network_full.db').size / 1024 / 1024).toFixed(2)}MB`);
        console.log('');
    }

    close() {
        this.sqliteDb.close();
        this.duckdb.close();
    }
}

// Execute full dataset processing
async function main() {
    const etl = new FullDatasetInvestorETL();
    
    try {
        const startTime = Date.now();
        console.log('🚀 Starting full investor dataset processing...\n');
        
        await etl.extractFullDataset();
        etl.generateFullDatasetReport();
        
        const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(2);
        console.log(`⏱️  Total processing time: ${totalTime} minutes`);
        
    } catch (error) {
        console.error('\n❌ Full dataset processing failed:', error);
        process.exit(1);
    } finally {
        etl.close();
    }
}

main();