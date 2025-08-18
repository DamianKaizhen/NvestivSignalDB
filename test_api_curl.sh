#!/bin/bash

# API Standardization Test Suite - Curl Version
# Tests all endpoints for consistent response formats and validation

BASE_URL="http://localhost:3010"
PASSED=0
FAILED=0
TOTAL=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    PASSED=$((PASSED + 1))
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    FAILED=$((FAILED + 1))
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test function
run_test() {
    local test_name="$1"
    local url="$2"
    local expected_status="$3"
    local validation_cmd="$4"
    
    TOTAL=$((TOTAL + 1))
    log_info "Running: $test_name"
    
    # Measure response time
    start_time=$(date +%s%N)
    
    # Make request
    response=$(curl -s -w "%{http_code}" -o /tmp/api_response.json "$BASE_URL$url")
    http_code="${response: -3}"
    
    end_time=$(date +%s%N)
    duration=$((($end_time - $start_time) / 1000000))  # Convert to milliseconds
    
    # Check HTTP status
    if [ "$http_code" != "$expected_status" ]; then
        log_error "$test_name: Expected status $expected_status, got $http_code (${duration}ms)"
        return 1
    fi
    
    # Validate response format
    if [ -n "$validation_cmd" ]; then
        if ! eval "$validation_cmd" > /dev/null 2>&1; then
            log_error "$test_name: Response validation failed (${duration}ms)"
            cat /tmp/api_response.json | head -c 200
            echo ""
            return 1
        fi
    fi
    
    log_success "$test_name (${duration}ms)"
    return 0
}

# Validation functions
validate_success_response() {
    jq -e '.success == true and .data != null and .meta != null and .meta.timestamp != null' /tmp/api_response.json
}

validate_error_response() {
    jq -e '.success == false and .error != null and .error.message != null and .error.code != null and .error.timestamp != null' /tmp/api_response.json
}

validate_investor_search() {
    jq -e '.success == true and .data.results != null and (.data.results | type) == "array" and .data.pagination != null' /tmp/api_response.json
}

validate_investor_detail() {
    jq -e '.success == true and .data.investor != null and .data.investor.id != null' /tmp/api_response.json
}

validate_firms_list() {
    jq -e '.success == true and .data.items != null and (.data.items | type) == "array" and .data.pagination != null' /tmp/api_response.json
}

validate_firm_detail() {
    jq -e '.success == true and .data.firm != null and .data.firm.id != null' /tmp/api_response.json
}

validate_ai_search() {
    jq -e '.success == true and .data.query != null and .data.results != null and (.data.results | type) == "array"' /tmp/api_response.json
}

validate_network_stats() {
    jq -e '.success == true and .data.totalInvestors != null and .data.totalFirms != null' /tmp/api_response.json
}

validate_network_graph() {
    jq -e '.success == true and .data.nodes != null and (.data.nodes | type) == "array"' /tmp/api_response.json
}

# Check if server is running
echo -e "${BOLD}🚀 Starting API Standardization Test Suite${NC}\n"

if ! curl -s "$BASE_URL/health" > /dev/null; then
    log_error "API server is not accessible at $BASE_URL"
    echo "Please start the server first: node api_server.js"
    exit 1
fi

log_success "API server is running and accessible"
echo ""

# Test Suite
echo -e "${BOLD}📋 Running Tests:${NC}"

# Test 1: Health Endpoint
run_test "Health Endpoint" "/health" "200" "validate_success_response"

# Test 2: Investor Search - Valid
run_test "Investor Search - Valid" "/api/investors/search?limit=5&page=1" "200" "validate_investor_search"

# Test 3: Investor Search - Invalid Parameters (should sanitize)
run_test "Investor Search - Sanitization" "/api/investors/search?limit=500&page=-1" "200" "validate_investor_search"

# Test 4: Investor Detail - Valid ID
run_test "Investor Detail - Valid ID" "/api/investors/12582" "200" "validate_investor_detail"

# Test 5: Investor Detail - Invalid ID
run_test "Investor Detail - Not Found" "/api/investors/99999999" "404" "validate_error_response"

# Test 6: Firms List
run_test "Firms List" "/api/firms?limit=3" "200" "validate_firms_list"

# Test 7: Firm Detail
run_test "Firm Detail" "/api/firms/120" "200" "validate_firm_detail"

# Test 8: AI Search - Valid Query
run_test "AI Search - Valid" "/api/search/ai?q=fintech&limit=3" "200" "validate_ai_search"

# Test 9: AI Search - Invalid Query (too short)
run_test "AI Search - Invalid Query" "/api/search/ai?q=ab" "400" "validate_error_response"

# Test 10: Network Stats
run_test "Network Stats" "/api/network/stats" "200" "validate_network_stats"

# Test 11: Network Graph
run_test "Network Graph" "/api/network/graph?limit=50&minConnections=1000" "200" "validate_network_graph"

# Test 12: 404 Error Handling
run_test "404 Error Handling" "/api/nonexistent/endpoint" "404" "validate_error_response"

# Test 13: Validation - Invalid ID format
run_test "Invalid ID Format" "/api/investors/invalid_id" "404" "validate_error_response"

# Test 14: Validation - Excessive limit
run_test "Limit Validation" "/api/investors/search?limit=1000" "200" "validate_investor_search"

echo ""

# Summary
echo -e "${BOLD}📊 Test Summary:${NC}"
echo -e "Total tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $FAILED${NC}"
fi

SUCCESS_RATE=$(echo "scale=1; $PASSED * 100 / $TOTAL" | bc)

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}${BOLD}🎉 All tests passed! Success rate: ${SUCCESS_RATE}%${NC}"
    echo -e "${GREEN}✅ API standardization is complete and working correctly!${NC}"
    
    # Additional validation tests
    echo ""
    echo -e "${BOLD}🔍 Additional Validation Tests:${NC}"
    
    # Test response format consistency
    echo -n "Testing response format consistency... "
    FORMATS_CONSISTENT=true
    
    # Check if all success responses have the same structure
    for endpoint in "/health" "/api/investors/search?limit=1" "/api/firms?limit=1" "/api/network/stats"; do
        curl -s "$BASE_URL$endpoint" | jq -e '.success == true and .data != null and .meta != null' > /dev/null 2>&1
        if [ $? -ne 0 ]; then
            FORMATS_CONSISTENT=false
            break
        fi
    done
    
    if [ "$FORMATS_CONSISTENT" = true ]; then
        echo -e "${GREEN}✅${NC}"
    else
        echo -e "${RED}❌${NC}"
    fi
    
    # Test execution time
    echo -n "Testing response times... "
    SLOW_RESPONSES=0
    
    for endpoint in "/health" "/api/investors/search?limit=5" "/api/network/stats"; do
        start_time=$(date +%s%N)
        curl -s "$BASE_URL$endpoint" > /dev/null
        end_time=$(date +%s%N)
        duration=$((($end_time - $start_time) / 1000000))
        
        if [ $duration -gt 1000 ]; then  # More than 1 second
            SLOW_RESPONSES=$((SLOW_RESPONSES + 1))
        fi
    done
    
    if [ $SLOW_RESPONSES -eq 0 ]; then
        echo -e "${GREEN}✅ All responses under 1s${NC}"
    else
        echo -e "${YELLOW}⚠️  $SLOW_RESPONSES slow responses detected${NC}"
    fi
    
    exit 0
else
    echo ""
    echo -e "${RED}${BOLD}💥 Some tests failed. Success rate: ${SUCCESS_RATE}%${NC}"
    echo -e "${RED}❌ Please review and fix the failing tests.${NC}"
    exit 1
fi