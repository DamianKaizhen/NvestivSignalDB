-- ============================================================================
-- 10 INTUITIVE RESEARCH VIEWS FOR INVESTOR DATABASE
-- Run these in your PostgreSQL client to create powerful research views
-- ============================================================================

-- 1. 👥 INVESTOR PROFILES VIEW
-- Complete investor information in one easy-to-query view
CREATE OR REPLACE VIEW investor_profiles AS
SELECT 
    i.id as investor_id,
    p.name as investor_name,
    p.first_name,
    p.last_name,
    p.linkedin_url,
    p.twitter_url,
    p.crunchbase_url,
    f.name as firm_name,
    f.current_fund_size,
    i.position,
    i.headline,
    l.display_name as location,
    i.min_investment,
    i.max_investment,
    i.target_investment,
    i.vote_count,
    i.claimed,
    i.in_founder_investor_list,
    i.in_diverse_investor_list,
    i.in_female_investor_list,
    i.in_invests_in_diverse_founders_investor_list,
    i.in_invests_in_female_founders_investor_list,
    -- Count metrics
    (SELECT COUNT(*) FROM areas_of_interest aoi WHERE aoi.investor_id = i.id) as focus_areas_count,
    (SELECT COUNT(*) FROM investments inv WHERE inv.investor_id = i.id) as investments_count,
    (SELECT COUNT(*) FROM investment_locations il WHERE il.investor_id = i.id) as investment_locations_count
FROM investors i
LEFT JOIN persons p ON i.person_id = p.id
LEFT JOIN firms f ON i.firm_id = f.id
LEFT JOIN locations l ON i.location_id = l.id;

-- 2. 🏢 FIRM ANALYSIS VIEW
-- Comprehensive firm metrics and portfolio analysis
CREATE OR REPLACE VIEW firm_analysis AS
SELECT 
    f.id as firm_id,
    f.name as firm_name,
    f.current_fund_size,
    COUNT(DISTINCT i.id) as total_investors,
    COUNT(DISTINCT CASE WHEN i.in_diverse_investor_list THEN i.id END) as diverse_investors,
    COUNT(DISTINCT CASE WHEN i.in_female_investor_list THEN i.id END) as female_investors,
    COUNT(DISTINCT l.display_name) as geographic_presence,
    ROUND(AVG(i.vote_count), 1) as avg_vote_count,
    COUNT(DISTINCT inv.id) as total_investments,
    COUNT(DISTINCT inv.company_display_name) as unique_portfolio_companies,
    -- Diversity percentages
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN i.in_diverse_investor_list THEN i.id END) / 
          NULLIF(COUNT(DISTINCT i.id), 0), 1) as diversity_percentage,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN i.in_female_investor_list THEN i.id END) / 
          NULLIF(COUNT(DISTINCT i.id), 0), 1) as female_percentage
FROM firms f
LEFT JOIN investors i ON f.id = i.firm_id
LEFT JOIN locations l ON i.location_id = l.id
LEFT JOIN investments inv ON i.id = inv.investor_id
GROUP BY f.id, f.name, f.current_fund_size
HAVING COUNT(DISTINCT i.id) > 0;

-- 3. 💰 INVESTMENT ACTIVITY VIEW
-- Track investment portfolio and activity
CREATE OR REPLACE VIEW investment_activity AS
SELECT 
    i.id as investor_id,
    p.name as investor_name,
    f.name as firm_name,
    inv.company_display_name,
    inv.total_raised_json,
    i.leads_rounds,
    l.display_name as investor_location,
    i.position,
    i.target_investment,
    -- Investment counts per investor
    (SELECT COUNT(*) FROM investments inv2 WHERE inv2.investor_id = i.id) as total_portfolio_companies
FROM investments inv
JOIN investors i ON inv.investor_id = i.id
LEFT JOIN persons p ON i.person_id = p.id
LEFT JOIN firms f ON i.firm_id = f.id
LEFT JOIN locations l ON i.location_id = l.id;

-- 4. 🌍 GEOGRAPHIC INVESTMENT MAP
-- Understanding investment flows by geography
CREATE OR REPLACE VIEW geographic_investment_map AS
SELECT 
    l.display_name as investor_location,
    l.kind as location_type,
    COUNT(DISTINCT i.id) as investors_count,
    COUNT(DISTINCT f.id) as firms_count,
    COUNT(DISTINCT inv.id) as investments_count,
    COUNT(DISTINCT inv.company_display_name) as unique_portfolio_companies,
    -- Diversity metrics by location
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN i.in_diverse_investor_list THEN i.id END) / 
          NULLIF(COUNT(DISTINCT i.id), 0), 1) as diversity_percentage,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN i.in_female_investor_list THEN i.id END) / 
          NULLIF(COUNT(DISTINCT i.id), 0), 1) as female_percentage,
    -- Average investment metrics
    ROUND(AVG(i.vote_count), 1) as avg_vote_count
