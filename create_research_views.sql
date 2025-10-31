-- =====================================================
-- INTUITIVE RESEARCH VIEWS FOR INVESTOR DATABASE
-- =====================================================
-- These views make the database extremely easy to query
-- for research, analysis, and discovery purposes
-- =====================================================

-- 1. COMPREHENSIVE INVESTOR PROFILES
-- The most important view - complete investor information in one place
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
    i.leads_rounds,
    i.claimed,
    i.in_founder_investor_list,
    i.in_diverse_investor_list,
    i.in_female_investor_list,
    -- Aggregated counts
    (SELECT COUNT(*) FROM areas_of_interest aoi WHERE aoi.investor_id = i.id) as interest_areas_count,
    (SELECT COUNT(*) FROM investments inv WHERE inv.investor_id = i.id) as investments_count,
    (SELECT COUNT(*) FROM image_urls img WHERE img.investor_id = i.id) as image_count,
    -- Interest areas as comma-separated string
    (SELECT STRING_AGG(aoi.display_name, ', ') 
     FROM areas_of_interest aoi 
     WHERE aoi.investor_id = i.id) as interest_areas,
    -- Investment locations as comma-separated string  
    (SELECT STRING_AGG(DISTINCT il.display_name, ', ') 
     FROM investment_locations il 
     WHERE il.investor_id = i.id) as investment_locations,
    -- Investment stages as comma-separated string
    (SELECT STRING_AGG(DISTINCT ist.display_name, ', ') 
     FROM investor_stages ist 
     WHERE ist.investor_id = i.id) as investment_stages
FROM investors i
LEFT JOIN persons p ON i.person_id = p.id
LEFT JOIN firms f ON i.firm_id = f.id
LEFT JOIN locations l ON i.location_id = l.id;

-- 2. FIRM ANALYSIS VIEW
-- Comprehensive firm metrics and aggregations
CREATE OR REPLACE VIEW firm_analysis AS
SELECT 
    f.id as firm_id,
    f.name as firm_name,
    f.slug as firm_slug,
    f.current_fund_size,
    -- Investor counts
    COUNT(DISTINCT i.id) as total_investors,
    COUNT(DISTINCT CASE WHEN i.in_diverse_investor_list THEN i.id END) as diverse_investors,
    COUNT(DISTINCT CASE WHEN i.in_female_investor_list THEN i.id END) as female_investors,
    -- Investment activity
    COUNT(DISTINCT inv.id) as total_investments,
    COUNT(DISTINCT inv.company_display_name) as unique_companies_invested,
    -- Geographic presence
    COUNT(DISTINCT l.display_name) as locations_count,
    STRING_AGG(DISTINCT l.display_name, ', ') as locations,
    -- Top focus areas
    (SELECT STRING_AGG(focus_area, ', ') 
     FROM (
        SELECT aoi.display_name as focus_area, COUNT(*) as cnt
        FROM areas_of_interest aoi 
        JOIN investors i2 ON aoi.investor_id = i2.id 
        WHERE i2.firm_id = f.id
        GROUP BY aoi.display_name 
        ORDER BY cnt DESC 
        LIMIT 5
     ) top_areas) as top_focus_areas,
    -- Average metrics
    AVG(i.vote_count) as avg_vote_count,
    -- Most common position
    (SELECT i.position 
     FROM investors i2 
     WHERE i2.firm_id = f.id AND i2.position IS NOT NULL
     GROUP BY i2.position 
     ORDER BY COUNT(*) DESC 
     LIMIT 1) as most_common_position
FROM firms f
LEFT JOIN investors i ON f.id = i.firm_id
LEFT JOIN investments inv ON i.id = inv.investor_id
LEFT JOIN locations l ON i.location_id = l.id
GROUP BY f.id, f.name, f.slug, f.current_fund_size;

-- 3. INVESTMENT ACTIVITY SUMMARY
-- Track who's investing in what and how much
CREATE OR REPLACE VIEW investment_activity AS
SELECT 
    i.id as investor_id,
    p.name as investor_name,
    f.name as firm_name,
    inv.company_display_name,
    inv.total_raised_json,
    -- Extract individual investment details if available
    CASE 
        WHEN inv.total_raised_json IS NOT NULL 
        THEN LENGTH(inv.total_raised_json::text) - LENGTH(REPLACE(inv.total_raised_json::text, ',', '')) + 1 
        ELSE 0 
    END as funding_rounds_count,
    i.leads_rounds,
    l.display_name as investor_location,
    -- Investment stage preferences
    (SELECT STRING_AGG(ist.display_name, ', ') 
     FROM investor_stages ist 
     WHERE ist.investor_id = i.id) as preferred_stages,
    -- Related areas of interest
    (SELECT STRING_AGG(aoi.display_name, ', ') 
     FROM areas_of_interest aoi 
     WHERE aoi.investor_id = i.id) as investor_focus_areas
