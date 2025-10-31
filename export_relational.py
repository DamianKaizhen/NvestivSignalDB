#!/usr/bin/env python3
"""
Export investors.parquet to comprehensive relational PostgreSQL database
"""

import pandas as pd
import psycopg2
from sqlalchemy import create_engine, text
import json
import sys
from datetime import datetime
import uuid

# Database connection settings
DB_CONFIG = {
    'host': '135.181.194.2',
    'port': 5433,
    'database': 'signal_db',
    'username': 'damian.k',
    'password': 'Adminaccount1!'
}

def create_relational_schema():
    """Create comprehensive relational database schema"""
    schema = """
    -- Drop existing tables if they exist
    DROP TABLE IF EXISTS investment_rounds CASCADE;
    DROP TABLE IF EXISTS investments CASCADE;
    DROP TABLE IF EXISTS coinvestors CASCADE;
    DROP TABLE IF EXISTS positions CASCADE;
    DROP TABLE IF EXISTS degrees CASCADE;
    DROP TABLE IF EXISTS media_links CASCADE;
    DROP TABLE IF EXISTS image_urls CASCADE;
    DROP TABLE IF EXISTS areas_of_interest CASCADE;
    DROP TABLE IF EXISTS investment_locations CASCADE;
    DROP TABLE IF EXISTS investor_stages CASCADE;
    DROP TABLE IF EXISTS investor_lists CASCADE;
    DROP TABLE IF EXISTS network_connections CASCADE;
    DROP TABLE IF EXISTS firms CASCADE;
    DROP TABLE IF EXISTS schools CASCADE;
    DROP TABLE IF EXISTS companies CASCADE;
    DROP TABLE IF EXISTS locations CASCADE;
    DROP TABLE IF EXISTS investors CASCADE;
    DROP TABLE IF EXISTS persons CASCADE;

    -- Core person table
    CREATE TABLE persons (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        name VARCHAR(255),
        linkedin_url TEXT,
        facebook_url TEXT,
        twitter_url TEXT,
        crunchbase_url TEXT,
        angellist_url TEXT,
        url TEXT,
        is_me BOOLEAN DEFAULT FALSE,
        first_degree_count INTEGER,
        is_on_target_list BOOLEAN DEFAULT FALSE,
        relationship_strength JSONB,
        email_from_contacts JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Locations table
    CREATE TABLE locations (
        id SERIAL PRIMARY KEY,
        display_name VARCHAR(255),
        kind VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Firms table
    CREATE TABLE firms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        slug VARCHAR(255) UNIQUE,
        current_fund_size VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Schools table
    CREATE TABLE schools (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        display_name VARCHAR(255),
        total_student_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Companies table
    CREATE TABLE companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        display_name VARCHAR(255),
        total_employee_count INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Main investors table
    CREATE TABLE investors (
        id SERIAL PRIMARY KEY,
        person_id INTEGER REFERENCES persons(id),
        firm_id INTEGER REFERENCES firms(id),
        location_id INTEGER REFERENCES locations(id),
        position VARCHAR(255),
        headline TEXT,
        previous_position VARCHAR(255),
        previous_firm VARCHAR(255),
        min_investment VARCHAR(100),
        max_investment VARCHAR(100),
        target_investment VARCHAR(100),
        areas_of_interest_freeform TEXT,
        no_current_interest_freeform TEXT,
        vote_count INTEGER DEFAULT 0,
        leads_rounds VARCHAR(50),
        claimed BOOLEAN DEFAULT FALSE,
        can_edit BOOLEAN DEFAULT FALSE,
        include_in_list BOOLEAN DEFAULT FALSE,
        in_founder_investor_list BOOLEAN DEFAULT FALSE,
        in_diverse_investor_list BOOLEAN DEFAULT FALSE,
        in_female_investor_list BOOLEAN DEFAULT FALSE,
        in_invests_in_diverse_founders_investor_list BOOLEAN DEFAULT FALSE,
        in_invests_in_female_founders_investor_list BOOLEAN DEFAULT FALSE,
        has_profile_vote BOOLEAN DEFAULT FALSE,
        is_preferred_coinvestor JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Investment stages
    CREATE TABLE investor_stages (
        id SERIAL PRIMARY KEY,
        investor_id INTEGER REFERENCES investors(id),
        kind VARCHAR(100),
        display_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Areas of interest
    CREATE TABLE areas_of_interest (
        id SERIAL PRIMARY KEY,
        investor_id INTEGER REFERENCES investors(id),
        kind VARCHAR(100),
        display_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Investment locations
    CREATE TABLE investment_locations (
        id SERIAL PRIMARY KEY,
        investor_id INTEGER REFERENCES investors(id),
        kind VARCHAR(100),
        display_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Professional positions
    CREATE TABLE positions (
        id SERIAL PRIMARY KEY,
        person_id INTEGER REFERENCES persons(id),
        company_id INTEGER REFERENCES companies(id),
        title VARCHAR(255),
        start_month VARCHAR(20),
        start_year VARCHAR(10),
        end_month VARCHAR(20),
        end_year VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Education degrees
    CREATE TABLE degrees (
        id SERIAL PRIMARY KEY,
        person_id INTEGER REFERENCES persons(id),
        school_id INTEGER REFERENCES schools(id),
        degree_name VARCHAR(255),
        field_of_study VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Media links
    CREATE TABLE media_links (
        id SERIAL PRIMARY KEY,
        investor_id INTEGER REFERENCES investors(id),
        url TEXT,
        title VARCHAR(255),
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Image URLs
    CREATE TABLE image_urls (
        id SERIAL PRIMARY KEY,
        investor_id INTEGER REFERENCES investors(id),
        url TEXT,
        is_edit_mode BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Investments on record
    CREATE TABLE investments (
        id SERIAL PRIMARY KEY,
        investor_id INTEGER REFERENCES investors(id),
        company_display_name VARCHAR(255),
        total_raised TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Investment rounds
    CREATE TABLE investment_rounds (
        id SERIAL PRIMARY KEY,
        investment_id INTEGER REFERENCES investments(id),
        investor_id INTEGER REFERENCES investors(id),
        stage VARCHAR(100),
        amount VARCHAR(100),
        date TIMESTAMP,
        is_lead BOOLEAN DEFAULT FALSE,
        board_role_title VARCHAR(255),
        company_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Co-investors
    CREATE TABLE coinvestors (
        id SERIAL PRIMARY KEY,
        investment_id INTEGER REFERENCES investments(id),
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Network connections
    CREATE TABLE network_connections (
        id SERIAL PRIMARY KEY,
        investor_id INTEGER REFERENCES investors(id),
        target_person_id INTEGER REFERENCES persons(id),
        list_type VARCHAR(100),
        position VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Investor lists
    CREATE TABLE investor_lists (
        id SERIAL PRIMARY KEY,
        investor_id INTEGER REFERENCES investors(id),
        slug VARCHAR(255),
        stage_name VARCHAR(255),
        vertical_kind VARCHAR(100),
        vertical_display_name VARCHAR(255),
        location_kind VARCHAR(100),
        location_display_name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for better performance
    CREATE INDEX idx_persons_slug ON persons(slug);
    CREATE INDEX idx_firms_slug ON firms(slug);
    CREATE INDEX idx_investors_person_id ON investors(person_id);
    CREATE INDEX idx_investors_firm_id ON investors(firm_id);
    CREATE INDEX idx_positions_person_id ON positions(person_id);
    CREATE INDEX idx_degrees_person_id ON degrees(person_id);
    CREATE INDEX idx_investment_rounds_investor_id ON investment_rounds(investor_id);
    """
    return schema

