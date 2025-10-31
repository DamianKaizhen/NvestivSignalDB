#!/usr/bin/env python3
"""
Simple export of investors.parquet to PostgreSQL
"""

import pandas as pd
import psycopg2
from sqlalchemy import create_engine, text
import json
import sys

# Database connection settings
DB_CONFIG = {
    'host': '135.181.194.2',
    'port': 5433,
    'database': 'signal_db',
    'username': 'damian.k',
    'password': 'Adminaccount1!'
}

def main():
    print("🚀 Starting simple parquet export...")
    
    try:
        # Load parquet file
        print("📄 Loading parquet file...")
        df = pd.read_parquet('/home/damian/ExperimentationKaizhen/Nvestiv/Sample_Investor_DB/investors.parquet')
        print(f"✅ Loaded {len(df)} records")
        
        # Create a simplified version with just basic columns
        print("🔄 Simplifying data structure...")
        
        # Extract basic person info
        person_names = []
        person_linkedin = []
        firm_names = []
        
        for idx, row in df.iterrows():
            if idx % 5000 == 0:
                print(f"  Processing row {idx}...")
            
            # Extract person name
            person = row.get('person', {})
            if isinstance(person, dict):
                person_names.append(person.get('name', ''))
                person_linkedin.append(person.get('linkedin_url', ''))
            else:
                person_names.append('')
                person_linkedin.append('')
            
            # Extract firm name
            firm = row.get('firm', {})
            if isinstance(firm, dict):
                firm_names.append(firm.get('name', ''))
            else:
                firm_names.append('')
        
        # Create simplified dataframe
        df_simple = pd.DataFrame({
            'id': range(1, len(df) + 1),
            'person_name': person_names,
            'person_linkedin': person_linkedin,
            'firm_name': firm_names,
            'position': df['position'].fillna(''),
            'headline': df['headline'].fillna(''),
            'previous_position': df['previous_position'].fillna(''),
            'previous_firm': df['previous_firm'].fillna(''),
            'min_investment': df['min_investment'].fillna(''),
            'max_investment': df['max_investment'].fillna(''),
            'target_investment': df['target_investment'].fillna(''),
            'vote_count': df['vote_count'].fillna(0),
            'claimed': df['claimed'].fillna(False),
            'can_edit': df['can_edit'].fillna(False),
            'include_in_list': df['include_in_list'].fillna(False)
        })
        
        print(f"✅ Simplified to {len(df_simple)} records with {len(df_simple.columns)} columns")
        
        # Create connection
        connection_string = f"postgresql://{DB_CONFIG['username']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
        engine = create_engine(connection_string)
        
        # Create simple table
        print("📋 Creating simple table...")
        create_table_sql = """
        DROP TABLE IF EXISTS investors_simple;
        CREATE TABLE investors_simple (
            id INTEGER PRIMARY KEY,
            person_name VARCHAR(255),
            person_linkedin TEXT,
            firm_name VARCHAR(255),
            position VARCHAR(255),
            headline TEXT,
            previous_position VARCHAR(255),
            previous_firm VARCHAR(255),
            min_investment VARCHAR(50),
            max_investment VARCHAR(50),
            target_investment VARCHAR(50),
            vote_count INTEGER DEFAULT 0,
            claimed BOOLEAN DEFAULT FALSE,
            can_edit BOOLEAN DEFAULT FALSE,
            include_in_list BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """
        
        with engine.connect() as conn:
            conn.execute(text(create_table_sql))
            conn.commit()
        
        # Export to PostgreSQL
        print("💾 Exporting to PostgreSQL...")
        df_simple.to_sql(
            'investors_simple',
            engine,
            if_exists='append',
            index=False,
            chunksize=1000
        )
        
        # Verify
        with engine.connect() as conn:
            result = conn.execute(text("SELECT COUNT(*) FROM investors_simple;"))
            count = result.fetchone()[0]
            print(f"✅ Exported {count} records")
            
            # Sample data
            result = conn.execute(text("""
                SELECT person_name, firm_name, position 
                FROM investors_simple 
                WHERE person_name != '' 
                LIMIT 5;
            """))
            
            print("\n📊 Sample data:")
            for row in result.fetchall():
                print(f"  - {row[0]} at {row[1]} ({row[2]})")
        
        print("\n🎉 Export completed successfully!")
        
    except Exception as e:
        print(f"❌ Export failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()