FROM locations l
LEFT JOIN investors i ON l.id = i.location_id
LEFT JOIN firms f ON i.firm_id = f.id
LEFT JOIN investments inv ON i.id = inv.investor_id
GROUP BY l.id, l.display_name, l.kind
HAVING COUNT(DISTINCT i.id) > 0
ORDER BY investors_count DESC;

-- 5. 🎯 SECTOR FOCUS ANALYSIS
-- Deep dive into investment focus areas and trends
CREATE OR REPLACE VIEW sector_focus_analysis AS
SELECT 
    aoi.display_name as focus_area,
    aoi.kind as focus_category,
    COUNT(DISTINCT aoi.investor_id) as investors_count,
    COUNT(DISTINCT i.firm_id) as firms_involved,
    COUNT(DISTINCT inv.id) as related_investments,
    COUNT(DISTINCT l.display_name) as geographic_spread,
    -- Investment activity metrics
    ROUND(AVG(i.vote_count), 1) as avg_investor_votes,
    -- Diversity in this sector
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN i.in_diverse_investor_list THEN i.id END) / 
          NULLIF(COUNT(DISTINCT aoi.investor_id), 0), 1) as diversity_percentage,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN i.in_female_investor_list THEN i.id END) / 
          NULLIF(COUNT(DISTINCT aoi.investor_id), 0), 1) as female_percentage
FROM areas_of_interest aoi
LEFT JOIN investors i ON aoi.investor_id = i.id
LEFT JOIN investments inv ON i.id = inv.investor_id
LEFT JOIN locations l ON i.location_id = l.id
GROUP BY aoi.display_name, aoi.kind
ORDER BY investors_count DESC;

-- 6. 📈 INVESTMENT STAGE PREFERENCES
-- Understanding funding stage focus across ecosystem
CREATE OR REPLACE VIEW stage_preferences_analysis AS
SELECT 
    ist.display_name as investment_stage,
    ist.kind as stage_category,
    COUNT(DISTINCT ist.investor_id) as investors_count,
    COUNT(DISTINCT i.firm_id) as firms_count,
    COUNT(DISTINCT l.display_name) as geographic_spread,
    -- Related investment activity
    COUNT(DISTINCT inv.id) as related_investments,
    ROUND(AVG(i.vote_count), 1) as avg_investor_votes
FROM investor_stages ist
LEFT JOIN investors i ON ist.investor_id = i.id
LEFT JOIN investments inv ON i.id = inv.investor_id
LEFT JOIN locations l ON i.location_id = l.id
GROUP BY ist.display_name, ist.kind
ORDER BY investors_count DESC;

-- 7. 🏆 TOP PERFORMERS & ACTIVE INVESTORS
-- Identify the most active and influential investors
CREATE OR REPLACE VIEW top_performers AS
SELECT 
    p.name as investor_name,
    f.name as firm_name,
    i.position,
    l.display_name as location,
    -- Activity metrics
    COUNT(DISTINCT inv.id) as total_investments,
    COUNT(DISTINCT inv.company_display_name) as unique_companies,
    i.vote_count,
    i.leads_rounds,
    -- Influence indicators
    CASE WHEN i.in_founder_investor_list THEN 'Yes' ELSE 'No' END as founder_investor,
    CASE WHEN i.claimed THEN 'Verified' ELSE 'Unverified' END as profile_status,
    -- Social presence
    CASE WHEN p.linkedin_url IS NOT NULL THEN 'Yes' ELSE 'No' END as has_linkedin,
    CASE WHEN p.twitter_url IS NOT NULL THEN 'Yes' ELSE 'No' END as has_twitter,
    -- Diversity indicators
    CASE WHEN i.in_diverse_investor_list THEN 'Yes' ELSE 'No' END as diverse_investor,
    CASE WHEN i.in_female_investor_list THEN 'Yes' ELSE 'No' END as female_investor,
    -- Activity score (weighted combination)
    (COALESCE(COUNT(DISTINCT inv.id), 0) * 3 + 
     COALESCE(i.vote_count, 0) + 
     CASE WHEN i.claimed THEN 10 ELSE 0 END +
     CASE WHEN i.in_founder_investor_list THEN 5 ELSE 0 END) as activity_score
FROM investors i
LEFT JOIN persons p ON i.person_id = p.id
LEFT JOIN firms f ON i.firm_id = f.id
LEFT JOIN locations l ON i.location_id = l.id
LEFT JOIN investments inv ON i.id = inv.investor_id
GROUP BY i.id, p.name, f.name, i.position, l.display_name, i.vote_count, 
         i.leads_rounds, i.in_founder_investor_list, i.claimed, 
         p.linkedin_url, p.twitter_url, i.in_diverse_investor_list, i.in_female_investor_list
