#!/usr/bin/env python3
"""
Populate the nested relational tables from parquet data - FIXED VERSION
"""

import pandas as pd
import psycopg2
import numpy as np
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

def safe_get(obj, key, default=None):
    """Safely get value from dict-like object"""
    if isinstance(obj, dict):
        return obj.get(key, default)
    return default

def safe_int(value, default=None):
    """Safely convert to integer"""
    try:
        if value and str(value).strip() and str(value) != 'nan':
            return int(float(str(value)))
        return default
    except:
        return default

def is_valid_array(arr):
    """Check if numpy array is not empty"""
    return isinstance(arr, np.ndarray) and arr.size > 0

def process_nested_data(df, engine):
    """Process all nested data and populate relational tables"""
    
    print("🔄 Processing nested relational data...")
    
    # Batch data for bulk insert
    positions_batch = []
    degrees_batch = []
    investments_batch = []
    areas_of_interest_batch = []
    investment_locations_batch = []
    investor_stages_batch = []
    image_urls_batch = []
    media_links_batch = []
    
    school_map = {}
    company_map = {}
    
    with engine.connect() as conn:
        for idx, row in df.iterrows():
            if idx % 2000 == 0:
                print(f"  Processing record {idx}/{len(df)} - Found so far: pos={len(positions_batch)}, deg={len(degrees_batch)}, inv={len(investments_batch)}")
            
            try:
                investor_id = idx + 1  # Assuming sequential IDs
                
                # Get person_id from persons table
                person_data = safe_get(row, 'person', {})
                person_id = None
                
                if isinstance(person_data, dict) and person_data:
                    person_slug = safe_get(person_data, 'slug', f'person_{idx}')
                    result = conn.execute(text("SELECT id FROM persons WHERE slug = :slug"), {'slug': person_slug})
                    person_row = result.fetchone()
                    if person_row:
                        person_id = person_row[0]
                
                # 1. Process POSITIONS (numpy array)
                positions_data = row.get('positions')
                if is_valid_array(positions_data) and person_id:
                    for pos in positions_data:
                        if isinstance(pos, dict):
                            # Handle company
                            company_data = safe_get(pos, 'company', {})
                            company_id = None
                            
                            if isinstance(company_data, dict) and company_data:
                                company_name = safe_get(company_data, 'name')
                                if company_name:
                                    if company_name not in company_map:
                                        # Insert company
                                        try:
                                            company_result = conn.execute(text("""
                                                INSERT INTO companies (name, display_name, total_employee_count)
                                                VALUES (:name, :display_name, :total_employee_count)
                                                RETURNING id
                                            """), {
                                                'name': company_name,
                                                'display_name': safe_get(company_data, 'display_name', company_name),
                                                'total_employee_count': safe_int(safe_get(company_data, 'total_employee_count'))
                                            })
                                            company_id = company_result.fetchone()[0]
                                            company_map[company_name] = company_id
                                            conn.commit()
                                        except Exception as e:
                                            conn.rollback()
                                            print(f"    Error inserting company {company_name}: {e}")
                                    else:
                                        company_id = company_map[company_name]
                            
                            # Add position
                            start_date = safe_get(pos, 'start_date', {})
                            end_date = safe_get(pos, 'end_date', {})
                            
                            positions_batch.append({
                                'person_id': person_id,
                                'company_id': company_id,
                                'title': safe_get(pos, 'title'),
                                'start_month': safe_get(start_date, 'month') if isinstance(start_date, dict) else None,
                                'start_year': safe_get(start_date, 'year') if isinstance(start_date, dict) else None,
                                'end_month': safe_get(end_date, 'month') if isinstance(end_date, dict) else None,
                                'end_year': safe_get(end_date, 'year') if isinstance(end_date, dict) else None
                            })
                
                # 2. Process DEGREES (numpy array)
                degrees_data = row.get('degrees')
                if is_valid_array(degrees_data) and person_id:
                    for degree in degrees_data:
                        if isinstance(degree, dict):
                            # Handle school
                            school_data = safe_get(degree, 'school', {})
                            school_id = None
                            
                            if isinstance(school_data, dict) and school_data:
                                school_name = safe_get(school_data, 'name')
                                if school_name:
                                    if school_name not in school_map:
                                        # Insert school
                                        try:
                                            school_result = conn.execute(text("""
                                                INSERT INTO schools (name, display_name, total_student_count)
                                                VALUES (:name, :display_name, :total_student_count)
                                                RETURNING id
                                            """), {
                                                'name': school_name,
                                                'display_name': safe_get(school_data, 'display_name', school_name),
                                                'total_student_count': safe_int(safe_get(school_data, 'total_student_count'))
                                            })
                                            school_id = school_result.fetchone()[0]
                                            school_map[school_name] = school_id
                                            conn.commit()
                                        except Exception as e:
                                            conn.rollback()
                                            print(f"    Error inserting school {school_name}: {e}")
                                    else:
                                        school_id = school_map[school_name]
                            
                            degrees_batch.append({
                                'person_id': person_id,
                                'school_id': school_id,
                                'degree_name': safe_get(degree, 'name'),
                                'field_of_study': safe_get(degree, 'field_of_study')
                            })
                
                # 3. Process INVESTMENTS (dict with edges array)
                investments_data = row.get('investments_on_record')
                if isinstance(investments_data, dict):
                    edges = safe_get(investments_data, 'edges', [])
                    if isinstance(edges, np.ndarray) and edges.size > 0:
                        for edge in edges:
                            if isinstance(edge, dict):
                                node = safe_get(edge, 'node', {})
                                if isinstance(node, dict):
                                    company_name = safe_get(node, 'company_display_name')
                                    total_raised = safe_get(node, 'total_raised', [])
                                    
                                    if company_name:
                                        investments_batch.append({
                                            'investor_id': investor_id,
                                            'company_display_name': company_name,
                                            'total_raised_json': json.dumps(total_raised.tolist() if isinstance(total_raised, np.ndarray) else total_raised) if total_raised is not None else None
                                        })
                
                # 4. Process AREAS OF INTEREST (numpy array)
                areas_data = row.get('areas_of_interest')
                if is_valid_array(areas_data):
                    for area in areas_data:
                        if isinstance(area, dict):
                            areas_of_interest_batch.append({
                                'investor_id': investor_id,
                                'kind': safe_get(area, 'kind'),
                                'display_name': safe_get(area, 'display_name')
                            })
                
                # 5. Process INVESTMENT LOCATIONS (numpy array)
                inv_locations_data = row.get('investment_locations')
                if is_valid_array(inv_locations_data):
                    for loc in inv_locations_data:
                        if isinstance(loc, dict):
                            investment_locations_batch.append({
                                'investor_id': investor_id,
                                'kind': safe_get(loc, 'kind'),
                                'display_name': safe_get(loc, 'display_name')
                            })
                
                # 6. Process STAGES (numpy array)
                stages_data = row.get('stages')
                if is_valid_array(stages_data):
                    for stage in stages_data:
                        if isinstance(stage, dict):
                            investor_stages_batch.append({
                                'investor_id': investor_id,
                                'kind': safe_get(stage, 'kind'),
                                'display_name': safe_get(stage, 'display_name')
                            })
                
                # 7. Process IMAGE URLS (numpy array)
                image_urls_data = row.get('image_urls')
                if is_valid_array(image_urls_data):
                    for url in image_urls_data:
                        if url and isinstance(url, str):
                            image_urls_batch.append({
                                'investor_id': investor_id,
                                'url': url,
                                'is_edit_mode': False
                            })
                
                # Process edit mode images separately
                edit_image_urls_data = row.get('image_urls_edit_mode')
                if is_valid_array(edit_image_urls_data):
                    for url in edit_image_urls_data:
                        if url and isinstance(url, str):
                            image_urls_batch.append({
                                'investor_id': investor_id,
                                'url': url,
                                'is_edit_mode': True
                            })
                
                # 8. Process MEDIA LINKS (numpy array)
                media_data = row.get('media_links')
                if is_valid_array(media_data):
                    for media in media_data:
                        if isinstance(media, dict):
                            media_links_batch.append({
                                'investor_id': investor_id,
                                'url': safe_get(media, 'url'),
                                'title': safe_get(media, 'title'),
                                'image_url': safe_get(media, 'image_url')
                            })
                
            except Exception as e:
                print(f"Error processing record {idx}: {e}")
                continue
        
        # Final bulk insert
        print("💾 Final bulk insert of all collected data...")
        
        if positions_batch:
            pd.DataFrame(positions_batch).to_sql('positions', engine, if_exists='append', index=False)
            print(f"  ✅ Inserted {len(positions_batch)} positions")
        
        if degrees_batch:
            pd.DataFrame(degrees_batch).to_sql('degrees', engine, if_exists='append', index=False)
            print(f"  ✅ Inserted {len(degrees_batch)} degrees")
        
        if investments_batch:
            pd.DataFrame(investments_batch).to_sql('investments', engine, if_exists='append', index=False)
            print(f"  ✅ Inserted {len(investments_batch)} investments")
        
        if areas_of_interest_batch:
            pd.DataFrame(areas_of_interest_batch).to_sql('areas_of_interest', engine, if_exists='append', index=False)
            print(f"  ✅ Inserted {len(areas_of_interest_batch)} areas of interest")
        
        if investment_locations_batch:
            pd.DataFrame(investment_locations_batch).to_sql('investment_locations', engine, if_exists='append', index=False)
            print(f"  ✅ Inserted {len(investment_locations_batch)} investment locations")
        
        if investor_stages_batch:
            pd.DataFrame(investor_stages_batch).to_sql('investor_stages', engine, if_exists='append', index=False)
            print(f"  ✅ Inserted {len(investor_stages_batch)} investor stages")
        
        if image_urls_batch:
            pd.DataFrame(image_urls_batch).to_sql('image_urls', engine, if_exists='append', index=False)
            print(f"  ✅ Inserted {len(image_urls_batch)} image URLs")
        
        if media_links_batch:
            pd.DataFrame(media_links_batch).to_sql('media_links', engine, if_exists='append', index=False)
            print(f"  ✅ Inserted {len(media_links_batch)} media links")