FROM investments inv
JOIN investors i ON inv.investor_id = i.id
LEFT JOIN persons p ON i.person_id = p.id
LEFT JOIN firms f ON i.firm_id = f.id
LEFT JOIN locations l ON i.location_id = l.id;

-- 4. GEOGRAPHIC INVESTMENT MAPPING
-- Understanding investment flows by geography
CREATE OR REPLACE VIEW geographic_investment_map AS
SELECT 
    l.display_name as investor_location,
    l.kind as location_type,
    COUNT(DISTINCT i.id) as investors_count,
    COUNT(DISTINCT f.id) as firms_count,
    COUNT(DISTINCT inv.id) as investments_count,
    COUNT(DISTINCT inv.company_display_name) as unique_companies,
    -- Top investment locations from this base
    (SELECT STRING_AGG(il.display_name, ', ') 
     FROM (
        SELECT il.display_name, COUNT(*) as cnt
        FROM investment_locations il
        JOIN investors i2 ON il.investor_id = i2.id
        WHERE i2.location_id = l.id
        GROUP BY il.display_name
        ORDER BY cnt DESC
        LIMIT 5
     ) top_inv_locs) as top_investment_destinations,
    -- Top focus areas by geography
    (SELECT STRING_AGG(aoi.display_name, ', ')
     FROM (
        SELECT aoi.display_name, COUNT(*) as cnt
        FROM areas_of_interest aoi
        JOIN investors i2 ON aoi.investor_id = i2.id
        WHERE i2.location_id = l.id
        GROUP BY aoi.display_name
        ORDER BY cnt DESC
        LIMIT 3
     ) top_areas) as regional_focus_areas,
    -- Diversity metrics by location
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN i.in_diverse_investor_list THEN i.id END) / 
          NULLIF(COUNT(DISTINCT i.id), 0), 1) as diversity_percentage,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN i.in_female_investor_list THEN i.id END) / 
          NULLIF(COUNT(DISTINCT i.id), 0), 1) as female_percentage
FROM locations l
LEFT JOIN investors i ON l.id = i.location_id
LEFT JOIN firms f ON i.firm_id = f.id
LEFT JOIN investments inv ON i.id = inv.investor_id
GROUP BY l.id, l.display_name, l.kind
HAVING COUNT(DISTINCT i.id) > 0;

-- 5. SECTOR & INDUSTRY FOCUS ANALYSIS
-- Deep dive into investment focus areas and trends
CREATE OR REPLACE VIEW sector_focus_analysis AS
SELECT 
    aoi.display_name as focus_area,
    aoi.kind as focus_category,
    COUNT(DISTINCT aoi.investor_id) as investors_count,
    COUNT(DISTINCT i.firm_id) as firms_involved,
    COUNT(DISTINCT inv.id) as related_investments,
    -- Geographic distribution
    COUNT(DISTINCT l.display_name) as geographic_spread,
    (SELECT STRING_AGG(location_name, ', ')
     FROM (
        SELECT l2.display_name as location_name, COUNT(*) as cnt
        FROM areas_of_interest aoi2
        JOIN investors i2 ON aoi2.investor_id = i2.id
        JOIN locations l2 ON i2.location_id = l2.id
        WHERE aoi2.display_name = aoi.display_name
        GROUP BY l2.display_name
        ORDER BY cnt DESC
        LIMIT 5
     ) top_locs) as top_locations,
    -- Top firms in this sector
    (SELECT STRING_AGG(firm_name, ', ')
     FROM (
        SELECT f2.name as firm_name, COUNT(*) as cnt
        FROM areas_of_interest aoi2
        JOIN investors i2 ON aoi2.investor_id = i2.id
        JOIN firms f2 ON i2.firm_id = f2.id
        WHERE aoi2.display_name = aoi.display_name
        GROUP BY f2.name
        ORDER BY cnt DESC
        LIMIT 5
     ) top_firms) as leading_firms,
    -- Investment stage preferences for this sector
    (SELECT STRING_AGG(stage_name, ', ')
     FROM (
        SELECT ist.display_name as stage_name, COUNT(*) as cnt
        FROM areas_of_interest aoi2
        JOIN investors i2 ON aoi2.investor_id = i2.id
        JOIN investor_stages ist ON i2.id = ist.investor_id
        WHERE aoi2.display_name = aoi.display_name
        GROUP BY ist.display_name
        ORDER BY cnt DESC
        LIMIT 3
     ) top_stages) as preferred_stages,
    -- Diversity metrics for this sector
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN i.in_diverse_investor_list THEN i.id END) / 
          NULLIF(COUNT(DISTINCT aoi.investor_id), 0), 1) as diversity_percentage