ORDER BY activity_score DESC;

-- 8. 🌈 DIVERSITY & INCLUSION METRICS
-- Track diversity across the investor ecosystem
CREATE OR REPLACE VIEW diversity_metrics AS
-- Overall metrics
SELECT 
    'Overall Ecosystem' as segment_type,
    'All Investors' as segment_name,
    COUNT(*) as total_investors,
    COUNT(CASE WHEN i.in_diverse_investor_list THEN 1 END) as diverse_investors,
    COUNT(CASE WHEN i.in_female_investor_list THEN 1 END) as female_investors,
    ROUND(100.0 * COUNT(CASE WHEN i.in_diverse_investor_list THEN 1 END) / COUNT(*), 1) as diversity_percentage,
    ROUND(100.0 * COUNT(CASE WHEN i.in_female_investor_list THEN 1 END) / COUNT(*), 1) as female_percentage,
    COUNT(CASE WHEN i.in_invests_in_diverse_founders_investor_list THEN 1 END) as invests_diverse_founders,
    COUNT(CASE WHEN i.in_invests_in_female_founders_investor_list THEN 1 END) as invests_female_founders
FROM investors i

UNION ALL

-- By top firms (5+ investors)
SELECT 
    'Firm' as segment_type,
    f.name as segment_name,
    COUNT(*) as total_investors,
    COUNT(CASE WHEN i.in_diverse_investor_list THEN 1 END) as diverse_investors,
    COUNT(CASE WHEN i.in_female_investor_list THEN 1 END) as female_investors,
    ROUND(100.0 * COUNT(CASE WHEN i.in_diverse_investor_list THEN 1 END) / COUNT(*), 1) as diversity_percentage,
    ROUND(100.0 * COUNT(CASE WHEN i.in_female_investor_list THEN 1 END) / COUNT(*), 1) as female_percentage,
    COUNT(CASE WHEN i.in_invests_in_diverse_founders_investor_list THEN 1 END) as invests_diverse_founders,
    COUNT(CASE WHEN i.in_invests_in_female_founders_investor_list THEN 1 END) as invests_female_founders
FROM investors i
LEFT JOIN firms f ON i.firm_id = f.id
WHERE f.name IS NOT NULL
GROUP BY f.name
HAVING COUNT(*) >= 5

UNION ALL

-- By major locations (20+ investors)
SELECT 
    'Location' as segment_type,
    l.display_name as segment_name,
    COUNT(*) as total_investors,
    COUNT(CASE WHEN i.in_diverse_investor_list THEN 1 END) as diverse_investors,
    COUNT(CASE WHEN i.in_female_investor_list THEN 1 END) as female_investors,
    ROUND(100.0 * COUNT(CASE WHEN i.in_diverse_investor_list THEN 1 END) / COUNT(*), 1) as diversity_percentage,
    ROUND(100.0 * COUNT(CASE WHEN i.in_female_investor_list THEN 1 END) / COUNT(*), 1) as female_percentage,
    COUNT(CASE WHEN i.in_invests_in_diverse_founders_investor_list THEN 1 END) as invests_diverse_founders,
    COUNT(CASE WHEN i.in_invests_in_female_founders_investor_list THEN 1 END) as invests_female_founders
FROM investors i
LEFT JOIN locations l ON i.location_id = l.id
WHERE l.display_name IS NOT NULL
GROUP BY l.display_name
HAVING COUNT(*) >= 20
ORDER BY diversity_percentage DESC;

-- 9. 🔗 NETWORK CONNECTIONS
-- Explore relationships between investors
CREATE OR REPLACE VIEW network_connections AS
-- Same firm connections
SELECT 
    p1.name as investor_1,
    f1.name as firm_1,
    p2.name as investor_2,
    f2.name as firm_2,
    'Same Firm Colleagues' as connection_type,
    3 as connection_strength,
    l1.display_name as location_1,
    l2.display_name as location_2
FROM investors i1
JOIN investors i2 ON i1.firm_id = i2.firm_id AND i1.id < i2.id
JOIN persons p1 ON i1.person_id = p1.id
JOIN persons p2 ON i2.person_id = p2.id
LEFT JOIN firms f1 ON i1.firm_id = f1.id
LEFT JOIN firms f2 ON i2.firm_id = f2.id
LEFT JOIN locations l1 ON i1.location_id = l1.id
LEFT JOIN locations l2 ON i2.location_id = l2.id
WHERE i1.firm_id IS NOT NULL

UNION ALL

-- Same location connections (different firms)
SELECT 
    p1.name as investor_1,
    f1.name as firm_1,
    p2.name as investor_2,
    f2.name as firm_2,
    'Same Location Network' as connection_type,
    2 as connection_strength,
    l1.display_name as location_1,
    l2.display_name as location_2
