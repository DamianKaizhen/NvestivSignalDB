/**
 * Standardized API Response Types for Nvestiv
 * 
 * This file defines TypeScript interfaces for all API responses to ensure
 * consistent data structures between backend and frontend.
 */

// =====================================================
// STANDARD API RESPONSE STRUCTURE
// =====================================================

/**
 * Standard API Response wrapper - ALL endpoints should use this structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMetadata;
}

/**
 * Standardized Error Structure
 */
export interface ApiError {
  message: string;
  code: string;
  details?: any;
  timestamp?: string;
  path?: string;
  stack?: string; // Only in development
}

/**
 * Optional metadata for responses
 */
export interface ApiMetadata {
  timestamp?: string;
  version?: string;
  requestId?: string;
  pagination?: PaginationMeta;
  searchCriteria?: any;
  cached?: boolean;
  executionTime?: number;
  [key: string]: any; // Allow additional metadata
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total?: number;
  hasMore: boolean;
  totalPages?: number;
  nextCursor?: string;
  prevCursor?: string;
}

// =====================================================
// INVESTOR DATA STRUCTURES
// =====================================================

/**
 * Core Investor Profile
 */
export interface Investor {
  id: number;
  slug: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  linkedin_url?: string;
  twitter_url?: string;
  crunchbase_url?: string;
  firm_name?: string;
  current_fund_size?: string;
  position?: string;
  min_investment?: string;
  max_investment?: string;
  target_investment?: string;
  headline?: string;
  claimed?: number;
  can_edit?: number;
  include_in_list?: number;
  in_founder_investor_list?: number;
  in_diverse_investor_list?: number;
  in_female_investor_list?: number;
  leads_rounds?: string;
  investment_count?: number;
  connection_count?: number;
  first_degree_count?: number;
  network_tier?: NetworkTier;
  data_quality_score?: number;
  data_tier?: DataTier;
}

/**
 * Enhanced Investor Profile with computed fields
 */
export interface InvestorProfile extends Investor {
  profile_completion: ProfileCompletion;
  contact_methods: ContactMethod[];
  investment_focus: InvestmentFocus;
  network_analysis: NetworkAnalysis;
}

/**
 * Profile completion metrics
 */
export interface ProfileCompletion {
  percentage: number;
  missing_fields: string[];
}

/**
 * Available contact methods
 */
export interface ContactMethod {
  type: 'linkedin' | 'twitter' | 'crunchbase' | 'email' | 'website';
  url: string;
  verified: boolean;
}

/**
 * Investment focus and preferences
 */
export interface InvestmentFocus {
  stages: InvestmentStage[];
  sectors: InvestmentSector[];
  investment_range: {
    min?: string;
    max?: string;
    target?: string;
  };
  leads_rounds?: string;
  check_size_estimate?: string;
}

/**
 * Network analysis data
 */
export interface NetworkAnalysis {
  tier: NetworkTier;
  connections: number;
  quality_score: number;
  influence_score: number;
  reachability: ReachabilityLevel;
}

// =====================================================
// FIRM DATA STRUCTURES
// =====================================================

/**
 * Investment Firm
 */
export interface Firm {
  id: number;
  name: string;
  current_fund_size?: string;
  description?: string;
  website_url?: string;
  founded_year?: number;
  headquarters?: string;
  total_funding?: string;
  stage_focus?: InvestmentStage[];
  sector_focus?: InvestmentSector[];
}

/**
 * Enhanced Firm with analytics
 */
export interface FirmDetails extends Firm {
  investor_count: number;
  avg_connections: number;
  total_investments: number;
  avg_quality_score: number;
  investors: Investor[];
  analytics: FirmAnalytics;
}

/**
 * Firm analytics data
 */
export interface FirmAnalytics {
  investor_count: number;
  avg_connections: number;
  total_investments: number;
  avg_quality_score: number;
  top_investor?: Investor;
  performance_metrics?: {
    exits?: number;
    success_rate?: number;
    portfolio_size?: number;
  };
}

// =====================================================
// NETWORK DATA STRUCTURES
// =====================================================

/**
 * Network statistics
 */
export interface NetworkStats {
  totalInvestors: number;
  totalPeople: number;
  totalFirms: number;
  withLinkedIn: number;
  withInvestments: number;
  claimedProfiles: number;
  highQuality: number;
  networkTiers: NetworkTierCount[];
  qualityTiers: QualityTierCount[];
  topFirms: TopFirm[];
  investmentFocus: InvestmentFocusStats;
  lastUpdated: string;
}

/**
 * Network tier distribution
 */
export interface NetworkTierCount {
  network_tier: NetworkTier;
  count: number;
}

/**
 * Quality tier distribution
 */
export interface QualityTierCount {
  quality_tier: DataTier;
  count: number;
}

/**
 * Top performing firms
 */
export interface TopFirm {
  firm_name: string;
  investor_count: number;
  avg_investments: number;
  avg_quality_score: number;
  super_connected_count: number;
  highly_connected_count: number;
}

/**
 * Investment focus statistics
 */
export interface InvestmentFocusStats {
  founder_focused: number;
  diversity_focused: number;
  female_focused: number;
  lead_investors: number;
}

// =====================================================
// NETWORK VISUALIZATION
// =====================================================

/**
 * Network graph node
 */
export interface NetworkNode {
  id: number;
  name: string;
  firm?: string;
  connections: number;
  investments: number;
  tier: NetworkTier;
  quality: number;
  size: number;
  color: string;
  hasLinkedIn: boolean;
  isFocus?: boolean;
}

/**
 * Network graph edge
 */