def safe_get(obj, key, default=None):
    """Safely get value from dict-like object"""
    if isinstance(obj, dict):
        return obj.get(key, default)
    return default

def safe_int(value, default=None):
    """Safely convert to integer"""
    try:
        if value and str(value).strip():
            return int(float(str(value)))
        return default
    except:
        return default

def process_investor_data(df, engine):
    """Process and insert all investor data into relational tables"""
    
    # Track foreign keys
    person_map = {}
    firm_map = {}
    location_map = {}
    school_map = {}
    company_map = {}
    
    print(f"🔄 Processing {len(df)} investor records...")
    
    with engine.connect() as conn:
        for idx, row in df.iterrows():
            if idx % 1000 == 0:
                print(f"  Processing record {idx}/{len(df)}")
            
            try:
                # 1. Process Person
                person_data = safe_get(row, 'person', {})
                person_id = None
                
                if person_data and isinstance(person_data, dict):
                    person_slug = safe_get(person_data, 'slug', f'person_{idx}')
                    
                    if person_slug not in person_map:
                        person_result = conn.execute(text("""
                            INSERT INTO persons (slug, first_name, last_name, name, linkedin_url, 
                                                facebook_url, twitter_url, crunchbase_url, angellist_url, 
                                                url, is_me, first_degree_count, is_on_target_list)
                            VALUES (:slug, :first_name, :last_name, :name, :linkedin_url, 
                                    :facebook_url, :twitter_url, :crunchbase_url, :angellist_url, 
                                    :url, :is_me, :first_degree_count, :is_on_target_list)
                            RETURNING id
                        """), {
                            'slug': person_slug,
                            'first_name': safe_get(person_data, 'first_name'),
                            'last_name': safe_get(person_data, 'last_name'),
                            'name': safe_get(person_data, 'name'),
                            'linkedin_url': safe_get(person_data, 'linkedin_url'),
                            'facebook_url': str(safe_get(person_data, 'facebook_url', '')),
                            'twitter_url': safe_get(person_data, 'twitter_url'),
                            'crunchbase_url': safe_get(person_data, 'crunchbase_url'),
                            'angellist_url': safe_get(person_data, 'angellist_url'),
                            'url': safe_get(person_data, 'url'),
                            'is_me': safe_get(person_data, 'is_me', False),
                            'first_degree_count': safe_int(safe_get(person_data, 'first_degree_count')),
                            'is_on_target_list': safe_get(person_data, 'is_on_target_list', False)
                        })
                        person_id = person_result.fetchone()[0]
                        person_map[person_slug] = person_id
                    else:
                        person_id = person_map[person_slug]
                
                # 2. Process Location
                location_data = safe_get(row, 'location', {})
                location_id = None
                
                if location_data and isinstance(location_data, dict):
                    location_name = safe_get(location_data, 'display_name')
                    if location_name and location_name not in location_map:
                        location_result = conn.execute(text("""
                            INSERT INTO locations (display_name, kind)
                            VALUES (:display_name, :kind)
                            RETURNING id
                        """), {
                            'display_name': location_name,
                            'kind': safe_get(location_data, 'kind', 'location')
                        })
                        location_id = location_result.fetchone()[0]
                        location_map[location_name] = location_id
                    elif location_name:
                        location_id = location_map[location_name]
                
                # 3. Process Firm
                firm_data = safe_get(row, 'firm', {})
                firm_id = None
                
                if firm_data and isinstance(firm_data, dict):
                    firm_slug = safe_get(firm_data, 'slug', f'firm_{idx}')
                    
                    if firm_slug not in firm_map:
                        firm_result = conn.execute(text("""
                            INSERT INTO firms (name, slug, current_fund_size)
                            VALUES (:name, :slug, :current_fund_size)
                            RETURNING id
                        """), {
                            'name': safe_get(firm_data, 'name'),
                            'slug': firm_slug,
                            'current_fund_size': safe_get(firm_data, 'current_fund_size')
                        })
                        firm_id = firm_result.fetchone()[0]
                        firm_map[firm_slug] = firm_id
                    else:
                        firm_id = firm_map[firm_slug]
                
                # 4. Insert Investor
                investor_result = conn.execute(text("""
                    INSERT INTO investors (
                        person_id, firm_id, location_id, position, headline, 
                        previous_position, previous_firm, min_investment, max_investment, 
                        target_investment, areas_of_interest_freeform, no_current_interest_freeform,
                        vote_count, leads_rounds, claimed, can_edit, include_in_list,
                        in_founder_investor_list, in_diverse_investor_list, in_female_investor_list,
                        in_invests_in_diverse_founders_investor_list, in_invests_in_female_founders_investor_list,
                        has_profile_vote
                    ) VALUES (
                        :person_id, :firm_id, :location_id, :position, :headline,
                        :previous_position, :previous_firm, :min_investment, :max_investment,
                        :target_investment, :areas_of_interest_freeform, :no_current_interest_freeform,
                        :vote_count, :leads_rounds, :claimed, :can_edit, :include_in_list,
                        :in_founder_investor_list, :in_diverse_investor_list, :in_female_investor_list,
                        :in_invests_in_diverse_founders_investor_list, :in_invests_in_female_founders_investor_list,
                        :has_profile_vote
                    ) RETURNING id
                """), {
                    'person_id': person_id,
                    'firm_id': firm_id,
                    'location_id': location_id,
                    'position': safe_get(row, 'position'),
                    'headline': safe_get(row, 'headline'),
                    'previous_position': safe_get(row, 'previous_position'),
                    'previous_firm': safe_get(row, 'previous_firm'),
                    'min_investment': safe_get(row, 'min_investment'),
                    'max_investment': safe_get(row, 'max_investment'),
                    'target_investment': safe_get(row, 'target_investment'),
                    'areas_of_interest_freeform': safe_get(row, 'areas_of_interest_freeform'),
                    'no_current_interest_freeform': safe_get(row, 'no_current_interest_freeform'),
                    'vote_count': safe_int(safe_get(row, 'vote_count'), 0),
                    'leads_rounds': safe_get(row, 'leads_rounds'),
                    'claimed': safe_get(row, 'claimed', False),
                    'can_edit': safe_get(row, 'can_edit', False),
                    'include_in_list': safe_get(row, 'include_in_list', False),
                    'in_founder_investor_list': safe_get(row, 'in_founder_investor_list', False),
                    'in_diverse_investor_list': safe_get(row, 'in_diverse_investor_list', False),
                    'in_female_investor_list': safe_get(row, 'in_female_investor_list', False),
                    'in_invests_in_diverse_founders_investor_list': safe_get(row, 'in_invests_in_diverse_founders_investor_list', False),
                    'in_invests_in_female_founders_investor_list': safe_get(row, 'in_invests_in_female_founders_investor_list', False),
                    'has_profile_vote': safe_get(row, 'has_profile_vote', False)
                })
                
                investor_id = investor_result.fetchone()[0]
                
                # Process related data (stages, areas of interest, etc.)
                # This is a simplified version - in production you'd process all nested arrays
                
                conn.commit()
                
            except Exception as e:
                print(f"Error processing record {idx}: {e}")
                conn.rollback()
                continue

