# Database Schema and Relationships

## 🏗️ Entity Relationship Diagram

```
                    ┌─────────────┐
                    │   PERSONS   │
                    │     32K     │
                    │ id (PK)     │
                    │ slug        │
                    │ first_name  │
                    │ last_name   │
                    │ name        │
                    │ linkedin_url│
                    │ ...social   │
                    └─────┬───────┘
                          │ 1:1
                          │
    ┌─────────────┐      │      ┌─────────────┐
    │    FIRMS    │      │      │ LOCATIONS   │
    │    5.7K     │      │      │    608      │
    │ id (PK)     │      │      │ id (PK)     │
    │ name        │◄─────┼──────►│ display_name│
    │ slug        │ many │ one  │ kind        │
    │ fund_size   │      │      └─────────────┘
    └─────────────┘      │
                         │
                    ┌────▼───────┐
                    │ INVESTORS  │
                    │    32K     │ ◄─────┐
                    │ id (PK)    │       │
                    │ person_id  │       │
                    │ firm_id    │       │ 1:many
                    │ location_id│       │
                    │ position   │       │
                    │ headline   │       │
                    │ min_invest │       │
                    │ max_invest │       │
                    │ ...flags   │       │
                    └─────┬──────┘       │
                          │              │
                          │ 1:many       │
                          │              │
        ┌─────────────────┼──────────────┼─────────────────┐
        │                 │              │                 │
        ▼                 ▼              ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌──────────────┐ ┌──────────────┐
│AREAS_INTEREST │ │INVESTMENT_LOC │ │ INVESTMENTS  │ │  IMAGE_URLS  │
│     142K      │ │     38K       │ │     74K      │ │     62K      │
│ id (PK)       │ │ id (PK)       │ │ id (PK)      │ │ id (PK)      │
│ investor_id   │ │ investor_id   │ │ investor_id  │ │ investor_id  │
│ kind          │ │ kind          │ │ company_name │ │ url          │
│ display_name  │ │ display_name  │ │ total_raised │ │ is_edit_mode │
└───────────────┘ └───────────────┘ └──────────────┘ └──────────────┘

        ┌─────────────────┬──────────────────┐
        ▼                 ▼                  ▼
┌───────────────┐ ┌───────────────┐ ┌──────────────┐
│INVESTOR_STAGES│ │  MEDIA_LINKS  │ │  POSITIONS   │
│     75K       │ │      5K       │ │      0       │
│ id (PK)       │ │ id (PK)       │ │ id (PK)      │
│ investor_id   │ │ investor_id   │ │ person_id    │
│ kind          │ │ url           │ │ company_id   │
│ display_name  │ │ title         │ │ title        │
└───────────────┘ └───────────────┘ └──────┬───────┘
                                           │
                                           │ many:1
                                           ▼
                                   ┌──────────────┐
                                   │  COMPANIES   │
                                   │      0       │
                                   │ id (PK)      │
                                   │ name         │
                                   │ display_name │
                                   │ employee_cnt │
                                   └──────────────┘

┌─────────────┐                    ┌──────────────┐
│   DEGREES   │                    │   SCHOOLS    │
│      0      │                    │      0       │
│ id (PK)     │                    │ id (PK)      │
│ person_id   │───────many:1──────►│ name         │
│ school_id   │                    │ display_name │
│ degree_name │                    │ student_cnt  │
│ field_study │                    └──────────────┘
└─────────────┘
      ▲
      │ many:1
      │
┌─────┴───────┐
│   PERSONS   │
│ (see above) │
└─────────────┘
```

## 🔑 Key Relationships

### Core Entity Relationships (1:1 and many:1)
- **investors.person_id → persons.id** (1:1) - Each investor is one person
- **investors.firm_id → firms.id** (many:1) - Multiple investors per firm
- **investors.location_id → locations.id** (many:1) - Multiple investors per location

### Investor Detail Relationships (1:many)
- **investors.id ← areas_of_interest.investor_id** - Investment focus areas
- **investors.id ← investment_locations.investor_id** - Geographic preferences
- **investors.id ← investor_stages.investor_id** - Investment stage preferences
- **investors.id ← investments.investor_id** - Investment portfolio
- **investors.id ← image_urls.investor_id** - Profile photos
- **investors.id ← media_links.investor_id** - Social/media presence

### Person Detail Relationships (1:many)
- **persons.id ← positions.person_id** - Career history
- **persons.id ← degrees.person_id** - Education background

### Supporting Entity Relationships
- **positions.company_id → companies.id** (many:1) - Job positions at companies
- **degrees.school_id → schools.id** (many:1) - Degrees from schools

## 📊 Data Distribution

| Table | Records | Purpose |
|-------|---------|---------|
| persons | 32,780 | Individual people profiles |
| investors | 32,780 | Investor profiles (main entity) |
| firms | 5,761 | Investment companies |
| locations | 608 | Geographic locations |
| areas_of_interest | 142,531 | Investment focus areas |
| investment_locations | 38,943 | Geographic investment preferences |
| investor_stages | 75,435 | Investment stage preferences |
| investments | 74,278 | Portfolio investments |
| image_urls | 62,812 | Profile images |
| media_links | 5,503 | Social media links |
| positions | 0* | Career history |
| degrees | 0* | Education records |
| companies | 0* | Company profiles |
| schools | 0* | Educational institutions |

*Note: Some tables are empty due to processing focus on core investor data

## 🎯 Key Insights

1. **Perfect 1:1 mapping**: Every investor has exactly one person record
2. **High firm concentration**: 32K investors across only 5.7K firms (avg 5-6 investors per firm)
3. **Rich preference data**: Most investors have multiple areas of interest (4.9 avg) and geographic preferences
4. **Comprehensive coverage**: 89% of investors have defined areas of interest
5. **Global reach**: 608 unique locations represented

## 📝 Common Query Patterns

```sql
-- Find investors by expertise
SELECT p.name, f.name, aoi.display_name 
FROM investors i
JOIN persons p ON i.person_id = p.id
JOIN firms f ON i.firm_id = f.id
JOIN areas_of_interest aoi ON i.id = aoi.investor_id
WHERE aoi.display_name ILIKE '%fintech%';

-- Find investors by location and stage
SELECT p.name, f.name, ist.display_name as stage
FROM investors i
JOIN persons p ON i.person_id = p.id
JOIN firms f ON i.firm_id = f.id
JOIN locations l ON i.location_id = l.id
JOIN investor_stages ist ON i.id = ist.investor_id
WHERE l.display_name ILIKE '%san francisco%'
AND ist.display_name ILIKE '%series a%';

-- Analyze investment patterns
SELECT aoi.display_name, COUNT(*) as investor_count
FROM areas_of_interest aoi
GROUP BY aoi.display_name
ORDER BY investor_count DESC
LIMIT 10;
```