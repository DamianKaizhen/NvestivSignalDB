#!/usr/bin/env python3
"""
Export investors.parquet to PostgreSQL database
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

def test_connection():
    """Test PostgreSQL connection"""
    try:
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            port=DB_CONFIG['port'],
            database=DB_CONFIG['database'],
            user=DB_CONFIG['username'],
            password=DB_CONFIG['password']
        )
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Connected to PostgreSQL: {version[0]}")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def safe_json_serialize(obj):
    """Safely serialize objects to JSON, handling numpy arrays and other types"""
    try:
        # Check for various types of None/NaN values
        if obj is None:
            return None
        if isinstance(obj, float) and pd.isna(obj):
            return None
        if hasattr(obj, '__len__') and len(obj) == 0:
            return None
        
        # Convert numpy arrays and other problematic types
        if hasattr(obj, 'tolist'):
            obj = obj.tolist()
        elif isinstance(obj, dict):
            # Recursively handle nested objects
            obj = {k: safe_json_serialize(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            obj = [safe_json_serialize(item) for item in obj]
        
        return json.dumps(obj)
    except (TypeError, ValueError, AttributeError):
        # If serialization fails, convert to string
        return str(obj) if obj is not None else None

def flatten_complex_columns(df):
    """Flatten complex nested columns to JSON strings"""
    df_copy = df.copy()
    
    # Columns that contain complex nested data
    complex_columns = [
        'person', 'stages', 'location', 'firm', 'degrees', 'positions',
        'media_links', 'investments_on_record', 'investor_profile_funding_rounds',
        'network_list_investor_profiles', 'network_list_scouts_and_angels_profiles',
        'investing_connections', 'image_urls_edit_mode', 'investment_locations',
        'areas_of_interest', 'image_urls', 'investor_lists'
    ]
    
    for col in complex_columns:
        if col in df_copy.columns:
            # Convert complex objects to JSON strings using safe serialization
            df_copy[col] = df_copy[col].apply(safe_json_serialize)
    
    return df_copy

def create_table_schema():
    """Create the investors table schema"""
    schema = """
    CREATE TABLE IF NOT EXISTS investors (
        id SERIAL PRIMARY KEY,
        claimed BOOLEAN,
        can_edit BOOLEAN,
        include_in_list BOOLEAN,
        in_founder_investor_list BOOLEAN,
        in_diverse_investor_list BOOLEAN,
        in_female_investor_list BOOLEAN,
        in_invests_in_diverse_founders_investor_list BOOLEAN,
        in_invests_in_female_founders_investor_list BOOLEAN,
        leads_rounds TEXT,
        person JSONB,
        stages JSONB,
        position TEXT,
        min_investment TEXT,
        max_investment TEXT,
        target_investment TEXT,
        areas_of_interest_freeform TEXT,
        no_current_interest_freeform TEXT,
        vote_count INTEGER,
        headline TEXT,
        previous_position TEXT,
        previous_firm TEXT,
        location JSONB,
        firm JSONB,
        degrees JSONB,
        positions JSONB,
        media_links JSONB,
        investments_on_record JSONB,
        investor_profile_funding_rounds JSONB,
        network_list_investor_profiles JSONB,
        network_list_scouts_and_angels_profiles JSONB,
        investing_connections JSONB,
        has_profile_vote BOOLEAN,
        image_urls_edit_mode JSONB,
        is_preferred_coinvestor JSONB,
        investment_locations JSONB,
        areas_of_interest JSONB,
        image_urls JSONB,
        investor_lists JSONB,
        imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    return schema

def main():
    print("🚀 Starting parquet to PostgreSQL export...")
    
    # Test connection first
    if not test_connection():
        sys.exit(1)
    
    try:
        # Load parquet file
        print("📄 Loading parquet file...")
        df = pd.read_parquet('/home/damian/ExperimentationKaizhen/Nvestiv/Sample_Investor_DB/investors.parquet')
        print(f"✅ Loaded {len(df)} records with {len(df.columns)} columns")
        
        # Flatten complex columns
        print("🔄 Flattening complex nested data...")
        df_flat = flatten_complex_columns(df)
        
        # Create SQLAlchemy engine
        connection_string = f"postgresql://{DB_CONFIG['username']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
        engine = create_engine(connection_string)
        
        # Create table schema
        print("📋 Creating table schema...")
        with engine.connect() as conn:
            conn.execute(text(create_table_schema()))
            conn.commit()
        
        # Export to PostgreSQL
        print("💾 Exporting data to PostgreSQL...")
        df_flat.to_sql(
            'investors', 
            engine, 
            if_exists='append',  # Change to 'replace' if you want to overwrite
            index=False,
            method='multi',
            chunksize=1000
        )
        
        # Verify export
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM investors;"))
            count = result.fetchone()[0]
            print(f"✅ Successfully exported {count} records to PostgreSQL")
            
            # Show sample data
            result = conn.execute(text("SELECT person->>'name' as name, firm->>'name' as firm_name, position FROM investors WHERE person->>'name' IS NOT NULL LIMIT 5;"))
            sample_data = result.fetchall()
            
            print("\n📊 Sample exported data:")
            for row in sample_data:
                print(f"  - {row[0]} at {row[1]} ({row[2]})")
        
        print(f"\n🎉 Export completed successfully at {datetime.now()}")
        
    except Exception as e:
        print(f"❌ Export failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()