-- =====================================================
-- 10 INTUITIVE RESEARCH VIEWS FOR INVESTOR DATABASE
-- Simplified versions that work reliably
-- =====================================================

-- 1. COMPREHENSIVE INVESTOR PROFILES
CREATE OR REPLACE VIEW investor_profiles AS
SELECT 
    i.id as investor_id,
    p.name as investor_name,
    p.first_name,
    p.last_name,
    p.linkedin_url,
    p.twitter_url,
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
    i.in_female_investor_list
FROM investors i
LEFT JOIN persons p ON i.person_id = p.id
LEFT JOIN firms f ON i.firm_id = f.id
LEFT JOIN locations l ON i.location_id = l.id;

-- 2. FIRM ANALYSIS VIEW
CREATE OR REPLACE VIEW firm_analysis AS
SELECT 
    f.id as firm_id,
    f.name as firm_name,
    f.current_fund_size,
    COUNT(DISTINCT i.id) as total_investors,
    COUNT(DISTINCT CASE WHEN i.in_diverse_investor_list THEN i.id END) as diverse_investors,
    COUNT(DISTINCT CASE WHEN i.in_female_investor_list THEN i.id END) as female_investors,
    COUNT(DISTINCT l.display_name) as locations_count,
    AVG(i.vote_count) as avg_vote_count
FROM firms f
LEFT JOIN investors i ON f.id = i.firm_id
LEFT JOIN locations l ON i.location_id = l.id
GROUP BY f.id, f.name, f.current_fund_size;

-- 3. INVESTMENT ACTIVITY SUMMARY
CREATE OR REPLACE VIEW investment_activity AS
SELECT 
    i.id as investor_id,
    p.name as investor_name,
    f.name as firm_name,
    inv.company_display_name,
    inv.total_raised_json,
    i.leads_rounds,
    l.display_name as investor_location
FROM investments inv
JOIN investors i ON inv.investor_id = i.id
LEFT JOIN persons p ON i.person_id = p.id
LEFT JOIN firms f ON i.firm_id = f.id
LEFT JOIN locations l ON i.location_id = l.id;

-- 4. GEOGRAPHIC INVESTMENT MAPPING
CREATE OR REPLACE VIEW geographic_investment_map AS
SELECT 
    l.display_name as investor_location,
    l.kind as location_type,
    COUNT(DISTINCT i.id) as investors_count,
    COUNT(DISTINCT f.id) as firms_count,
    COUNT(DISTINCT inv.id) as investments_count,
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

-- 5. SECTOR FOCUS ANALYSIS
CREATE OR REPLACE VIEW sector_focus_analysis AS
SELECT 
    aoi.display_name as focus_area,
    aoi.kind as focus_category,
    COUNT(DISTINCT aoi.investor_id) as investors_count,
    COUNT(DISTINCT i.firm_id) as firms_involved,
    COUNT(DISTINCT inv.id) as related_investments,
    COUNT(DISTINCT l.display_name) as geographic_spread,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN i.in_diverse_investor_list THEN i.id END) / 
          NULLIF(COUNT(DISTINCT aoi.investor_id), 0), 1) as diversity_percentage
FROM areas_of_interest aoi
LEFT JOIN investors i ON aoi.investor_id = i.id
LEFT JOIN investments inv ON i.id = inv.investor_id
LEFT JOIN locations l ON i.location_id = l.id
GROUP BY aoi.display_name, aoi.kind
ORDER BY investors_count DESC;

-- 6. INVESTMENT STAGE PREFERENCES
CREATE OR REPLACE VIEW stage_preferences_analysis AS
SELECT 
    ist.display_name as investment_stage,
    ist.kind as stage_category,
    COUNT(DISTINCT ist.investor_id) as investors_count,
    COUNT(DISTINCT i.firm_id) as firms_count
FROM investor_stages ist
LEFT JOIN investors i ON ist.investor_id = i.id
GROUP BY ist.display_name, ist.kind
ORDER BY investors_count DESC;

