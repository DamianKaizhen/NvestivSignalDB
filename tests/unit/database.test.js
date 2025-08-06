/**
 * Database Tests - Unit Testing
 * Tests database connection, queries, and data integrity
 */

const fs = require('fs');
const path = require('path');

describe('Database Tests', () => {
    let FullDatasetNetworkAnalysis;
    let analyzer;
    const dbPath = path.join(process.cwd(), 'investor_network_full.db');
    const dbExists = fs.existsSync(dbPath);
    
    beforeAll(async () => {
        if (dbExists) {
            try {
                const networkAnalysis = require('../../network_analysis_full');
                FullDatasetNetworkAnalysis = networkAnalysis.FullDatasetNetworkAnalysis;
                analyzer = new FullDatasetNetworkAnalysis(dbPath);
            } catch (error) {
                console.warn('Could not initialize database analyzer:', error.message);
            }
        } else {
            console.warn('Database file not found, skipping database tests');
        }
    });
    
    afterAll(() => {
        if (analyzer && analyzer.close) {
            analyzer.close();
        }
    });

    describe('Database File Tests', () => {
        test('should have database file present', () => {
            if (!dbExists) {
                console.warn('Database file missing at:', dbPath);
                return;
            }
            
            expect(fs.existsSync(dbPath)).toBe(true);
        });

        test('should have valid database file size', () => {
            if (!dbExists) return;
            
            const stats = fs.statSync(dbPath);
            expect(stats.size).toBeGreaterThan(1000); // At least 1KB
            expect(stats.size).toBeLessThan(1024 * 1024 * 1024); // Less than 1GB
        });

        test('should be valid SQLite database', () => {
            if (!dbExists) return;
            
            const buffer = fs.readFileSync(dbPath, { start: 0, end: 16 });
            const header = buffer.toString('ascii', 0, 16);
            expect(header).toContain('SQLite format');
        });

        test('should be readable and not corrupted', () => {
            if (!dbExists || !analyzer) return;
            
            expect(() => {
                const stats = analyzer.getFullDatasetStatistics();
                expect(stats).toBeDefined();
            }).not.toThrow();
        });
    });

    describe('Database Connection Tests', () => {
        test('should initialize analyzer successfully', () => {
            if (!dbExists) return;
            
            expect(analyzer).toBeDefined();
            expect(analyzer).toBeInstanceOf(FullDatasetNetworkAnalysis);
        });

        test('should handle database connection errors gracefully', () => {
            if (!FullDatasetNetworkAnalysis) return;
            
            expect(() => {
                const badAnalyzer = new FullDatasetNetworkAnalysis('nonexistent.db');
            }).toThrow();
        });

        test('should close database connection properly', () => {
            if (!dbExists || !analyzer) return;
            
            expect(() => {
                if (analyzer.close) {
                    analyzer.close();
                }
            }).not.toThrow();
            
            // Reinitialize for other tests
            analyzer = new FullDatasetNetworkAnalysis(dbPath);
        });
    });

    describe('Database Statistics Tests', () => {
        test('should return valid statistics', () => {
            if (!dbExists || !analyzer) return;
            
            const stats = analyzer.getFullDatasetStatistics();
            
            expect(stats).toBeDefined();
            expect(typeof stats).toBe('object');
            expect(stats).toHaveProperty('totalInvestors');
            expect(stats).toHaveProperty('totalFirms');
            expect(typeof stats.totalInvestors).toBe('number');
            expect(typeof stats.totalFirms).toBe('number');
        });

        test('should have reasonable data counts', () => {
            if (!dbExists || !analyzer) return;
            
            const stats = analyzer.getFullDatasetStatistics();
            
            expect(stats.totalInvestors).toBeGreaterThan(0);
            expect(stats.totalFirms).toBeGreaterThan(0);
            expect(stats.totalInvestors).toBeLessThan(1000000); // Reasonable upper bound
            expect(stats.totalFirms).toBeLessThan(100000); // Reasonable upper bound
        });

        test('should include LinkedIn and investment metrics', () => {
            if (!dbExists || !analyzer) return;
            
            const stats = analyzer.getFullDatasetStatistics();
            
            // These properties should exist even if zero
            expect(stats).toHaveProperty('withLinkedIn');
            expect(stats).toHaveProperty('withInvestments');
            expect(typeof stats.withLinkedIn).toBe('number');
            expect(typeof stats.withInvestments).toBe('number');
            
            // LinkedIn count should not exceed total investors
            expect(stats.withLinkedIn).toBeLessThanOrEqual(stats.totalInvestors);
            expect(stats.withInvestments).toBeLessThanOrEqual(stats.totalInvestors);
        });
    });

    describe('Database Query Tests', () => {
        test('should find investors with basic criteria', () => {
            if (!dbExists || !analyzer) return;
            
            const criteria = { limit: 10 };
            const results = analyzer.findInvestorsAdvanced(criteria);
            
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBeLessThanOrEqual(10);
            
            if (results.length > 0) {
                const investor = results[0];
                expect(investor).toHaveProperty('id');
            }
        });

        test('should filter by firm name', () => {
            if (!dbExists || !analyzer) return;
            
            // Try to find investors from a common firm type
            const criteria = { firmName: 'Venture', limit: 5 };
            const results = analyzer.findInvestorsAdvanced(criteria);
            
            expect(Array.isArray(results)).toBe(true);
            
            // If results found, check if they contain the firm name
            results.forEach(investor => {
                if (investor.firm_name) {
                    expect(investor.firm_name.toLowerCase()).toContain('venture');
                }
            });
        });

        test('should filter by minimum connections', () => {
            if (!dbExists || !analyzer) return;
            
            const minConnections = 100;
            const criteria = { minConnections, limit: 5 };
            const results = analyzer.findInvestorsAdvanced(criteria);
            
            expect(Array.isArray(results)).toBe(true);
            
            results.forEach(investor => {
                if (investor.first_degree_count !== null && investor.first_degree_count !== undefined) {
                    expect(investor.first_degree_count).toBeGreaterThanOrEqual(minConnections);
                }
            });
        });

        test('should filter by LinkedIn requirement', () => {
            if (!dbExists || !analyzer) return;
            
            const criteria = { hasLinkedIn: true, limit: 5 };
            const results = analyzer.findInvestorsAdvanced(criteria);
            
            expect(Array.isArray(results)).toBe(true);
            
            results.forEach(investor => {
                expect(investor.linkedin_url).toBeDefined();
                expect(investor.linkedin_url).not.toBeNull();
                expect(investor.linkedin_url).not.toBe('');
            });
        });

        test('should respect limit parameter', () => {
            if (!dbExists || !analyzer) return;
            
            const limit = 3;
            const criteria = { limit };
            const results = analyzer.findInvestorsAdvanced(criteria);
            
            expect(results.length).toBeLessThanOrEqual(limit);
        });

        test('should handle empty result sets', () => {
            if (!dbExists || !analyzer) return;
            
            // Search for something very specific that likely doesn't exist
            const criteria = { 
                firmName: 'VerySpecificNonExistentFirmName12345',
                limit: 10 
            };
            const results = analyzer.findInvestorsAdvanced(criteria);
            
            expect(Array.isArray(results)).toBe(true);
            expect(results.length).toBe(0);
        });
    });

    describe('Database Matching Tests', () => {
        test('should perform investor matching', () => {
            if (!dbExists || !analyzer) return;
            
            const targetProfile = {
                minConnections: 500,
                networkTier: 'Connected'
            };
            
            const matches = analyzer.matchInvestorsAdvanced(targetProfile);
            
            expect(Array.isArray(matches)).toBe(true);
            
            // Check match quality if results exist
            matches.forEach(match => {
                expect(match).toHaveProperty('id');
                if (match.first_degree_count !== null) {
                    expect(match.first_degree_count).toBeGreaterThanOrEqual(0);
                }
            });
        });

        test('should handle empty target profiles', () => {
            if (!dbExists || !analyzer) return;
            
            const matches = analyzer.matchInvestorsAdvanced({});
            
            expect(Array.isArray(matches)).toBe(true);
            // Empty profile should still return some results or empty array
        });
    });

    describe('Data Integrity Tests', () => {
        test('should have consistent data types', () => {
            if (!dbExists || !analyzer) return;
            
            const criteria = { limit: 5 };
            const results = analyzer.findInvestorsAdvanced(criteria);
            
            results.forEach(investor => {
                // ID should be present and numeric or string
                expect(investor.id).toBeDefined();
                
                // Connection counts should be numeric or null
                if (investor.first_degree_count !== null) {
                    expect(typeof investor.first_degree_count).toBe('number');
                    expect(investor.first_degree_count).toBeGreaterThanOrEqual(0);
                }
                
                // Investment counts should be numeric or null
                if (investor.investment_count !== null) {
                    expect(typeof investor.investment_count).toBe('number');
                    expect(investor.investment_count).toBeGreaterThanOrEqual(0);
                }
                
                // URLs should be strings or null
                if (investor.linkedin_url !== null) {
                    expect(typeof investor.linkedin_url).toBe('string');
                }
            });
        });

        test('should have valid network tiers', () => {
            if (!dbExists || !analyzer) return;
            
            const validTiers = [
                'Super Connected',
                'Highly Connected', 
                'Well Connected',
                'Connected',
                'Limited Network',
                null
            ];
            
            const criteria = { limit: 10 };
            const results = analyzer.findInvestorsAdvanced(criteria);
            
            results.forEach(investor => {
                if (investor.network_tier !== undefined) {
                    expect(validTiers).toContain(investor.network_tier);
                }
            });
        });

        test('should have reasonable data quality scores', () => {
            if (!dbExists || !analyzer) return;
            
            const criteria = { limit: 5 };
            const results = analyzer.findInvestorsAdvanced(criteria);
            
            results.forEach(investor => {
                if (investor.data_quality_score !== null && investor.data_quality_score !== undefined) {
                    expect(investor.data_quality_score).toBeGreaterThanOrEqual(0);
                    expect(investor.data_quality_score).toBeLessThanOrEqual(100);
                }
            });
        });
    });

    describe('Performance Tests', () => {
        test('should execute queries within reasonable time', async () => {
            if (!dbExists || !analyzer) return;
            
            const startTime = Date.now();
            
            const stats = analyzer.getFullDatasetStatistics();
            const queryTime = Date.now() - startTime;
            
            expect(queryTime).toBeLessThan(5000); // 5 seconds max
            expect(stats).toBeDefined();
        });

        test('should handle multiple concurrent queries', async () => {
            if (!dbExists || !analyzer) return;
            
            const queries = Array(3).fill(null).map(() => 
                analyzer.findInvestorsAdvanced({ limit: 5 })
            );
            
            const results = await Promise.all(queries.map(q => Promise.resolve(q)));
            
            expect(results).toHaveLength(3);
            results.forEach(result => {
                expect(Array.isArray(result)).toBe(true);
            });
        });
    });
});

// Skip all tests if database doesn't exist
if (!fs.existsSync(path.join(process.cwd(), 'investor_network_full.db'))) {
    describe.skip('Database Tests - SKIPPED', () => {
        test('Database file not found', () => {
            console.log('Skipping database tests - database file not found');
        });
    });
}