FROM investors i1
JOIN investors i2 ON i1.location_id = i2.location_id AND i1.id < i2.id
JOIN persons p1 ON i1.person_id = p1.id
JOIN persons p2 ON i2.person_id = p2.id
LEFT JOIN firms f1 ON i1.firm_id = f1.id
LEFT JOIN firms f2 ON i2.firm_id = f2.id
LEFT JOIN locations l1 ON i1.location_id = l1.id
LEFT JOIN locations l2 ON i2.location_id = l2.id
WHERE i1.location_id IS NOT NULL 
AND (i1.firm_id != i2.firm_id OR i1.firm_id IS NULL OR i2.firm_id IS NULL);

-- 10. 🔍 COMPREHENSIVE SEARCH VIEW
-- The ultimate research view - searchable across all dimensions
CREATE OR REPLACE VIEW comprehensive_search AS
SELECT 
    i.id as investor_id,
    p.name as investor_name,
    p.first_name,
    p.last_name,
    f.name as firm_name,
    f.current_fund_size,
    i.position,
    i.headline,
    l.display_name as location,
    i.min_investment,
    i.max_investment,
    i.target_investment,
    -- Comprehensive searchable text field
    (COALESCE(p.name, '') || ' ' || 
     COALESCE(f.name, '') || ' ' || 
     COALESCE(i.position, '') || ' ' || 
     COALESCE(i.headline, '') || ' ' ||
     COALESCE(l.display_name, '') || ' ' ||
     COALESCE(i.min_investment, '') || ' ' ||
     COALESCE(i.max_investment, '') || ' ' ||
     COALESCE(i.target_investment, '')) as searchable_text,
    -- Metrics for ranking and filtering
    COALESCE((SELECT COUNT(*) FROM investments inv WHERE inv.investor_id = i.id), 0) as investments_count,
    COALESCE((SELECT COUNT(*) FROM areas_of_interest aoi WHERE aoi.investor_id = i.id), 0) as focus_areas_count,
    COALESCE(i.vote_count, 0) as vote_count,
    -- Boolean flags for filtering
    i.claimed,
    i.in_founder_investor_list,
    i.in_diverse_investor_list,
    i.in_female_investor_list,
    i.in_invests_in_diverse_founders_investor_list,
    i.in_invests_in_female_founders_investor_list,
    -- Contact information
    p.linkedin_url,
    p.twitter_url,
    p.crunchbase_url,
    p.angellist_url,
    -- Relevance score for ranking search results
    (COALESCE((SELECT COUNT(*) FROM investments inv WHERE inv.investor_id = i.id), 0) * 3 + 
     COALESCE(i.vote_count, 0) + 
     COALESCE((SELECT COUNT(*) FROM areas_of_interest aoi WHERE aoi.investor_id = i.id), 0) +
     CASE WHEN i.claimed THEN 10 ELSE 0 END +
     CASE WHEN i.in_founder_investor_list THEN 5 ELSE 0 END +
     CASE WHEN p.linkedin_url IS NOT NULL THEN 2 ELSE 0 END) as relevance_score
FROM investors i
LEFT JOIN persons p ON i.person_id = p.id
LEFT JOIN firms f ON i.firm_id = f.id
LEFT JOIN locations l ON i.location_id = l.id;

-- ============================================================================
-- SAMPLE QUERIES TO GET YOU STARTED
-- ============================================================================

/*
-- 1. Find top fintech investors in San Francisco
SELECT investor_name, firm_name, focus_areas_count, investments_count
FROM investor_profiles 
WHERE location ILIKE '%san francisco%'
AND investor_id IN (
    SELECT investor_id FROM areas_of_interest 
    WHERE display_name ILIKE '%fintech%'
)
ORDER BY investments_count DESC, focus_areas_count DESC
LIMIT 10;

-- 2. Analyze diversity by top investment firms
SELECT firm_name, total_investors, diversity_percentage, female_percentage
FROM firm_analysis 
WHERE total_investors >= 10
ORDER BY diversity_percentage DESC;

-- 3. Find most active sectors
SELECT focus_area, investors_count, firms_involved, geographic_spread
FROM sector_focus_analysis 
ORDER BY investors_count DESC
LIMIT 15;

-- 4. Search for AI/ML investors
SELECT investor_name, firm_name, location, relevance_score
FROM comprehensive_search 
WHERE searchable_text ILIKE '%artificial intelligence%' 
   OR searchable_text ILIKE '%machine learning%'
   OR searchable_text ILIKE '%AI%'
ORDER BY relevance_score DESC
LIMIT 20;

-- 5. Find network connections in same location
SELECT investor_1, firm_1, investor_2, firm_2, connection_type
FROM network_connections 
WHERE location_1 ILIKE '%new york%'
ORDER BY connection_strength DESC
LIMIT 20;
*/