const Database = require('duckdb').Database;
const fs = require('fs');

async function exploreWithDuckDB() {
    const db = new Database(':memory:');
    
    try {
        console.log('=== PARQUET EXPLORATION WITH DUCKDB ===\n');
        
        // Basic file info
        const fileStats = fs.statSync('Sample_Investor_DB/investors.parquet');
        console.log(`File size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Last modified: ${fileStats.mtime}\n`);
        
        // Connect and query
        const connection = db.connect();
        
        // Get basic record count and column info
        console.log('=== BASIC DATA INFO ===');
        const countResult = await new Promise((resolve, reject) => {
            connection.all("SELECT COUNT(*) as total_records FROM 'Sample_Investor_DB/investors.parquet'", (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });
        console.log(`Total records: ${countResult[0].total_records}`);
        
        // Describe the table structure
        console.log('\n=== COLUMN STRUCTURE ===');
        const describeResult = await new Promise((resolve, reject) => {
            connection.all("DESCRIBE 'Sample_Investor_DB/investors.parquet'", (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });
        
        describeResult.forEach((col, index) => {
            console.log(`${index + 1}. ${col.column_name} (${col.column_type})`);
        });
        
        // Sample a few key fields
        console.log('\n=== SAMPLE DATA ===');
        const sampleResult = await new Promise((resolve, reject) => {
            connection.all(`
                SELECT 
                    person,
                    position,
                    min_investment,
                    max_investment,
                    firm,
                    location
                FROM 'Sample_Investor_DB/investors.parquet' 
                LIMIT 3
            `, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });
        
        sampleResult.forEach((record, index) => {
            console.log(`\nRecord ${index + 1}:`);
            console.log(`Person: ${JSON.stringify(record.person, null, 2)}`);
            console.log(`Position: ${record.position}`);
            console.log(`Investment Range: ${record.min_investment} - ${record.max_investment}`);
            console.log(`Firm: ${JSON.stringify(record.firm, null, 2)}`);
            console.log(`Location: ${JSON.stringify(record.location, null, 2)}`);
        });
        
        // Count records with network data
        console.log('\n=== NETWORK DATA AVAILABILITY ===');
        
        const networkStats = await new Promise((resolve, reject) => {
            connection.all(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(CASE WHEN investing_connections IS NOT NULL THEN 1 END) as with_connections,
                    COUNT(CASE WHEN investments_on_record IS NOT NULL THEN 1 END) as with_investments,
                    COUNT(CASE WHEN person.linkedin_url IS NOT NULL THEN 1 END) as with_linkedin,
                    COUNT(CASE WHEN firm.name IS NOT NULL THEN 1 END) as with_firm
                FROM 'Sample_Investor_DB/investors.parquet'
            `, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });
        
        const stats = networkStats[0];
        console.log(`Records with direct connections: ${stats.with_connections} (${(stats.with_connections/stats.total*100).toFixed(1)}%)`);
        console.log(`Records with investment history: ${stats.with_investments} (${(stats.with_investments/stats.total*100).toFixed(1)}%)`);
        console.log(`Records with LinkedIn URLs: ${stats.with_linkedin} (${(stats.with_linkedin/stats.total*100).toFixed(1)}%)`);
        console.log(`Records with firm data: ${stats.with_firm} (${(stats.with_firm/stats.total*100).toFixed(1)}%)`);
        
        // Look at investment stages
        console.log('\n=== INVESTMENT STAGES ANALYSIS ===');
        const stagesResult = await new Promise((resolve, reject) => {
            connection.all(`
                SELECT COUNT(*) as count_with_stages
                FROM 'Sample_Investor_DB/investors.parquet' 
                WHERE stages IS NOT NULL
            `, (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });
        console.log(`Records with stage preferences: ${stagesResult[0].count_with_stages}`);
        
        connection.close();
        db.close();
        
    } catch (error) {
        console.error('Error exploring data:', error);
        db.close();
    }
}

exploreWithDuckDB();