def main():
    print("🚀 Populating nested relational data (FIXED VERSION)...")
    
    try:
        # Load parquet file
        print("📄 Loading parquet file...")
        df = pd.read_parquet('/home/damian/ExperimentationKaizhen/Nvestiv/Sample_Investor_DB/investors.parquet')
        print(f"✅ Loaded {len(df)} records")
        
        # Create connection
        connection_string = f"postgresql://{DB_CONFIG['username']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}"
        engine = create_engine(connection_string)
        
        # Process nested data
        process_nested_data(df, engine)
        
        # Verify results
        print("\n📊 Final table counts:")
        with engine.connect() as conn:
            tables = ['persons', 'firms', 'locations', 'investors', 'positions', 'degrees', 
                     'investments', 'areas_of_interest', 'investment_locations', 'investor_stages', 
                     'image_urls', 'media_links', 'schools', 'companies']
            
            for table in tables:
                try:
                    result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.fetchone()[0]
                    print(f"  {table}: {count} records")
                except Exception as e:
                    print(f"  {table}: ERROR - {e}")
        
        # Show sample relational queries
        print("\n🔗 Sample relational queries:")
        with engine.connect() as conn:
            # Positions query
            result = conn.execute(text("""
                SELECT p.name, pos.title, c.name as company_name
                FROM positions pos
                JOIN persons p ON pos.person_id = p.id
                LEFT JOIN companies c ON pos.company_id = c.id
                WHERE p.name IS NOT NULL
                LIMIT 3
            """))
            
            print("  📊 Career positions:")
            for row in result.fetchall():
                print(f"    - {row[0]}: {row[1]} at {row[2]}")
            
            # Areas of interest query
            result = conn.execute(text("""
                SELECT p.name, aoi.display_name
                FROM areas_of_interest aoi
                JOIN investors i ON aoi.investor_id = i.id
                JOIN persons p ON i.person_id = p.id
                WHERE p.name IS NOT NULL
                LIMIT 5
            """))
            
            print("  🎯 Investment interests:")
            for row in result.fetchall():
                print(f"    - {row[0]}: {row[1]}")
        
        print("\n🎉 COMPLETE relational database with nested data populated successfully!")
        
    except Exception as e:
        print(f"❌ Population failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()