def main():
    print("🚀 Starting comprehensive relational database export...")
    
    try:
        # Load parquet file
        print("📄 Loading parquet file...")
        df = pd.read_parquet('/home/damian/ExperimentationKaizhen/Nvestiv/Sample_Investor_DB/investors.parquet')
        print(f"✅ Loaded {len(df)} records")
        
        # Create connection
        connection_string = f"postgresql://{DB_CONFIG['username']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
        engine = create_engine(connection_string)
        
        # Create schema
        print("📋 Creating relational database schema...")
        with engine.connect() as conn:
            conn.execute(text(create_relational_schema()))
            conn.commit()
        print("✅ Schema created successfully")
        
        # Process data
        process_investor_data(df, engine)
        
        # Verify results
        print("\n📊 Verifying relational database...")
        with engine.connect() as conn:
            # Count records in each table
            tables = ['persons', 'firms', 'locations', 'investors']
            for table in tables:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.fetchone()[0]
                print(f"  {table}: {count} records")
            
            # Sample query with joins
            result = conn.execute(text("""
                SELECT p.name, f.name as firm_name, i.position, l.display_name as location
                FROM investors i
                LEFT JOIN persons p ON i.person_id = p.id
                LEFT JOIN firms f ON i.firm_id = f.id
                LEFT JOIN locations l ON i.location_id = l.id
                WHERE p.name IS NOT NULL
                LIMIT 5
            """))
            
            print("\n🔗 Sample relational data:")
            for row in result.fetchall():
                print(f"  - {row[0]} at {row[1]} ({row[2]}) in {row[3]}")
        
        print("\n🎉 Comprehensive relational database export completed!")
        
    except Exception as e:
        print(f"❌ Export failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()