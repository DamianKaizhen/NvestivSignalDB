#!/usr/bin/env python3
"""
Interactive tool to explore database relationships
"""

from sqlalchemy import create_engine, text

# Database connection
engine = create_engine('postgresql://damian.k:Adminaccount1!@135.181.194.2:5433/signal_db')

def show_table_relationships():
    """Show all foreign key relationships in a readable format"""
    print("🔗 DATABASE RELATIONSHIPS EXPLORER")
    print("=" * 50)
    
    with engine.connect() as conn:
        # Get all foreign key relationships
        result = conn.execute(text('''
            SELECT 
                tc.table_name AS child_table,
                kcu.column_name AS child_column,
                ccu.table_name AS parent_table,
                ccu.column_name AS parent_column
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu 
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage ccu 
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            ORDER BY tc.table_name;
        '''))
        
        relationships = {}
        for row in result.fetchall():
            child_table = row[0]
            if child_table not in relationships:
                relationships[child_table] = []
            relationships[child_table].append({
                'child_column': row[1],
                'parent_table': row[2],
                'parent_column': row[3]
            })
        
        print("\n📋 TABLE RELATIONSHIPS (Child → Parent):")
        for child_table, relations in relationships.items():
            print(f"\n🔹 {child_table.upper()}:")
            for rel in relations:
                print(f"    {rel['child_column']} → {rel['parent_table']}.{rel['parent_column']}")

def show_sample_joins():
    """Show sample JOIN queries for exploring relationships"""
    print("\n🔗 SAMPLE JOIN QUERIES:")
    print("=" * 30)
    
    queries = [
        {
            'name': 'Investor Profile with Firm & Location',
            'query': '''
                SELECT p.name as person, f.name as firm, i.position, l.display_name as location
                FROM investors i
                LEFT JOIN persons p ON i.person_id = p.id
                LEFT JOIN firms f ON i.firm_id = f.id
                LEFT JOIN locations l ON i.location_id = l.id
                WHERE p.name IS NOT NULL
                LIMIT 5;
            '''
        },
        {
            'name': 'Investors with Their Areas of Interest',
            'query': '''
                SELECT p.name, aoi.display_name as interest_area
                FROM investors i
                JOIN persons p ON i.person_id = p.id
                JOIN areas_of_interest aoi ON i.id = aoi.investor_id
                WHERE p.name IS NOT NULL
                ORDER BY p.name
                LIMIT 10;
            '''
        },
        {
            'name': 'Investment Activity by Investor',
            'query': '''
                SELECT p.name, COUNT(inv.id) as investment_count, 
                       STRING_AGG(DISTINCT inv.company_display_name, ', ') as companies
                FROM investors i
                JOIN persons p ON i.person_id = p.id
                LEFT JOIN investments inv ON i.id = inv.investor_id
                WHERE p.name IS NOT NULL
                GROUP BY p.name
                HAVING COUNT(inv.id) > 0
                ORDER BY investment_count DESC
                LIMIT 5;
            '''
        },
        {
            'name': 'Firm Investment Focus Analysis',
            'query': '''
                SELECT f.name as firm, aoi.display_name as focus_area, COUNT(*) as investor_count
                FROM firms f
                JOIN investors i ON f.id = i.firm_id
                JOIN areas_of_interest aoi ON i.id = aoi.investor_id
                WHERE f.name IS NOT NULL
                GROUP BY f.name, aoi.display_name
                HAVING COUNT(*) >= 3
                ORDER BY firm, investor_count DESC
                LIMIT 15;
            '''
        }
    ]
    
    with engine.connect() as conn:
        for i, q in enumerate(queries, 1):
            print(f"\n{i}. {q['name']}:")
            print("   Query:")
            print(f"   {q['query'].strip()}")
            print("\n   Results:")
            
            try:
                result = conn.execute(text(q['query']))
                rows = result.fetchall()
                if rows:
                    for row in rows:
                        print(f"   {row}")
                else:
                    print("   No results")
            except Exception as e:
                print(f"   Error: {e}")

def show_table_stats():
    """Show statistics about table relationships"""
    print("\n📊 RELATIONSHIP STATISTICS:")
    print("=" * 30)
    
    with engine.connect() as conn:
        # Core entity stats
        result = conn.execute(text('''
            SELECT 
                COUNT(*) as total_investors,
                COUNT(person_id) as with_person,
                COUNT(firm_id) as with_firm,
                COUNT(location_id) as with_location
            FROM investors;
        '''))
        stats = result.fetchone()
        print(f"\n🎯 CORE ENTITIES:")
        print(f"  Total investors: {stats[0]:,}")
        print(f"  With person data: {stats[1]:,} ({100*stats[1]/stats[0]:.1f}%)")
        print(f"  With firm data: {stats[2]:,} ({100*stats[2]/stats[0]:.1f}%)")
        print(f"  With location data: {stats[3]:,} ({100*stats[3]/stats[0]:.1f}%)")
        
        # Relationship density
        result = conn.execute(text('''
            SELECT 
                'areas_of_interest' as table_name,
                COUNT(*) as total_records,
                COUNT(DISTINCT investor_id) as unique_investors,
                ROUND(AVG(cnt), 2) as avg_per_investor
            FROM (
                SELECT investor_id, COUNT(*) as cnt
                FROM areas_of_interest
                GROUP BY investor_id
            ) subq
            
            UNION ALL
            
            SELECT 
                'investment_locations' as table_name,
                COUNT(*) as total_records,
                COUNT(DISTINCT investor_id) as unique_investors,
                ROUND(AVG(cnt), 2) as avg_per_investor
            FROM (
                SELECT investor_id, COUNT(*) as cnt
                FROM investment_locations
                GROUP BY investor_id
            ) subq
            
            UNION ALL
            
            SELECT 
                'investments' as table_name,
                COUNT(*) as total_records,
                COUNT(DISTINCT investor_id) as unique_investors,
                ROUND(AVG(cnt), 2) as avg_per_investor
            FROM (
                SELECT investor_id, COUNT(*) as cnt
                FROM investments
                GROUP BY investor_id
            ) subq;
        '''))
        
        print(f"\n📈 RELATIONSHIP DENSITY:")
        for row in result.fetchall():
            print(f"  {row[0]}: {row[1]:,} records across {row[2]:,} investors (avg: {row[3]} per investor)")

def main():
    print("Starting database relationship exploration...")
    
    try:
        show_table_relationships()
        show_table_stats()
        show_sample_joins()
        
        print("\n" + "="*50)
        print("🎉 RELATIONSHIP EXPLORATION COMPLETE!")
        print("\nYou can now run complex queries across all related tables.")
        print("Use the foreign key relationships shown above to JOIN tables together.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()