FROM areas_of_interest aoi
LEFT JOIN investors i ON aoi.investor_id = i.id
LEFT JOIN investments inv ON i.id = inv.investor_id
LEFT JOIN locations l ON i.location_id = l.id
GROUP BY aoi.display_name, aoi.kind
ORDER BY investors_count DESC;

-- 6. INVESTMENT STAGE PREFERENCES
-- Understanding funding stage focus across the ecosystem
CREATE OR REPLACE VIEW stage_preferences_analysis AS
SELECT 
    ist.display_name as investment_stage,
    ist.kind as stage_category,
    COUNT(DISTINCT ist.investor_id) as investors_count,
    COUNT(DISTINCT i.firm_id) as firms_count,
    -- Related sectors for this stage
    (SELECT STRING_AGG(aoi.display_name, ', ')
     FROM (
        SELECT aoi.display_name, COUNT(*) as cnt
        FROM investor_stages ist2
        JOIN investors i2 ON ist2.investor_id = i2.id
        JOIN areas_of_interest aoi ON i2.id = aoi.investor_id
        WHERE ist2.display_name = ist.display_name
        GROUP BY aoi.display_name
        ORDER BY cnt DESC
        LIMIT 5
     ) top_sectors) as popular_sectors,
    -- Geographic concentration
    (SELECT STRING_AGG(location_name, ', ')
     FROM (
        SELECT l.display_name as location_name, COUNT(*) as cnt
        FROM investor_stages ist2
        JOIN investors i2 ON ist2.investor_id = i2.id
        JOIN locations l ON i2.location_id = l.id
        WHERE ist2.display_name = ist.display_name
        GROUP BY l.display_name
        ORDER BY cnt DESC
        LIMIT 3
     ) top_locs) as top_locations,
    -- Investment size preferences
    (SELECT STRING_AGG(DISTINCT i2.target_investment, ', ')
     FROM investor_stages ist2
     JOIN investors i2 ON ist2.investor_id = i2.id
     WHERE ist2.display_name = ist.display_name 
     AND i2.target_investment IS NOT NULL
     LIMIT 10) as common_investment_sizes
FROM investor_stages ist
LEFT JOIN investors i ON ist.investor_id = i.id
GROUP BY ist.display_name, ist.kind
ORDER BY investors_count DESC;

-- 7. TOP PERFORMERS & ACTIVE INVESTORS
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
    COUNT(DISTINCT aoi.id) as focus_areas_count,
    i.vote_count,
    i.leads_rounds,
    -- Influence indicators
    CASE WHEN i.in_founder_investor_list THEN 'Yes' ELSE 'No' END as founder_investor,
    CASE WHEN i.claimed THEN 'Verified' ELSE 'Unverified' END as profile_status,
    -- Portfolio diversity
    (SELECT COUNT(DISTINCT aoi2.display_name) 
     FROM areas_of_interest aoi2 
     WHERE aoi2.investor_id = i.id) as sector_diversity,
    (SELECT COUNT(DISTINCT il.display_name) 
     FROM investment_locations il 
     WHERE il.investor_id = i.id) as geographic_diversity,
    -- Social presence
    CASE WHEN p.linkedin_url IS NOT NULL THEN 'Yes' ELSE 'No' END as has_linkedin,
    CASE WHEN p.twitter_url IS NOT NULL THEN 'Yes' ELSE 'No' END as has_twitter,
    -- Ranking score (weighted combination of metrics)
    (COALESCE(COUNT(DISTINCT inv.id), 0) * 2 + 
     COALESCE(i.vote_count, 0) + 
     COALESCE(COUNT(DISTINCT aoi.id), 0) +
     CASE WHEN i.claimed THEN 5 ELSE 0 END +
     CASE WHEN i.in_founder_investor_list THEN 3 ELSE 0 END) as activity_score