-- 7. TOP PERFORMERS & ACTIVE INVESTORS
CREATE OR REPLACE VIEW top_performers AS
SELECT 
    p.name as investor_name,
    f.name as firm_name,
    i.position,
    l.display_name as location,
    COUNT(DISTINCT inv.id) as total_investments,
    COUNT(DISTINCT inv.company_display_name) as unique_companies,
    i.vote_count,
    i.leads_rounds,
    CASE WHEN i.in_founder_investor_list THEN 'Yes' ELSE 'No' END as founder_investor,
    CASE WHEN i.claimed THEN 'Verified' ELSE 'Unverified' END as profile_status,
    CASE WHEN p.linkedin_url IS NOT NULL THEN 'Yes' ELSE 'No' END as has_linkedin,
    CASE WHEN p.twitter_url IS NOT NULL THEN 'Yes' ELSE 'No' END as has_twitter,
    (COALESCE(COUNT(DISTINCT inv.id), 0) * 2 + 
     COALESCE(i.vote_count, 0) + 
     CASE WHEN i.claimed THEN 5 ELSE 0 END +
     CASE WHEN i.in_founder_investor_list THEN 3 ELSE 0 END) as activity_score
FROM investors i
LEFT JOIN persons p ON i.person_id = p.id
LEFT JOIN firms f ON i.firm_id = f.id
LEFT JOIN locations l ON i.location_id = l.id
LEFT JOIN investments inv ON i.id = inv.investor_id
GROUP BY i.id, p.name, f.name, i.position, l.display_name, i.vote_count, 
         i.leads_rounds, i.in_founder_investor_list, i.claimed, 
         p.linkedin_url, p.twitter_url
ORDER BY activity_score DESC;

-- 8. DIVERSITY METRICS
CREATE OR REPLACE VIEW diversity_metrics AS
SELECT 
    'Overall' as segment,
    COUNT(*) as total_investors,
    COUNT(CASE WHEN i.in_diverse_investor_list THEN 1 END) as diverse_investors,
    COUNT(CASE WHEN i.in_female_investor_list THEN 1 END) as female_investors,
    ROUND(100.0 * COUNT(CASE WHEN i.in_diverse_investor_list THEN 1 END) / COUNT(*), 1) as diversity_percentage,
    ROUND(100.0 * COUNT(CASE WHEN i.in_female_investor_list THEN 1 END) / COUNT(*), 1) as female_percentage,
    COUNT(CASE WHEN i.in_invests_in_diverse_founders_investor_list THEN 1 END) as invests_diverse_founders,
    COUNT(CASE WHEN i.in_invests_in_female_founders_investor_list THEN 1 END) as invests_female_founders,
    NULL::text as firm_name,
    NULL::text as location_name
FROM investors i

UNION ALL

SELECT 
    'By Firm' as segment,
    COUNT(*) as total_investors,
    COUNT(CASE WHEN i.in_diverse_investor_list THEN 1 END) as diverse_investors,
    COUNT(CASE WHEN i.in_female_investor_list THEN 1 END) as female_investors,
    ROUND(100.0 * COUNT(CASE WHEN i.in_diverse_investor_list THEN 1 END) / COUNT(*), 1) as diversity_percentage,
    ROUND(100.0 * COUNT(CASE WHEN i.in_female_investor_list THEN 1 END) / COUNT(*), 1) as female_percentage,
    COUNT(CASE WHEN i.in_invests_in_diverse_founders_investor_list THEN 1 END) as invests_diverse_founders,
    COUNT(CASE WHEN i.in_invests_in_female_founders_investor_list THEN 1 END) as invests_female_founders,
    f.name as firm_name,
    NULL::text as location_name
FROM investors i
LEFT JOIN firms f ON i.firm_id = f.id
WHERE f.name IS NOT NULL
GROUP BY f.name
HAVING COUNT(*) >= 5;

-- 9. NETWORK CONNECTIONS
CREATE OR REPLACE VIEW network_connections AS
SELECT 
    p1.name as investor_1,
    f1.name as firm_1,
    p2.name as investor_2,
    f2.name as firm_2,
    'Same Firm' as connection_type,
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
WHERE i1.firm_id IS NOT NULL;

-- 10. COMPREHENSIVE SEARCH
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
    -- Simple searchable text
    (COALESCE(p.name, '') || ' ' || 
     COALESCE(f.name, '') || ' ' || 
     COALESCE(i.position, '') || ' ' || 
     COALESCE(i.headline, '') || ' ' ||
     COALESCE(l.display_name, '')) as searchable_text,
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
    i.vote_count
FROM investors i
LEFT JOIN persons p ON i.person_id = p.id
LEFT JOIN firms f ON i.firm_id = f.id
LEFT JOIN locations l ON i.location_id = l.id;