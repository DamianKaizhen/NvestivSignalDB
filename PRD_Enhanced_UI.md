# Product Requirements Document: Enhanced Investor Network UI

## 1. Executive Summary

### Product Vision
Transform the existing investor database API into a comprehensive, modern web application that enables users to explore and leverage the full network intelligence of 32,780 investor profiles through an intuitive, relationship-focused interface.

### Key Objectives
1. **Visual Network Exploration**: Enable users to discover connections between investors, firms, and portfolio companies
2. **Comprehensive Profiles**: Provide detailed views of all entities with their relationships and history
3. **Advanced Search & Discovery**: Multi-dimensional filtering and saved search capabilities
4. **Actionable Intelligence**: Surface warm introduction paths and co-investment opportunities
5. **Professional Design**: Implement custom ShadCN theme with modern, responsive interface

## 2. User Experience Requirements

### 2.1 Design System
- **Framework**: Next.js 14+ with App Router
- **Component Library**: ShadCN UI (v4)
- **Styling**: Tailwind CSS with custom OKLCH color system
- **Typography**: Poppins (sans), Libre Baskerville (serif), IBM Plex Mono (mono)
- **Theme**: Support light/dark modes with provided color tokens

### 2.2 Navigation Structure

```
┌─────────────────────────────────────────┐
│  Nvestiv Logo    Search Bar    Profile  │
├─────────────────────────────────────────┤
│ Dashboard │ Investors │ Firms │ Network │
├─────────────────────────────────────────┤
│                                         │
│          Main Content Area              │
│                                         │
└─────────────────────────────────────────┘
```

### 2.3 Core Pages & Views

#### Dashboard (Home)
- **Overview Stats**: Total investors, firms, active investors, network coverage
- **Recent Activity**: Latest viewed profiles, saved searches
- **Quick Actions**: Search investors, explore firms, find connections
- **Top Investors**: Super-connected tier showcase
- **Market Intelligence**: Key insights and trends

#### Investors Hub
- **List View**: Paginated table with 50 investors per page
- **Grid View**: Card-based layout with key metrics
- **Filters**: 
  - Investment stage (seed, series A, etc.)
  - Network tier (super connected, highly connected, etc.)
  - Location/Geography
  - Firm affiliation
  - LinkedIn presence
  - Investment history
- **Sorting**: By connections, recent activity, name, firm
- **Bulk Actions**: Export, save to list, compare

#### Individual Investor Profile
- **Header Section**:
  - Profile photo placeholder
  - Name, position, firm
  - LinkedIn link
  - Network tier badge
  - Quality score indicator
- **Overview Tab**:
  - Professional headline
  - Investment preferences (min/max check size)
  - Network metrics (1st degree connections)
  - Recent investments
- **Connections Tab**:
  - Direct connections list
  - Mutual connections with other investors
  - Connection strength indicators
  - Path to investor (warm intro finder)
- **Investment History Tab**:
  - Portfolio companies
  - Investment rounds participated
  - Co-investors for each deal
  - Board positions
- **Network Graph Tab**:
  - Interactive visualization of connections
  - Filterable by relationship type
  - Clickable nodes to navigate

#### Firms/Companies Hub
- **Firm List**: All 5,761 investment firms
- **Firm Profile Page**:
  - Firm overview and stats
  - All investors at firm (paginated)
  - Investment focus areas
  - Portfolio companies
  - Co-investment patterns
  - Network influence score

#### Network Explorer
- **Warm Introduction Finder**:
  - Source/target investor selection
  - Path visualization
  - Introduction request builder
- **Co-Investment Discovery**:
  - Find investors who invest together
  - Syndicate pattern analysis
  - Opportunity matching
- **Relationship Browser**:
  - Multi-hop exploration
  - Filter by connection type
  - Export network data

### 2.4 Search & Discovery

#### Global Search
- **Omnisearch Bar**: Search across investors, firms, companies
- **Auto-suggestions**: As-you-type results
- **Search Filters**: Quick filter chips below search
- **Recent Searches**: Dropdown with history

#### Advanced Search
- **Multi-field Search Form**:
  - Investor name/firm
  - Investment stage preferences
  - Geographic focus
  - Network metrics (min connections)
  - Investment history criteria
- **Saved Searches**: Name and save complex queries
- **Search Alerts**: Notify when new matches found

### 2.5 Data Visualization

#### Charts & Metrics
- **Network Distribution**: Donut chart of network tiers
- **Investment Activity**: Timeline charts
- **Geographic Distribution**: Map visualization
- **Firm Rankings**: Bar charts of top firms
- **Connection Density**: Heat maps

#### Interactive Elements
- **Tooltips**: Hover for additional context
- **Drill-downs**: Click to explore deeper
- **Filters**: Update visualizations in real-time
- **Export**: Download chart data/images

## 3. Technical Architecture

### 3.1 Frontend Stack
```
Next.js 14+ (App Router)
├── React 18+
├── TypeScript
├── ShadCN UI Components
├── Tailwind CSS
├── TanStack Query (data fetching)
├── Zustand (state management)
└── Recharts (data visualization)
```