FROM investors i
LEFT JOIN persons p ON i.person_id = p.id
LEFT JOIN firms f ON i.firm_id = f.id
LEFT JOIN locations l ON i.location_id = l.id
LEFT JOIN investments inv ON i.id = inv.investor_id
LEFT JOIN areas_of_interest aoi ON i.id = aoi.investor_id
GROUP BY i.id, p.name, f.name, i.position, l.display_name, i.vote_count, 
         i.leads_rounds, i.in_founder_investor_list, i.claimed, 
         p.linkedin_url, p.twitter_url
ORDER BY activity_score DESC;

-- 8. DIVERSITY & INCLUSION METRICS
-- Track diversity across the investor ecosystem
CREATE OR REPLACE VIEW diversity_metrics AS
SELECT 
    -- Overall metrics
    'Overall' as segment,
    COUNT(*) as total_investors,
    COUNT(CASE WHEN i.in_diverse_investor_list THEN 1 END) as diverse_investors,
    COUNT(CASE WHEN i.in_female_investor_list THEN 1 END) as female_investors,
    ROUND(100.0 * COUNT(CASE WHEN i.in_diverse_investor_list THEN 1 END) / COUNT(*), 1) as diversity_percentage,
    ROUND(100.0 * COUNT(CASE WHEN i.in_female_investor_list THEN 1 END) / COUNT(*), 1) as female_percentage,
    -- Focus on founder-focused investors
    COUNT(CASE WHEN i.in_invests_in_diverse_founders_investor_list THEN 1 END) as invests_diverse_founders,
    COUNT(CASE WHEN i.in_invests_in_female_founders_investor_list THEN 1 END) as invests_female_founders,
    ROUND(100.0 * COUNT(CASE WHEN i.in_invests_in_diverse_founders_investor_list THEN 1 END) / COUNT(*), 1) as diverse_founder_focus_pct,
    ROUND(100.0 * COUNT(CASE WHEN i.in_invests_in_female_founders_investor_list THEN 1 END) / COUNT(*), 1) as female_founder_focus_pct,
    NULL as firm_name,
    NULL as location_name,
    NULL as focus_area
FROM investors i

UNION ALL

-- By firm
SELECT 
    'By Firm' as segment,
    COUNT(*) as total_investors,
    COUNT(CASE WHEN i.in_diverse_investor_list THEN 1 END) as diverse_investors,
    COUNT(CASE WHEN i.in_female_investor_list THEN 1 END) as female_investors,
    ROUND(100.0 * COUNT(CASE WHEN i.in_diverse_investor_list THEN 1 END) / COUNT(*), 1) as diversity_percentage,
    ROUND(100.0 * COUNT(CASE WHEN i.in_female_investor_list THEN 1 END) / COUNT(*), 1) as female_percentage,
    COUNT(CASE WHEN i.in_invests_in_diverse_founders_investor_list THEN 1 END) as invests_diverse_founders,
    COUNT(CASE WHEN i.in_invests_in_female_founders_investor_list THEN 1 END) as invests_female_founders,
    ROUND(100.0 * COUNT(CASE WHEN i.in_invests_in_diverse_founders_investor_list THEN 1 END) / COUNT(*), 1) as diverse_founder_focus_pct,
    ROUND(100.0 * COUNT(CASE WHEN i.in_invests_in_female_founders_investor_list THEN 1 END) / COUNT(*), 1) as female_founder_focus_pct,
    f.name as firm_name,
    NULL as location_name,
    NULL as focus_area
FROM investors i
LEFT JOIN firms f ON i.firm_id = f.id
WHERE f.name IS NOT NULL
GROUP BY f.name
HAVING COUNT(*) >= 5  -- Only firms with 5+ investors

UNION ALL

-- By location
SELECT 
    'By Location' as segment,
    COUNT(*) as total_investors,
    COUNT(CASE WHEN i.in_diverse_investor_list THEN 1 END) as diverse_investors,
    COUNT(CASE WHEN i.in_female_investor_list THEN 1 END) as female_investors,
    ROUND(100.0 * COUNT(CASE WHEN i.in_diverse_investor_list THEN 1 END) / COUNT(*), 1) as diversity_percentage,
    ROUND(100.0 * COUNT(CASE WHEN i.in_female_investor_list THEN 1 END) / COUNT(*), 1) as female_percentage,
    COUNT(CASE WHEN i.in_invests_in_diverse_founders_investor_list THEN 1 END) as invests_diverse_founders,
    COUNT(CASE WHEN i.in_invests_in_female_founders_investor_list THEN 1 END) as invests_female_founders,
    ROUND(100.0 * COUNT(CASE WHEN i.in_invests_in_diverse_founders_investor_list THEN 1 END) / COUNT(*), 1) as diverse_founder_focus_pct,
    ROUND(100.0 * COUNT(CASE WHEN i.in_invests_in_female_founders_investor_list THEN 1 END) / COUNT(*), 1) as female_founder_focus_pct,
    NULL as firm_name,
    l.display_name as location_name,
    NULL as focus_area
