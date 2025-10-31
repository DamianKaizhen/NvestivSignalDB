#!/usr/bin/env python3
"""
Complete population of all nested relational data - OPTIMIZED
"""

import pandas as pd
import numpy as np
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

def safe_get(obj, key, default=None):
    """Safely get value from dict-like object"""
    if isinstance(obj, dict):
        return obj.get(key, default)
    return default

def process_all_nested_data():
    """Process all nested data in batches"""
    
    print("🚀 Loading and processing all nested data...")
    
    # Load parquet file
    df = pd.read_parquet('/home/damian/ExperimentationKaizhen/Nvestiv/Sample_Investor_DB/investors.parquet')
    engine = create_engine(f"postgresql://{DB_CONFIG['username']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    
    print(f"📄 Processing {len(df)} records...")
    
    # Clear existing nested data to avoid duplicates
    with engine.connect() as conn:
        tables_to_clear = ['positions', 'degrees', 'investments', 'areas_of_interest', 
                          'investment_locations', 'investor_stages', 'image_urls', 'media_links']
        for table in tables_to_clear:
            conn.execute(text(f"TRUNCATE TABLE {table} CASCADE"))
        conn.commit()
        print("🧹 Cleared existing nested data")
    
    # Get person mappings
    with engine.connect() as conn:
        person_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, slug FROM persons")).fetchall()}
    
    # Collect all data
    all_positions = []
    all_degrees = []
    all_investments = []
    all_areas = []
    all_locations = []
    all_stages = []
    all_images = []
    all_media = []
    
    school_map = {}
    company_map = {}
    
    print("🔄 Extracting all nested data...")
    
    for idx, row in df.iterrows():
        if idx % 5000 == 0:
            print(f"  Processing {idx}/{len(df)} - Areas: {len(all_areas)}, Positions: {len(all_positions)}")
        
        investor_id = idx + 1
        
        # Get person_id
        person_data = safe_get(row, 'person', {})
        person_id = None
        if isinstance(person_data, dict) and person_data:
            person_slug = safe_get(person_data, 'slug', f'person_{idx}')
            person_id = person_map.get(person_slug)
        
        # 1. Areas of Interest
        areas = row.get('areas_of_interest')
        if isinstance(areas, np.ndarray) and areas.size > 0:
            for area in areas:
                if isinstance(area, dict):
                    all_areas.append({
                        'investor_id': investor_id,
                        'kind': safe_get(area, 'kind'),
                        'display_name': safe_get(area, 'display_name')
                    })
        
        # 2. Investment Locations
        locations = row.get('investment_locations')
        if isinstance(locations, np.ndarray) and locations.size > 0:
            for loc in locations:
                if isinstance(loc, dict):
                    all_locations.append({
                        'investor_id': investor_id,
                        'kind': safe_get(loc, 'kind'),
                        'display_name': safe_get(loc, 'display_name')
                    })
        
        # 3. Stages
        stages = row.get('stages')
        if isinstance(stages, np.ndarray) and stages.size > 0:
            for stage in stages:
                if isinstance(stage, dict):
                    all_stages.append({
                        'investor_id': investor_id,
                        'kind': safe_get(stage, 'kind'),
                        'display_name': safe_get(stage, 'display_name')
                    })
        
        # 4. Image URLs
        images = row.get('image_urls')
        if isinstance(images, np.ndarray) and images.size > 0:
            for img in images:
                if img and isinstance(img, str):
                    all_images.append({
                        'investor_id': investor_id,
                        'url': img,
                        'is_edit_mode': False
                    })
        
        # Edit mode images
        edit_images = row.get('image_urls_edit_mode')
        if isinstance(edit_images, np.ndarray) and edit_images.size > 0:
            for img in edit_images:
                if img and isinstance(img, str):
                    all_images.append({
                        'investor_id': investor_id,
                        'url': img,
                        'is_edit_mode': True
                    })
        
        # 5. Media Links
        media = row.get('media_links')
        if isinstance(media, np.ndarray) and media.size > 0:
            for m in media:
                if isinstance(m, dict):
                    all_media.append({
                        'investor_id': investor_id,
                        'url': safe_get(m, 'url'),
                        'title': safe_get(m, 'title'),
                        'image_url': safe_get(m, 'image_url')
                    })
        
        # 6. Positions (if person exists)
        if person_id:
            positions = row.get('positions')
            if isinstance(positions, np.ndarray) and positions.size > 0:
                for pos in positions:
                    if isinstance(pos, dict):
                        # Handle company
                        company_data = safe_get(pos, 'company', {})
                        company_name = safe_get(company_data, 'name') if company_data else None
                        
                        start_date = safe_get(pos, 'start_date', {})
                        end_date = safe_get(pos, 'end_date', {})
                        
                        all_positions.append({
                            'person_id': person_id,
                            'company_name': company_name,  # We'll resolve this later
                            'company_display_name': safe_get(company_data, 'display_name') if company_data else None,
                            'company_employee_count': safe_get(company_data, 'total_employee_count') if company_data else None,
                            'title': safe_get(pos, 'title'),
                            'start_month': safe_get(start_date, 'month') if isinstance(start_date, dict) else None,
                            'start_year': safe_get(start_date, 'year') if isinstance(start_date, dict) else None,
                            'end_month': safe_get(end_date, 'month') if isinstance(end_date, dict) else None,
                            'end_year': safe_get(end_date, 'year') if isinstance(end_date, dict) else None
                        })
            
            # 7. Degrees
            degrees = row.get('degrees')
            if isinstance(degrees, np.ndarray) and degrees.size > 0:
                for deg in degrees:
                    if isinstance(deg, dict):
                        school_data = safe_get(deg, 'school', {})
                        school_name = safe_get(school_data, 'name') if school_data else None
                        
                        all_degrees.append({
                            'person_id': person_id,
                            'school_name': school_name,
                            'school_display_name': safe_get(school_data, 'display_name') if school_data else None,
                            'school_student_count': safe_get(school_data, 'total_student_count') if school_data else None,
                            'degree_name': safe_get(deg, 'name'),
                            'field_of_study': safe_get(deg, 'field_of_study')
                        })
        
        # 8. Investments
        investments = row.get('investments_on_record')
        if isinstance(investments, dict):
            edges = safe_get(investments, 'edges', [])
            if isinstance(edges, np.ndarray) and edges.size > 0:
                for edge in edges:
                    if isinstance(edge, dict):
                        node = safe_get(edge, 'node', {})
                        if isinstance(node, dict):
                            total_raised = safe_get(node, 'total_raised', [])
                            # Convert numpy array to list for JSON serialization
                            if isinstance(total_raised, np.ndarray):
                                total_raised = total_raised.tolist()
                            
                            all_investments.append({
                                'investor_id': investor_id,
                                'company_display_name': safe_get(node, 'company_display_name'),
                                'total_raised_json': json.dumps(total_raised) if total_raised else None
                            })
    
    print(f"✅ Extracted all data:")
    print(f"  Areas of interest: {len(all_areas)}")
    print(f"  Investment locations: {len(all_locations)}")
    print(f"  Stages: {len(all_stages)}")
    print(f"  Image URLs: {len(all_images)}")
    print(f"  Media links: {len(all_media)}")
    print(f"  Positions: {len(all_positions)}")
    print(f"  Degrees: {len(all_degrees)}")
    print(f"  Investments: {len(all_investments)}")
    
    # Bulk insert all data
    print("💾 Bulk inserting all data...")
    
    if all_areas:
        pd.DataFrame(all_areas).to_sql('areas_of_interest', engine, if_exists='append', index=False)
        print(f"  ✅ Inserted {len(all_areas)} areas of interest")
    
    if all_locations:
        pd.DataFrame(all_locations).to_sql('investment_locations', engine, if_exists='append', index=False)
        print(f"  ✅ Inserted {len(all_locations)} investment locations")
    
    if all_stages:
        pd.DataFrame(all_stages).to_sql('investor_stages', engine, if_exists='append', index=False)
        print(f"  ✅ Inserted {len(all_stages)} investor stages")
    
    if all_images:
        pd.DataFrame(all_images).to_sql('image_urls', engine, if_exists='append', index=False)
        print(f"  ✅ Inserted {len(all_images)} image URLs")
    
    if all_media:
        pd.DataFrame(all_media).to_sql('media_links', engine, if_exists='append', index=False)
        print(f"  ✅ Inserted {len(all_media)} media links")
    
    if all_investments:
        pd.DataFrame(all_investments).to_sql('investments', engine, if_exists='append', index=False)
        print(f"  ✅ Inserted {len(all_investments)} investments")
    
    # Handle positions and degrees with foreign keys
    if all_positions:
        # Create companies first
        unique_companies = {}
        for pos in all_positions:
            if pos['company_name']:
                unique_companies[pos['company_name']] = {
                    'name': pos['company_name'],
                    'display_name': pos['company_display_name'],
                    'total_employee_count': pos['company_employee_count']
                }
        
        if unique_companies:
            companies_df = pd.DataFrame(list(unique_companies.values()))
            companies_df.to_sql('companies', engine, if_exists='append', index=False)
            print(f"  ✅ Inserted {len(unique_companies)} companies")
        
        # Get company mappings and insert positions
        with engine.connect() as conn:
            company_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, name FROM companies")).fetchall()}
        
        positions_with_fk = []
        for pos in all_positions:
            positions_with_fk.append({
                'person_id': pos['person_id'],
                'company_id': company_map.get(pos['company_name']),
                'title': pos['title'],
                'start_month': pos['start_month'],
                'start_year': pos['start_year'],
                'end_month': pos['end_month'],
                'end_year': pos['end_year']
            })
        
        pd.DataFrame(positions_with_fk).to_sql('positions', engine, if_exists='append', index=False)
        print(f"  ✅ Inserted {len(positions_with_fk)} positions")
    
    if all_degrees:
        # Create schools first
        unique_schools = {}
        for deg in all_degrees:
            if deg['school_name']:
                unique_schools[deg['school_name']] = {
                    'name': deg['school_name'],
                    'display_name': deg['school_display_name'],
                    'total_student_count': deg['school_student_count']
                }
        
        if unique_schools:
            schools_df = pd.DataFrame(list(unique_schools.values()))
            schools_df.to_sql('schools', engine, if_exists='append', index=False)
            print(f"  ✅ Inserted {len(unique_schools)} schools")
        
        # Get school mappings and insert degrees
        with engine.connect() as conn:
            school_map = {row[1]: row[0] for row in conn.execute(text("SELECT id, name FROM schools")).fetchall()}
        
        degrees_with_fk = []
        for deg in all_degrees:
            degrees_with_fk.append({
                'person_id': deg['person_id'],
                'school_id': school_map.get(deg['school_name']),
                'degree_name': deg['degree_name'],
                'field_of_study': deg['field_of_study']
            })
        
        pd.DataFrame(degrees_with_fk).to_sql('degrees', engine, if_exists='append', index=False)
        print(f"  ✅ Inserted {len(degrees_with_fk)} degrees")

def main():
    try:
        process_all_nested_data()
        
        # Final verification
        print("\n📊 Final comprehensive table counts:")
        engine = create_engine(f"postgresql://{DB_CONFIG['username']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
        
        with engine.connect() as conn:
            tables = ['persons', 'firms', 'locations', 'investors', 'positions', 'degrees', 
                     'investments', 'areas_of_interest', 'investment_locations', 'investor_stages', 
                     'image_urls', 'media_links', 'schools', 'companies']
            
            for table in tables:
                result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
                count = result.fetchone()[0]
                print(f"  {table}: {count:,} records")
        
        print("\n🎉 COMPLETE RELATIONAL DATABASE WITH ALL NESTED DATA!")
        
    except Exception as e:
        print(f"❌ Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()