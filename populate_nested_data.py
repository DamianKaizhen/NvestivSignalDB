#!/usr/bin/env python3
"""
Populate the nested relational tables from parquet data
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

def process_nested_data(df, engine):
    """Process all nested data and populate relational tables"""
    
    print("🔄 Processing nested relational data...")
    
    with engine.connect() as conn:
        # Get existing mappings
        person_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, slug FROM persons")).fetchall()}
        firm_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, slug FROM firms")).fetchall()}
        location_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, display_name FROM locations")).fetchall()}
        
        # Get investor mappings (investor_id -> person_id)
        investor_person_map = {row[0]: row[1] for row in conn.execute(text("SELECT id, person_id FROM investors WHERE person_id IS NOT NULL")).fetchall()}
        
        print(f"📋 Working with {len(person_map)} persons, {len(investor_person_map)} investors")
        
        # Batch data for bulk insert
        positions_batch = []
        degrees_batch = []
        investments_batch = []
        investment_rounds_batch = []
        areas_of_interest_batch = []
        investment_locations_batch = []
        investor_stages_batch = []
        image_urls_batch = []
        media_links_batch = []
        
        school_map = {}
        company_map = {}
        
        for idx, row in df.iterrows():
            if idx % 2000 == 0:
                print(f"  Processing record {idx}/{len(df)}")
            
            try:
                # Get investor_id for this record
                investor_id = idx + 1  # Assuming sequential IDs
                
                # Get person data to extract nested info
                person_data = safe_get(row, 'person', {})
                person_id = None
                
                if isinstance(person_data, dict) and person_data:
                    person_slug = safe_get(person_data, 'slug', f'person_{idx}')
                    person_id = person_map.get(person_slug)
                
                # 1. Process POSITIONS
                positions_data = safe_get(row, 'positions', [])
                if isinstance(positions_data, list) and person_id:
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
                
                # 2. Process DEGREES
                degrees_data = safe_get(row, 'degrees', [])
                if isinstance(degrees_data, list) and person_id:
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
                                    else:
                                        school_id = school_map[school_name]
                            
                            degrees_batch.append({
                                'person_id': person_id,
                                'school_id': school_id,
                                'degree_name': safe_get(degree, 'name'),
                                'field_of_study': safe_get(degree, 'field_of_study')
                            })
                
                # 3. Process INVESTMENTS
                investments_data = safe_get(row, 'investments_on_record', {})
                if isinstance(investments_data, dict):
                    edges = safe_get(investments_data, 'edges', [])
                    if isinstance(edges, list):
                        for edge in edges:
                            if isinstance(edge, dict):
                                node = safe_get(edge, 'element', {})
                                if isinstance(node, dict):
                                    node_data = safe_get(node, 'node', {})
                                    if isinstance(node_data, dict):
                                        company_name = safe_get(node_data, 'company_display_name')
                                        total_raised = safe_get(node_data, 'total_raised', [])
                                        
                                        if company_name:
                                            investments_batch.append({
                                                'investor_id': investor_id,
                                                'company_display_name': company_name,
                                                'total_raised_json': json.dumps(total_raised) if total_raised else None
                                            })
                
                # 4. Process AREAS OF INTEREST
                areas_data = safe_get(row, 'areas_of_interest', [])
                if isinstance(areas_data, list):
                    for area in areas_data:
                        if isinstance(area, dict):
                            areas_of_interest_batch.append({
                                'investor_id': investor_id,
                                'kind': safe_get(area, 'kind'),
                                'display_name': safe_get(area, 'display_name')
                            })
                
                # 5. Process INVESTMENT LOCATIONS
                inv_locations_data = safe_get(row, 'investment_locations', [])
                if isinstance(inv_locations_data, list):
                    for loc in inv_locations_data:
                        if isinstance(loc, dict):
                            investment_locations_batch.append({
                                'investor_id': investor_id,
                                'kind': safe_get(loc, 'kind'),
                                'display_name': safe_get(loc, 'display_name')
                            })
                
                # 6. Process STAGES
                stages_data = safe_get(row, 'stages', [])
                if isinstance(stages_data, list):
                    for stage in stages_data:
                        if isinstance(stage, dict):
                            stage_element = safe_get(stage, 'element', stage)
                            if isinstance(stage_element, dict):
                                investor_stages_batch.append({
                                    'investor_id': investor_id,
                                    'kind': safe_get(stage_element, 'kind'),
                                    'display_name': safe_get(stage_element, 'display_name')
                                })
                
                # 7. Process IMAGE URLS
                image_urls_data = safe_get(row, 'image_urls', [])
                if isinstance(image_urls_data, list):
                    for url in image_urls_data:
                        if url and isinstance(url, str):
                            image_urls_batch.append({
                                'investor_id': investor_id,
                                'url': url,
                                'is_edit_mode': False
                            })
                
                # Process edit mode images separately
                edit_image_urls_data = safe_get(row, 'image_urls_edit_mode', [])
                if isinstance(edit_image_urls_data, list):
                    for url in edit_image_urls_data:
                        if url and isinstance(url, str):
                            image_urls_batch.append({
                                'investor_id': investor_id,
                                'url': url,
                                'is_edit_mode': True
                            })
                
                # 8. Process MEDIA LINKS
                media_data = safe_get(row, 'media_links', [])
                if isinstance(media_data, list):
                    for media in media_data:
                        if isinstance(media, dict):
                            media_element = safe_get(media, 'element', media)
                            if isinstance(media_element, dict):
                                media_links_batch.append({
                                    'investor_id': investor_id,
                                    'url': safe_get(media_element, 'url'),
                                    'title': safe_get(media_element, 'title'),
                                    'image_url': safe_get(media_element, 'image_url')
                                })
                
                # Bulk insert every 1000 records
                if len(positions_batch) >= 1000:
                    if positions_batch:
                        pd.DataFrame(positions_batch).to_sql('positions', engine, if_exists='append', index=False)
                        positions_batch = []
                    
                    if degrees_batch:
                        pd.DataFrame(degrees_batch).to_sql('degrees', engine, if_exists='append', index=False)
                        degrees_batch = []
                    
                    if investments_batch:
                        pd.DataFrame(investments_batch).to_sql('investments', engine, if_exists='append', index=False)
                        investments_batch = []
                    
                    if areas_of_interest_batch:
                        pd.DataFrame(areas_of_interest_batch).to_sql('areas_of_interest', engine, if_exists='append', index=False)
                        areas_of_interest_batch = []
                    
                    if investment_locations_batch:
                        pd.DataFrame(investment_locations_batch).to_sql('investment_locations', engine, if_exists='append', index=False)
                        investment_locations_batch = []
                    
                    if investor_stages_batch:
                        pd.DataFrame(investor_stages_batch).to_sql('investor_stages', engine, if_exists='append', index=False)
                        investor_stages_batch = []
                    
                    if image_urls_batch:
                        pd.DataFrame(image_urls_batch).to_sql('image_urls', engine, if_exists='append', index=False)
                        image_urls_batch = []
                    
                    if media_links_batch:
                        pd.DataFrame(media_links_batch).to_sql('media_links', engine, if_exists='append', index=False)
                        media_links_batch = []
                    
                    print(f"    💾 Bulk inserted batch at record {idx}")
            
            except Exception as e:
                print(f"Error processing record {idx}: {e}")
                continue
        
        # Final bulk insert of remaining data
        print("💾 Final bulk insert of remaining data...")
        
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
    print("🚀 Populating nested relational data...")
    
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
        
        print("\n🎉 Nested relational data populated successfully!")
        print("You now have a COMPLETE relational database with all nested data!")
        
    except Exception as e:
        print(f"❌ Population failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()