FROM investors i
LEFT JOIN locations l ON i.location_id = l.id
WHERE l.display_name IS NOT NULL
GROUP BY l.display_name
HAVING COUNT(*) >= 10;  -- Only locations with 10+ investors

-- 9. NETWORK CONNECTIONS & RELATIONSHIPS
-- Explore connections between investors, firms, and shared interests
CREATE OR REPLACE VIEW network_connections AS
SELECT 
    p1.name as investor_1,
    f1.name as firm_1,
    p2.name as investor_2,
    f2.name as firm_2,
    'Same Firm' as connection_type,
    1 as connection_strength,
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

-- Shared investment focus
SELECT 
    p1.name as investor_1,
    f1.name as firm_1,
    p2.name as investor_2,
    f2.name as firm_2,
    'Shared Focus: ' || aoi1.display_name as connection_type,
    2 as connection_strength,
    l1.display_name as location_1,
    l2.display_name as location_2
FROM areas_of_interest aoi1
JOIN areas_of_interest aoi2 ON aoi1.display_name = aoi2.display_name 
    AND aoi1.investor_id < aoi2.investor_id
JOIN investors i1 ON aoi1.investor_id = i1.id
JOIN investors i2 ON aoi2.investor_id = i2.id
JOIN persons p1 ON i1.person_id = p1.id
JOIN persons p2 ON i2.person_id = p2.id
LEFT JOIN firms f1 ON i1.firm_id = f1.id
LEFT JOIN firms f2 ON i2.firm_id = f2.id
LEFT JOIN locations l1 ON i1.location_id = l1.id
LEFT JOIN locations l2 ON i2.location_id = l2.id
WHERE i1.firm_id != i2.firm_id OR (i1.firm_id IS NULL OR i2.firm_id IS NULL);

-- 10. COMPREHENSIVE SEARCH & DISCOVERY
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
    -- Searchable text fields
    (p.name || ' ' || 
     COALESCE(f.name, '') || ' ' || 
     COALESCE(i.position, '') || ' ' || 
     COALESCE(i.headline, '') || ' ' ||
     COALESCE(l.display_name, '') || ' ' ||
     COALESCE((SELECT STRING_AGG(aoi.display_name, ' ') 
               FROM areas_of_interest aoi 
               WHERE aoi.investor_id = i.id), '') || ' ' ||
     COALESCE((SELECT STRING_AGG(il.display_name, ' ') 
               FROM investment_locations il 
               WHERE il.investor_id = i.id), '')
    ) as searchable_text,
    -- Structured data for filtering
    (SELECT ARRAY_AGG(aoi.display_name) 
     FROM areas_of_interest aoi 
     WHERE aoi.investor_id = i.id) as focus_areas_array,
    (SELECT ARRAY_AGG(il.display_name) 
     FROM investment_locations il 
     WHERE il.investor_id = i.id) as investment_locations_array,
    (SELECT ARRAY_AGG(ist.display_name) 
     FROM investor_stages ist 
     WHERE ist.investor_id = i.id) as investment_stages_array,
    -- Metrics for ranking
    COALESCE((SELECT COUNT(*) FROM investments inv WHERE inv.investor_id = i.id), 0) as investments_count,
    COALESCE(i.vote_count, 0) as vote_count,
    COALESCE((SELECT COUNT(*) FROM areas_of_interest aoi WHERE aoi.investor_id = i.id), 0) as focus_areas_count,
    -- Flags for filtering
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
    -- Activity score for ranking
    (COALESCE((SELECT COUNT(*) FROM investments inv WHERE inv.investor_id = i.id), 0) * 2 + 
     COALESCE(i.vote_count, 0) + 
     COALESCE((SELECT COUNT(*) FROM areas_of_interest aoi WHERE aoi.investor_id = i.id), 0) +
     CASE WHEN i.claimed THEN 5 ELSE 0 END +
     CASE WHEN i.in_founder_investor_list THEN 3 ELSE 0 END) as relevance_score
FROM investors i
LEFT JOIN persons p ON i.person_id = p.id
LEFT JOIN firms f ON i.firm_id = f.id
LEFT JOIN locations l ON i.location_id = l.id;