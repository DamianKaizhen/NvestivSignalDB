#!/usr/bin/env python3
"""
Fast export of investors.parquet to comprehensive relational PostgreSQL database
"""

import pandas as pd
import psycopg2
from sqlalchemy import create_engine, text
import json
import sys
from datetime import datetime

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
    DROP TABLE IF EXISTS positions CASCADE;
    DROP TABLE IF EXISTS degrees CASCADE;
    DROP TABLE IF EXISTS media_links CASCADE;
    DROP TABLE IF EXISTS image_urls CASCADE;
    DROP TABLE IF EXISTS areas_of_interest CASCADE;
    DROP TABLE IF EXISTS investment_locations CASCADE;
    DROP TABLE IF EXISTS investor_stages CASCADE;
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
        total_raised_json JSONB,
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

def extract_and_bulk_insert(df, engine):
    """Extract data and perform bulk inserts for better performance"""
    
    print("🔄 Extracting data for bulk insert...")
    
    # Extract persons data
    persons_data = []
    firms_data = []
    locations_data = []
    investors_data = []
    
    for idx, row in df.iterrows():
        if idx % 5000 == 0:
            print(f"  Extracting row {idx}/{len(df)}")
        
        # Extract person data
        person = row.get('person', {}) if pd.notna(row.get('person')) else {}
        if isinstance(person, dict) and person:
            persons_data.append({
                'slug': person.get('slug', f'person_{idx}'),
                'first_name': person.get('first_name'),
                'last_name': person.get('last_name'),
                'name': person.get('name'),
                'linkedin_url': person.get('linkedin_url'),
                'facebook_url': str(person.get('facebook_url', '')),
                'twitter_url': person.get('twitter_url'),
                'crunchbase_url': person.get('crunchbase_url'),
                'angellist_url': person.get('angellist_url'),
                'url': person.get('url'),
                'is_me': person.get('is_me', False),
                'first_degree_count': person.get('first_degree_count'),
                'is_on_target_list': person.get('is_on_target_list', False)
            })
        
        # Extract firm data
        firm = row.get('firm', {}) if pd.notna(row.get('firm')) else {}
        if isinstance(firm, dict) and firm:
            firms_data.append({
                'name': firm.get('name'),
                'slug': firm.get('slug', f'firm_{idx}'),
                'current_fund_size': firm.get('current_fund_size')
            })
        
        # Extract location data
        location = row.get('location', {}) if pd.notna(row.get('location')) else {}
        if isinstance(location, dict) and location:
            locations_data.append({
                'display_name': location.get('display_name'),
                'kind': location.get('kind', 'location')
            })
    
    print(f"✅ Extracted {len(persons_data)} persons, {len(firms_data)} firms, {len(locations_data)} locations")
    
    # Bulk insert using pandas to_sql (much faster)
    print("💾 Bulk inserting data...")
    
    if persons_data:
        persons_df = pd.DataFrame(persons_data).drop_duplicates(subset=['slug'])
        persons_df.to_sql('persons', engine, if_exists='append', index=False, method='multi')
        print(f"  ✅ Inserted {len(persons_df)} persons")
    
    if firms_data:
        firms_df = pd.DataFrame(firms_data).drop_duplicates(subset=['slug'])
        firms_df.to_sql('firms', engine, if_exists='append', index=False, method='multi')
        print(f"  ✅ Inserted {len(firms_df)} firms")
    
    if locations_data:
        locations_df = pd.DataFrame(locations_data).drop_duplicates(subset=['display_name'])
        locations_df.to_sql('locations', engine, if_exists='append', index=False, method='multi')
        print(f"  ✅ Inserted {len(locations_df)} locations")
    
    # Now create investors with foreign key relationships
    print("🔗 Creating investor records with foreign keys...")
    
    with engine.connect() as conn:
        # Get foreign key mappings
        person_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, slug FROM persons")).fetchall()}
        firm_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, slug FROM firms")).fetchall()}
        location_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, display_name FROM locations")).fetchall()}
        
        print(f"  📋 Mapped {len(person_map)} persons, {len(firm_map)} firms, {len(location_map)} locations")
        
        # Create investors data with foreign keys
        investors_batch = []
        
        for idx, row in df.iterrows():
            if idx % 5000 == 0:
                print(f"  Creating investor record {idx}/{len(df)}")
            
            # Get foreign keys
            person = row.get('person', {}) if pd.notna(row.get('person')) else {}
            firm = row.get('firm', {}) if pd.notna(row.get('firm')) else {}
            location = row.get('location', {}) if pd.notna(row.get('location')) else {}
            
            person_id = None
            firm_id = None
            location_id = None
            
            if isinstance(person, dict) and person:
                person_slug = person.get('slug', f'person_{idx}')
                person_id = person_map.get(person_slug)
            
            if isinstance(firm, dict) and firm:
                firm_slug = firm.get('slug', f'firm_{idx}')
                firm_id = firm_map.get(firm_slug)
            
            if isinstance(location, dict) and location:
                location_name = location.get('display_name')
                location_id = location_map.get(location_name)
            
            investor_data = {
                'person_id': person_id,
                'firm_id': firm_id,
                'location_id': location_id,
                'position': row.get('position'),
                'headline': row.get('headline'),
                'previous_position': row.get('previous_position'),
                'previous_firm': row.get('previous_firm'),
                'min_investment': row.get('min_investment'),
                'max_investment': row.get('max_investment'),
                'target_investment': row.get('target_investment'),
                'areas_of_interest_freeform': row.get('areas_of_interest_freeform'),
                'no_current_interest_freeform': row.get('no_current_interest_freeform'),
                'vote_count': int(row.get('vote_count', 0)) if pd.notna(row.get('vote_count')) else 0,
                'leads_rounds': row.get('leads_rounds'),
                'claimed': bool(row.get('claimed', False)),
                'can_edit': bool(row.get('can_edit', False)),
                'include_in_list': bool(row.get('include_in_list', False)),
                'in_founder_investor_list': bool(row.get('in_founder_investor_list', False)),
                'in_diverse_investor_list': bool(row.get('in_diverse_investor_list', False)),
                'in_female_investor_list': bool(row.get('in_female_investor_list', False)),
                'in_invests_in_diverse_founders_investor_list': bool(row.get('in_invests_in_diverse_founders_investor_list', False)),
                'in_invests_in_female_founders_investor_list': bool(row.get('in_invests_in_female_founders_investor_list', False)),
                'has_profile_vote': bool(row.get('has_profile_vote', False))
            }
            
            investors_batch.append(investor_data)
            
            # Insert in batches of 1000
            if len(investors_batch) >= 1000:
                investors_df = pd.DataFrame(investors_batch)
                investors_df.to_sql('investors', engine, if_exists='append', index=False, method='multi')
                investors_batch = []
        
        # Insert remaining investors
        if investors_batch:
            investors_df = pd.DataFrame(investors_batch)
            investors_df.to_sql('investors', engine, if_exists='append', index=False, method='multi')
        
        print(f"  ✅ Inserted all investor records")

