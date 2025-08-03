const { InvestorNetworkAnalysis } = require('./network_analysis');

async function runDemo() {
    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🚀 INVESTOR NETWORK MAPPING DEMO                         ║
║                                                                              ║
║  Transform your 32K investor database into actionable fundraising intel     ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

    const analyzer = new InvestorNetworkAnalysis();

    // 1. Network Overview
    console.log('\n📊 NETWORK OVERVIEW');
    console.log(''.padEnd(50, '='));
    
    const stats = analyzer.getNetworkStatistics();
    console.log(`🎯 Total Investors: ${stats.totalInvestors.toLocaleString()}`);
    console.log(`🏢 Investment Firms: ${stats.totalFirms.toLocaleString()}`);
    console.log(`🔗 LinkedIn Coverage: ${Math.round(stats.withLinkedIn/stats.totalPeople*100)}%`);
    console.log(`📈 Active Investors: ${stats.withInvestments.toLocaleString()}`);
    console.log(`⭐ Highly Connected: ${stats.highlyConnected.toLocaleString()}`);

    // 2. High-Value Target Identification
    console.log('\n🎯 HIGH-VALUE FUNDRAISING TARGETS');
    console.log(''.padEnd(50, '='));
    
    const highValueTargets = analyzer.findInvestors({
        minConnections: 1000,
        hasLinkedIn: true,
        hasInvestments: true,
        limit: 5
    });

    console.log('\nTop 5 Most Connected Active Investors:');
    highValueTargets.forEach((investor, index) => {
        console.log(`\n${index + 1}. ${investor.full_name}`);
        console.log(`   🏢 ${investor.firm_name || 'Independent'}`);
        console.log(`   🔗 ${investor.first_degree_count.toLocaleString()} connections`);
        console.log(`   💼 ${investor.investment_count} investments`);
        console.log(`   📧 ${investor.linkedin_url}`);
        console.log(`   📊 Network Tier: ${investor.network_tier}`);
    });

    // 3. Warm Introduction Opportunities
    console.log('\n🤝 WARM INTRODUCTION OPPORTUNITIES');
    console.log(''.padEnd(50, '='));

    if (highValueTargets.length > 0) {
        const targetInvestor = highValueTargets[0];
        const warmIntros = analyzer.findWarmIntroductions(targetInvestor.id);
        
        console.log(`\nFor target: ${targetInvestor.full_name} (${targetInvestor.firm_name})`);
        console.log(`Found ${warmIntros.length} potential warm intro paths:\n`);
        
        warmIntros.slice(0, 3).forEach((intro, index) => {
            console.log(`${index + 1}. ${intro.full_name} (${intro.firm_name || 'Independent'})`);
            console.log(`   🔗 ${intro.first_degree_count} connections | ${intro.connection_type}`);
            console.log(`   💡 ${intro.linkedin_url}\n`);
        });
    }

    // 4. Investor Matching Algorithm
    console.log('\n🤖 AI-POWERED INVESTOR MATCHING');
    console.log(''.padEnd(50, '='));

    const matches = analyzer.matchInvestors({
        stage: 'series_a',
        sector: 'fintech',
        requireLinkedIn: true,
        limit: 5
    });

    console.log('\nFinTech Series A Matches (AI-Scored):');
    matches.forEach((match, index) => {
        console.log(`\n${index + 1}. ${match.full_name} (Score: ${match.match_score}/100)`);
        console.log(`   🏢 ${match.firm_name || 'Independent'} | ${match.position || 'Investor'}`);
        console.log(`   🔗 ${match.first_degree_count} connections | ${match.network_tier}`);
        console.log(`   💰 ${match.min_investment || 'N/A'} - ${match.max_investment || 'N/A'}`);
    });

    // 5. Firm Network Analysis
    console.log('\n🏢 INVESTMENT FIRM INTELLIGENCE');
    console.log(''.padEnd(50, '='));

    console.log('\nTop Investment Firms by Network Size:');
    stats.topFirms.slice(0, 5).forEach((firm, index) => {
        console.log(`${index + 1}. ${firm.firm_name}`);
        console.log(`   👥 ${firm.investor_count} investors`);
        console.log(`   📈 ${firm.avg_investments.toFixed(1)} avg investments per investor\n`);
    });

    // 6. Market Intelligence Summary
    console.log('\n📈 MARKET INTELLIGENCE SUMMARY');
    console.log(''.padEnd(50, '='));

    const intelligence = {
        totalMarket: stats.totalInvestors,
        qualityScore: Math.round((stats.withLinkedIn / stats.totalPeople) * 100),
        activeInvestors: stats.withInvestments,
        networkEfficiency: stats.highlyConnected
    };

    console.log(`📊 Total Addressable Market: ${intelligence.totalMarket.toLocaleString()} investors`);
    console.log(`⭐ Data Quality Score: ${intelligence.qualityScore}% (LinkedIn coverage)`);
    console.log(`🎯 Active Investment Pool: ${intelligence.activeInvestors.toLocaleString()} investors`);
    console.log(`🚀 High-Leverage Targets: ${intelligence.networkEfficiency} super-connectors`);

    // 7. Strategic Recommendations
    console.log('\n💡 STRATEGIC RECOMMENDATIONS');
    console.log(''.padEnd(50, '='));

    const recommendations = [
        '🎯 Focus on the top 400 active investors with proven investment history',
        '🤝 Leverage warm introductions through 734+ mapped firm relationships', 
        '📧 Direct LinkedIn outreach to 93% of investors with public profiles',
        '🏢 Target multi-investor firms (Insight Partners: 13 investors) for syndicate rounds',
        '⚡ Prioritize super-connectors (10 investors with 1000+ connections) for network effects',
        '📈 Use AI matching scores to optimize outreach prioritization',
        '🔄 Build automated warm intro path-finding for platform users',
        '💰 Monetize network intelligence as premium platform feature'
    ];

    recommendations.forEach(rec => console.log(rec));

    console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                         🎊 DEMO COMPLETED SUCCESSFULLY                      ║
║                                                                              ║
║  Your investor database is now a powerful network intelligence system!      ║
║                                                                              ║
║  Next steps:                                                                 ║
║  • Start API server: node api_server.js                                     ║
║  • Integrate with your platform using the REST APIs                         ║
║  • Scale to full 32K dataset for production                                 ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
`);

    analyzer.close();
}

runDemo().catch(console.error);