export interface NetworkEdge {
  source: number;
  target: number;
  type: 'firm_connection' | 'investment_connection' | 'co_investment';
  weight: number;
}

/**
 * Network graph data
 */
export interface NetworkGraph {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    minConnections: number;
    focusNode?: number;
  };
}

// =====================================================
// SEARCH DATA STRUCTURES
// =====================================================

/**
 * Search criteria for investors
 */
export interface InvestorSearchCriteria {
  firmName?: string;
  minConnections?: number;
  maxConnections?: number;
  hasLinkedIn?: boolean;
  hasInvestments?: boolean;
  networkTier?: NetworkTier;
  sector?: InvestmentSector;
  stage?: InvestmentStage;
  dataTier?: DataTier;
  minQualityScore?: number;
  sortBy?: 'connections' | 'investments' | 'quality' | 'name';
  sortOrder?: 'asc' | 'desc';
  isInFounderList?: boolean;
  isDiverseInvestor?: boolean;
  leadsRounds?: boolean;
  isClaimed?: boolean;
  limit?: number;
  page?: number;
}

/**
 * AI Search results
 */
export interface AISearchResult {
  query: string;
  results: (Investor & { relevanceScore: number })[];
  interpretation: SearchInterpretation;
  suggestions: string[];
}

/**
 * Search interpretation from AI
 */
export interface SearchInterpretation {
  sectors: InvestmentSector[];
  stages: InvestmentStage[];
  locations: string[];
  firmTypes: string[];
  requirements: string[];
  qualifiers: string[];
}

// =====================================================
// ENUM TYPES
// =====================================================

export type NetworkTier = 
  | 'Super Connected'
  | 'Highly Connected' 
  | 'Well Connected'
  | 'Connected'
  | 'Limited Network';

export type DataTier = 
  | 'Premium'
  | 'High Quality'
  | 'Good Quality'
  | 'Basic Quality';

export type ReachabilityLevel = 
  | 'very_high'
  | 'high'
  | 'medium'
  | 'low'
  | 'very_low';

export type InvestmentStage = 
  | 'pre_seed'
  | 'seed'
  | 'series_a'
  | 'series_b'
  | 'series_c'
  | 'growth'
  | 'late_stage'
  | 'unknown';

export type InvestmentSector = 
  | 'fintech'
  | 'saas'
  | 'healthcare'
  | 'consumer'
  | 'enterprise'
  | 'climate'
  | 'ai'
  | 'blockchain'
  | 'edtech'
  | 'proptech'
  | 'biotech'
  | 'mobility'
  | 'gaming'
  | 'social'
  | 'general';

// =====================================================
// API ENDPOINT RESPONSE TYPES
// =====================================================

/**
 * GET /health
 */
export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  database: {
    status: 'connected' | 'disconnected';
    totalInvestors: number;
    totalFirms: number;
    totalPeople: number;
  };
  features: {
    cors: 'enabled' | 'disabled';
    aiSearch: 'enabled' | 'disabled';
    networkGraph: 'enabled' | 'disabled';
    pagination: 'enabled' | 'disabled';
    errorHandling: 'enhanced' | 'basic';
  };
  endpoints: Record<string, Record<string, string>>;
}

/**
 * GET /api/investors/search
 */
export interface InvestorSearchResponse {
  investors: Investor[];
  pagination: PaginationMeta;
}

/**
 * GET /api/investors/:id
 */
export interface InvestorDetailResponse {
  investor: InvestorProfile;
}

/**
 * GET /api/firms
 */
export interface FirmsListResponse {
  firms: Firm[];
  pagination: PaginationMeta;
}

/**
 * GET /api/firms/:id
 */
export interface FirmDetailResponse {
  firm: FirmDetails;
}

/**
 * GET /api/network/stats
 */
export type NetworkStatsResponse = NetworkStats;

/**
 * GET /api/network/graph
 */
export interface NetworkGraphResponse {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    minConnections: number;
    focusNode?: number;
  };
}

/**
 * GET /api/search/ai
 */
export type AISearchResponse = AISearchResult;

// =====================================================
// ERROR CODES
// =====================================================

export const API_ERROR_CODES = {
  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  INVALID_REQUEST: 'INVALID_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Resource errors
  INVESTOR_NOT_FOUND: 'INVESTOR_NOT_FOUND',
  FIRM_NOT_FOUND: 'FIRM_NOT_FOUND',
  ENDPOINT_NOT_FOUND: 'ENDPOINT_NOT_FOUND',
  
  // Search errors
  INVALID_QUERY: 'INVALID_QUERY',
  SEARCH_ERROR: 'SEARCH_ERROR',
  AI_SEARCH_ERROR: 'AI_SEARCH_ERROR',
  
  // Data errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  FETCH_ERROR: 'FETCH_ERROR',
  NETWORK_GRAPH_ERROR: 'NETWORK_GRAPH_ERROR',
  
  // Validation errors
  INVALID_ID: 'INVALID_ID',
  MISSING_PARAMETER: 'MISSING_PARAMETER',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  
  // Authentication errors (for future use)
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED'
} as const;

export type ApiErrorCode = typeof API_ERROR_CODES[keyof typeof API_ERROR_CODES];

// =====================================================
// HTTP STATUS CODES
// =====================================================

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Utility type for creating paginated responses
 */
export type PaginatedResponse<T> = ApiResponse<{
  items: T[];
  pagination: PaginationMeta;
}>;

/**
 * Utility type for search responses
 */
export type SearchResponse<T> = ApiResponse<{
  results: T[];
  pagination: PaginationMeta;
  searchCriteria: any;
}>;