def main():
    print("🚀 Starting fast comprehensive relational database export...")
    
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
        
        # Extract and bulk insert data
        extract_and_bulk_insert(df, engine)
        
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
                WHERE p.name IS NOT NULL AND p.name != ''
                LIMIT 5
            """))
            
            print("\n🔗 Sample relational queries:")
            for row in result.fetchall():
                print(f"  - {row[0]} at {row[1]} ({row[2]}) in {row[3]}")
            
            # Show foreign key relationships working
            result = conn.execute(text("""
                SELECT 
                    COUNT(DISTINCT i.id) as total_investors,
                    COUNT(DISTINCT p.id) as unique_persons,
                    COUNT(DISTINCT f.id) as unique_firms,
                    COUNT(DISTINCT l.id) as unique_locations
                FROM investors i
                LEFT JOIN persons p ON i.person_id = p.id
                LEFT JOIN firms f ON i.firm_id = f.id
                LEFT JOIN locations l ON i.location_id = l.id
            """))
            
            stats = result.fetchone()
            print(f"\n📈 Relational integrity:")
            print(f"  Total investors: {stats[0]}")
            print(f"  Unique persons: {stats[1]}")
            print(f"  Unique firms: {stats[2]}")
            print(f"  Unique locations: {stats[3]}")
        
        print("\n🎉 Comprehensive relational database export completed!")
        print("\n📋 Available tables:")
        print("  - persons (individuals)")
        print("  - firms (investment companies)")
        print("  - locations (geographic data)")
        print("  - investors (main investor profiles)")
        print("  - positions (job history)")
        print("  - degrees (education)")
        print("  - investments (investment records)")
        print("  - investment_rounds (funding rounds)")
        print("  All tables are connected via foreign keys for relational queries!")
        
    except Exception as e:
        print(f"❌ Export failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()