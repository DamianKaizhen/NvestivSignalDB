const parquet = require('parquetjs');
const fs = require('fs');

async function exploreParquetData() {
    try {
        console.log('=== PARQUET DATA EXPLORATION ===\n');
        
        const reader = await parquet.ParquetReader.openFile('Sample_Investor_DB/investors.parquet');
        
        // Get basic info
        console.log('Basic Information:');
        console.log(`- File size: ${(fs.statSync('Sample_Investor_DB/investors.parquet').size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`- Schema fields: ${reader.schema.fields.length}`);
        
        // Sample a few records to understand structure
        console.log('\n=== SAMPLING RECORDS ===');
        const cursor = reader.getCursor();
        let record;
        let count = 0;
        let sampleRecords = [];
        
        while ((record = await cursor.next()) && count < 3) {
            sampleRecords.push(record);
            count++;
        }
        
        // Analyze structure
        console.log('\n=== NESTED DATA ANALYSIS ===');
        
        if (sampleRecords.length > 0) {
            const firstRecord = sampleRecords[0];
            
            // Analyze person data
            if (firstRecord.person) {
                console.log('\nPERSON nested structure:');
                console.log(JSON.stringify(firstRecord.person, null, 2));
            }
            
            // Analyze investing connections
            if (firstRecord.investing_connections) {
                console.log('\nINVESTING_CONNECTIONS structure:');
                console.log(`Record count: ${firstRecord.investing_connections.record_count}`);
                if (firstRecord.investing_connections.edges && firstRecord.investing_connections.edges.length > 0) {
                    console.log('Sample connection:');
                    console.log(JSON.stringify(firstRecord.investing_connections.edges[0], null, 2));
                }
            }
            
            // Analyze investments
            if (firstRecord.investments_on_record) {
                console.log('\nINVESTMENTS_ON_RECORD structure:');
                console.log(`Record count: ${firstRecord.investments_on_record.record_count}`);
                if (firstRecord.investments_on_record.edges && firstRecord.investments_on_record.edges.length > 0) {
                    console.log('Sample investment:');
                    console.log(JSON.stringify(firstRecord.investments_on_record.edges[0], null, 2));
                }
            }
            
            // Analyze co-investor patterns
            if (firstRecord.investments_on_record && firstRecord.investments_on_record.edges) {
                let totalCoinvestors = 0;
                let companiesWithCoinvestors = 0;
                
                firstRecord.investments_on_record.edges.forEach(edge => {
                    if (edge.node && edge.node.coinvestor_names && edge.node.coinvestor_names.length > 0) {
                        totalCoinvestors += edge.node.coinvestor_names.length;
                        companiesWithCoinvestors++;
                    }
                });
                
                console.log(`\nCO-INVESTOR ANALYSIS for first record:`);
                console.log(`- Companies with co-investors: ${companiesWithCoinvestors}`);
                console.log(`- Total co-investor relationships: ${totalCoinvestors}`);
            }
        }
        
        // Count records with key networking data
        console.log('\n=== NETWORK DATA AVAILABILITY ===');
        let totalRecords = 0;
        let recordsWithConnections = 0;
        let recordsWithInvestments = 0;
        let recordsWithCoinvestors = 0;
        let recordsWithLinkedIn = 0;
        
        const fullCursor = reader.getCursor();
        let rec;
        
        while (rec = await fullCursor.next()) {
            totalRecords++;
            
            if (rec.investing_connections && rec.investing_connections.record_count > 0) {
                recordsWithConnections++;
            }
            
            if (rec.investments_on_record && rec.investments_on_record.record_count > 0) {
                recordsWithInvestments++;
            }
            
            if (rec.person && rec.person.linkedin_url) {
                recordsWithLinkedIn++;
            }
            
            // Check for co-investors
            if (rec.investments_on_record && rec.investments_on_record.edges) {
                const hasCoinvestors = rec.investments_on_record.edges.some(edge => 
                    edge.node && edge.node.coinvestor_names && edge.node.coinvestor_names.length > 0
                );
                if (hasCoinvestors) {
                    recordsWithCoinvestors++;
                }
            }
            
            // Progress indicator
            if (totalRecords % 5000 === 0) {
                console.log(`Processed ${totalRecords} records...`);
            }
        }
        
        console.log(`\nNETWORK DATA STATISTICS:`);
        console.log(`- Total records: ${totalRecords}`);
        console.log(`- Records with direct connections: ${recordsWithConnections} (${(recordsWithConnections/totalRecords*100).toFixed(1)}%)`);
        console.log(`- Records with investment history: ${recordsWithInvestments} (${(recordsWithInvestments/totalRecords*100).toFixed(1)}%)`);
        console.log(`- Records with co-investors: ${recordsWithCoinvestors} (${(recordsWithCoinvestors/totalRecords*100).toFixed(1)}%)`);
        console.log(`- Records with LinkedIn: ${recordsWithLinkedIn} (${(recordsWithLinkedIn/totalRecords*100).toFixed(1)}%)`);
        
        await reader.close();
        
    } catch (error) {
        console.error('Error exploring parquet data:', error);
    }
}

exploreParquetData();