### 3.2 Project Structure
```
/app
  /dashboard          - Main dashboard
  /investors          - Investor listing
  /investors/[id]     - Individual profiles
  /firms              - Firm listing
  /firms/[id]         - Firm profiles
  /network            - Network explorer
  /search             - Advanced search
/components
  /ui                 - ShadCN components
  /investors          - Investor-specific
  /firms              - Firm-specific
  /network            - Network visualizations
  /common             - Shared components
/lib
  /api                - API client functions
  /hooks              - Custom React hooks
  /utils              - Helper functions
  /types              - TypeScript definitions
```

### 3.3 API Integration
- **Base URL**: http://localhost:3010/api
- **Data Fetching**: TanStack Query with caching
- **Error Handling**: Toast notifications
- **Loading States**: Skeleton components
- **Pagination**: Cursor-based with infinite scroll option

### 3.4 State Management
```typescript
// Global state structure
interface AppState {
  user: UserProfile | null;
  savedSearches: SavedSearch[];
  recentlyViewed: RecentItem[];
  filters: GlobalFilters;
  theme: 'light' | 'dark';
}
```

## 4. Component Specifications

### 4.1 Key ShadCN Components to Use
- **Navigation**: NavigationMenu, Tabs
- **Data Display**: Table, Card, Badge, Avatar
- **Forms**: Input, Select, Checkbox, RadioGroup
- **Feedback**: Toast, Alert, Progress
- **Overlays**: Dialog, Sheet, Popover
- **Layout**: Separator, ScrollArea

### 4.2 Custom Components Needed
- **InvestorCard**: Compact investor preview
- **NetworkGraph**: D3.js-based visualization
- **ConnectionPath**: Visual path display
- **InvestmentTimeline**: Chronological view
- **MetricCard**: Stats with trend indicators
- **SearchFilters**: Advanced filter UI
- **PaginationControls**: Table pagination

## 5. Performance Requirements

### 5.1 Loading Performance
- **Initial Load**: < 3s for dashboard
- **Page Navigation**: < 1s with loading states
- **Search Results**: < 500ms response time
- **Infinite Scroll**: Smooth with virtualization

### 5.2 Data Optimization
- **Pagination**: 50 items per page default
- **Lazy Loading**: Images and heavy components
- **Caching**: 5-minute cache for list data
- **Prefetching**: Next page data

## 6. Responsive Design

### 6.1 Breakpoints
- **Mobile**: 320px - 768px
- **Tablet**: 768px - 1024px
- **Desktop**: 1024px+

### 6.2 Mobile Adaptations
- **Navigation**: Hamburger menu
- **Tables**: Horizontal scroll or card view
- **Filters**: Bottom sheet on mobile
- **Search**: Full-screen overlay

## 7. Implementation Phases

### Phase 1: Foundation (Week 1)
1. Next.js project setup with TypeScript
2. ShadCN UI installation and theme configuration
3. Basic routing and layout components
4. API client setup with TanStack Query

### Phase 2: Core Views (Week 2)
1. Dashboard with statistics
2. Investor list with pagination
3. Basic investor profile page
4. Global search functionality

### Phase 3: Advanced Features (Week 3)
1. Network explorer and visualizations
2. Firm pages and relationships
3. Advanced search with filters
4. Connection path finding

### Phase 4: Polish & Optimization (Week 4)
1. Performance optimization
2. Mobile responsive adjustments
3. Error handling and edge cases
4. User testing and refinements

## 8. Success Metrics

### 8.1 User Engagement
- **Page Views**: Track most visited sections
- **Search Usage**: Queries per session
- **Connection Discoveries**: Paths found
- **Time on Site**: Average session duration

### 8.2 Performance Metrics
- **Core Web Vitals**: LCP < 2.5s, FID < 100ms
- **API Response**: 95th percentile < 1s
- **Error Rate**: < 1% of requests
- **Uptime**: 99.9% availability

## 9. Future Enhancements

### 9.1 V2 Features
- **Real-time Updates**: WebSocket integration
- **Collaboration**: Share and annotate profiles
- **Export Tools**: PDF reports, Excel exports
- **AI Insights**: Automated recommendations
- **Mobile App**: React Native companion

### 9.2 Integrations
- **CRM Sync**: Salesforce, HubSpot
- **Calendar**: Meeting scheduling
- **Email**: Outreach campaigns
- **Analytics**: Google Analytics, Mixpanel

## 10. Accessibility Requirements

### 10.1 Standards
- **WCAG 2.1 AA** compliance
- **Keyboard Navigation**: Full support
- **Screen Readers**: ARIA labels
- **Color Contrast**: Minimum 4.5:1
- **Focus Indicators**: Visible focus states

### 10.2 Internationalization
- **Language**: English (initial)
- **Date/Time**: Localized formats
- **Currency**: Multi-currency support
- **RTL**: Prepared for future support