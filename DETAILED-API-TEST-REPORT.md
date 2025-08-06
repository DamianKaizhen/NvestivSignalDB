# Detailed API Test Report - Nvestiv Signal DB

**Generated:** 2025-08-05T01:14:25.483Z
**Total Tests:** 21
**Passed:** 17
**Failed:** 4
**Success Rate:** 80.95%

## Warnings

- ⚠️ Network stats investor count issue
- ⚠️ Investor search not returning array
- ⚠️ Investor search not returning array
- ⚠️ Investor search not returning array
- ⚠️ Investor search not returning array

## Endpoint Test Results

### ✅ /health

- **Status:** 200 OK
- **Response Time:** 66ms
- **Expected:** 200
- **Passed:** Yes
- **Data Type:** object
- **Object Keys:** status, timestamp, version, database, features, endpoints

### ✅ /api/network/stats

- **Status:** 200 OK
- **Response Time:** 61ms
- **Expected:** 200
- **Passed:** Yes
- **Data Type:** object
- **Object Keys:** totalInvestors, totalPeople, totalFirms, withLinkedIn, withInvestments, claimedProfiles, highQuality, networkTiers, qualityTiers, topFirms, investmentFocus

### ✅ /api/investors/search?q=venture&limit=10

- **Status:** 200 OK
- **Response Time:** 32ms
- **Expected:** 200
- **Passed:** Yes
- **Data Type:** object
- **Object Keys:** success, data, meta

### ✅ /api/investors/search?q=fintech&limit=10

- **Status:** 200 OK
- **Response Time:** 31ms
- **Expected:** 200
- **Passed:** Yes
- **Data Type:** object
- **Object Keys:** success, data, meta

### ✅ /api/investors/search?q=healthcare&limit=10

- **Status:** 200 OK
- **Response Time:** 32ms
- **Expected:** 200
- **Passed:** Yes
- **Data Type:** object
- **Object Keys:** success, data, meta

### ✅ /api/investors/search?q=tech&limit=10

- **Status:** 200 OK
- **Response Time:** 31ms
- **Expected:** 200
- **Passed:** Yes
- **Data Type:** object
- **Object Keys:** success, data, meta

### ✅ /api/investors/search?q=venture&limit=1

- **Status:** 200 OK
- **Response Time:** 31ms
- **Expected:** 200
- **Passed:** Yes
- **Data Type:** object
- **Object Keys:** success, data, meta

### ❌ /api/investors/1

- **Status:** 404 Not Found
- **Response Time:** 233ms
- **Expected:** 200
- **Passed:** No
- **Data Type:** object
- **Object Keys:** success, error

### ✅ /api/search/ai?q=fintech%20companies%20focused%20on%20payments

- **Status:** 200 OK
- **Response Time:** 57ms
- **Expected:** 200
- **Passed:** Yes
- **Data Type:** object
- **Object Keys:** success, data, meta

### ✅ /api/search/ai?q=sustainable%20technology%20investors

- **Status:** 200 OK
- **Response Time:** 56ms
- **Expected:** 200
- **Passed:** Yes
- **Data Type:** object
- **Object Keys:** success, data, meta

### ✅ /api/search/ai?q=healthcare%20innovation

- **Status:** 200 OK
- **Response Time:** 38ms
- **Expected:** 200
- **Passed:** Yes
- **Data Type:** object
- **Object Keys:** success, data, meta

### ✅ /api/firms

- **Status:** 200 OK
- **Response Time:** 60ms
- **Expected:** 200
- **Passed:** Yes
- **Data Type:** object
- **Object Keys:** success, data, meta

### ❌ /api/firms/search?q=venture&limit=10

- **Status:** 400 Bad Request
- **Response Time:** 2ms
- **Expected:** 200
- **Passed:** No
- **Data Type:** object
- **Object Keys:** success, error

### ❌ /api/firms/analysis

- **Status:** 500 Internal Server Error
- **Response Time:** 2ms
- **Expected:** 200
- **Passed:** No
- **Data Type:** object
- **Object Keys:** error

### ❌ /api/diagnostics

- **Status:** 404 Not Found
- **Response Time:** 1ms
- **Expected:** 200
- **Passed:** No
- **Data Type:** object
- **Object Keys:** success, error

### ✅ /api/nonexistent

- **Status:** 404 Not Found
- **Response Time:** 3ms
- **Expected:** 404
- **Passed:** Yes
- **Data Type:** object
- **Object Keys:** success, error

### ✅ /api/investors/invalid-id

- **Status:** 400 Bad Request
- **Response Time:** 2ms
- **Expected:** 400
- **Passed:** Yes
- **Data Type:** object
- **Object Keys:** success, error

### ✅ /api/investors/search?q=

- **Status:** 200 OK
- **Response Time:** 31ms
- **Expected:** 200
- **Passed:** Yes
- **Data Type:** object
- **Object Keys:** success, data, meta

### ✅ /api/investors/search?q=tech&limit=50

- **Status:** 200 OK
- **Response Time:** 33ms
- **Expected:** 200
- **Passed:** Yes
- **Data Type:** object
- **Object Keys:** success, data, meta

## Recommendations

### Failed Endpoints

- **/api/investors/1:** 404 Not Found
- **/api/firms/search?q=venture&limit=10:** 400 Bad Request
- **/api/firms/analysis:** 500 Internal Server Error
- **/api/diagnostics:** 404 Not Found
