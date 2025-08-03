-- INVESTOR NETWORK DATABASE SCHEMA
-- Normalized structure for investor network mapping and analysis

-- =====================================================
-- CORE ENTITIES
-- =====================================================

-- Main investor profiles table
CREATE TABLE investors (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE,
    claimed BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    include_in_list BOOLEAN DEFAULT FALSE,
    in_founder_investor_list BOOLEAN DEFAULT FALSE,
    in_diverse_investor_list BOOLEAN DEFAULT FALSE,
    in_female_investor_list BOOLEAN DEFAULT FALSE,
    in_invests_in_diverse_founders_investor_list BOOLEAN DEFAULT FALSE,
    in_invests_in_female_founders_investor_list BOOLEAN DEFAULT FALSE,
    leads_rounds VARCHAR(50),
    position VARCHAR(255),
    min_investment VARCHAR(100),
    max_investment VARCHAR(100),
    target_investment VARCHAR(100),
    areas_of_interest_freeform TEXT,
    no_current_interest_freeform TEXT,
    vote_count INTEGER DEFAULT 0,
    headline TEXT,
    previous_position VARCHAR(255),
    previous_firm VARCHAR(255),
    has_profile_vote BOOLEAN DEFAULT FALSE,
    is_preferred_coinvestor JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- People (individuals) - normalized from nested person data
CREATE TABLE people (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    full_name VARCHAR(255),
    linkedin_url VARCHAR(500),
    facebook_url JSONB,
    twitter_url VARCHAR(500),
    crunchbase_url VARCHAR(500),
    angellist_url VARCHAR(500),
    website_url VARCHAR(500),
    is_me BOOLEAN DEFAULT FALSE,
    first_degree_count INTEGER DEFAULT 0,
    is_on_target_list BOOLEAN DEFAULT FALSE,
    relationship_strength JSONB,
    email_from_contacts JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Investment firms
CREATE TABLE firms (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    current_fund_size VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Companies (portfolio/investment targets)
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    total_employee_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Schools/Universities
CREATE TABLE schools (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(255) UNIQUE,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255),
    total_student_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Geographic locations
CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    kind VARCHAR(100),
    display_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- RELATIONSHIP TABLES
-- =====================================================

-- Link investors to people (many-to-many)
CREATE TABLE investor_people (
    investor_id INTEGER REFERENCES investors(id) ON DELETE CASCADE,
    person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (investor_id, person_id)
);

-- Link investors to firms
CREATE TABLE investor_firms (
    investor_id INTEGER REFERENCES investors(id) ON DELETE CASCADE,
    firm_id INTEGER REFERENCES firms(id) ON DELETE CASCADE,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (investor_id, firm_id)
);

-- Link investors to locations
CREATE TABLE investor_locations (
    investor_id INTEGER REFERENCES investors(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    location_type VARCHAR(50) DEFAULT 'primary', -- primary, investment_target, etc.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (investor_id, location_id, location_type)
);

-- =====================================================
-- INVESTMENT DATA
-- =====================================================

-- Investment rounds/deals
CREATE TABLE funding_rounds (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    stage VARCHAR(100), -- seed, series_a, series_b, etc.
    amount VARCHAR(100),
    date TIMESTAMP,
    total_raised_amount VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual investments (investor participation in rounds)
CREATE TABLE investments (
    id SERIAL PRIMARY KEY,
    investor_id INTEGER REFERENCES investors(id) ON DELETE CASCADE,
    funding_round_id INTEGER REFERENCES funding_rounds(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    is_lead BOOLEAN DEFAULT FALSE,
    board_role_title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(investor_id, funding_round_id)
);

-- Co-investor relationships (derived from investment patterns)
CREATE TABLE co_investments (
    id SERIAL PRIMARY KEY,
    investor1_id INTEGER REFERENCES investors(id) ON DELETE CASCADE,
    investor2_id INTEGER REFERENCES investors(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    funding_round_id INTEGER REFERENCES funding_rounds(id),
    co_investment_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(investor1_id, investor2_id, company_id, funding_round_id)
);

-- =====================================================
-- NETWORK & CONNECTIONS
-- =====================================================

-- Direct investor connections
CREATE TABLE investor_connections (
    id SERIAL PRIMARY KEY,
    source_investor_id INTEGER REFERENCES investors(id) ON DELETE CASCADE,
    target_investor_id INTEGER REFERENCES investors(id) ON DELETE CASCADE,
    connection_type VARCHAR(100) DEFAULT 'direct', -- direct, network_list, etc.
    strength_score DECIMAL(3,2) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_investor_id, target_investor_id, connection_type)
);

-- Educational connections (shared schools)
CREATE TABLE education_records (
    id SERIAL PRIMARY KEY,
    person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
    school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
    degree_name VARCHAR(255),
    field_of_study VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Professional history
CREATE TABLE work_positions (
    id SERIAL PRIMARY KEY,
    person_id INTEGER REFERENCES people(id) ON DELETE CASCADE,
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255),
    start_month VARCHAR(10),
    start_year VARCHAR(4),
    end_month VARCHAR(10),
    end_year VARCHAR(4),
    is_current BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CATEGORIZATION & PREFERENCES
-- =====================================================

-- Investment stages (seed, series_a, etc.)
CREATE TABLE investment_stages (
    id SERIAL PRIMARY KEY,
    kind VARCHAR(100),
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(kind, display_name)
);

-- Areas of interest/sectors
CREATE TABLE interest_areas (
    id SERIAL PRIMARY KEY,
    kind VARCHAR(100),
    display_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(kind, display_name)
);

-- Link investors to their preferred stages
CREATE TABLE investor_stages (
    investor_id INTEGER REFERENCES investors(id) ON DELETE CASCADE,
    stage_id INTEGER REFERENCES investment_stages(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (investor_id, stage_id)
);

-- Link investors to their areas of interest
CREATE TABLE investor_interests (
    investor_id INTEGER REFERENCES investors(id) ON DELETE CASCADE,
    interest_id INTEGER REFERENCES interest_areas(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (investor_id, interest_id)
);

-- =====================================================
-- NETWORK ANALYSIS VIEWS
-- =====================================================

-- View for investor network strength
CREATE VIEW investor_network_metrics AS
SELECT 
    i.id,
    i.slug,
    p.full_name,
    f.name as firm_name,
    p.first_degree_count,
    COUNT(DISTINCT ic.target_investor_id) as direct_connections,
    COUNT(DISTINCT ci.investor2_id) as co_investment_partners,
    COUNT(DISTINCT inv.company_id) as portfolio_companies,
    COUNT(DISTINCT CASE WHEN inv.is_lead = true THEN inv.id END) as lead_investments
FROM investors i
LEFT JOIN investor_people ip ON i.id = ip.investor_id AND ip.is_primary = true
LEFT JOIN people p ON ip.person_id = p.id
LEFT JOIN investor_firms if ON i.id = if.investor_id AND if.is_current = true
LEFT JOIN firms f ON if.firm_id = f.id
LEFT JOIN investor_connections ic ON i.id = ic.source_investor_id
LEFT JOIN co_investments ci ON i.id = ci.investor1_id
LEFT JOIN investments inv ON i.id = inv.investor_id
GROUP BY i.id, i.slug, p.full_name, f.name, p.first_degree_count;

-- View for co-investment patterns
CREATE VIEW co_investment_patterns AS
SELECT 
    ci.investor1_id,
    ci.investor2_id,
    p1.full_name as investor1_name,
    p2.full_name as investor2_name,
    f1.name as investor1_firm,
    f2.name as investor2_firm,
    COUNT(*) as co_investment_count,
    STRING_AGG(c.name, '; ') as shared_companies
FROM co_investments ci
JOIN investor_people ip1 ON ci.investor1_id = ip1.investor_id AND ip1.is_primary = true
JOIN investor_people ip2 ON ci.investor2_id = ip2.investor_id AND ip2.is_primary = true
JOIN people p1 ON ip1.person_id = p1.id
JOIN people p2 ON ip2.person_id = p2.id
LEFT JOIN investor_firms if1 ON ci.investor1_id = if1.investor_id AND if1.is_current = true
LEFT JOIN investor_firms if2 ON ci.investor2_id = if2.investor_id AND if2.is_current = true
LEFT JOIN firms f1 ON if1.firm_id = f1.id
LEFT JOIN firms f2 ON if2.firm_id = f2.id
LEFT JOIN companies c ON ci.company_id = c.id
GROUP BY ci.investor1_id, ci.investor2_id, p1.full_name, p2.full_name, f1.name, f2.name;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary lookup indexes
CREATE INDEX idx_investors_slug ON investors(slug);
CREATE INDEX idx_people_slug ON people(slug);
CREATE INDEX idx_people_linkedin ON people(linkedin_url);
CREATE INDEX idx_firms_slug ON firms(slug);
CREATE INDEX idx_companies_slug ON companies(slug);

-- Network analysis indexes
CREATE INDEX idx_investor_connections_source ON investor_connections(source_investor_id);
CREATE INDEX idx_investor_connections_target ON investor_connections(target_investor_id);
CREATE INDEX idx_co_investments_investor1 ON co_investments(investor1_id);
CREATE INDEX idx_co_investments_investor2 ON co_investments(investor2_id);
CREATE INDEX idx_investments_investor ON investments(investor_id);
CREATE INDEX idx_investments_company ON investments(company_id);
CREATE INDEX idx_funding_rounds_company ON funding_rounds(company_id);
CREATE INDEX idx_funding_rounds_date ON funding_rounds(date);

-- Full-text search indexes
CREATE INDEX idx_people_name_search ON people USING gin(to_tsvector('english', full_name));
CREATE INDEX idx_companies_name_search ON companies USING gin(to_tsvector('english', name));
CREATE INDEX idx_firms_name_search ON firms USING gin(to_tsvector('english', name));

-- =====================================================
-- FUNCTIONS FOR NETWORK ANALYSIS
-- =====================================================

-- Function to find shortest path between two investors
CREATE OR REPLACE FUNCTION find_investor_path(
    source_investor_id INTEGER,
    target_investor_id INTEGER,
    max_depth INTEGER DEFAULT 3
) RETURNS TABLE(
    path_length INTEGER,
    path_investors INTEGER[],
    path_names TEXT[]
) AS $$
BEGIN
    -- This would implement a graph traversal algorithm
    -- For now, returning a placeholder
    RETURN QUERY
    SELECT 
        1 as path_length,
        ARRAY[source_investor_id, target_investor_id] as path_investors,
        ARRAY['Source', 'Target'] as path_names;
END;
$$ LANGUAGE plpgsql;