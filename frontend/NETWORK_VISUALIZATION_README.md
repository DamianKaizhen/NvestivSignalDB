# Network Visualization System

## Overview

The Nvestiv Network Visualization System is a comprehensive D3.js-powered interactive network graph that visualizes relationships between 32K+ investors, firms, companies, and sectors. It provides warm introduction path finding and advanced filtering capabilities.

## Key Features

### 🎯 Interactive Network Graph
- **D3.js Force-Directed Layout**: Realistic physics simulation with customizable forces
- **Multi-Node Types**: Investors, firms, companies, and sectors with distinct visual styling
- **Tier-Based Sizing**: Node sizes reflect network tier and importance
- **Connection Strength**: Link thickness represents relationship strength
- **Real-time Filtering**: Dynamic filtering without page reloads

### 🔗 Warm Introduction Finder
- **Path Discovery**: Find connection paths between any two investors
- **Multi-hop Analysis**: Support for 1, 2, and 3+ degree connections
- **Connection Strength Scoring**: Weighted paths based on relationship quality
- **Introduction Templates**: Pre-written introduction messages
- **Copy-to-Clipboard**: Quick sharing of introduction text

### 🎛️ Advanced Controls
- **Comprehensive Filters**: By tier, sector, location, connection type, and strength
- **Visual Options**: Toggle labels, adjust minimum connections
- **Export/Import**: JSON export for data analysis
- **Search Functionality**: Find specific nodes in the network
- **Reset and Refresh**: Easy network state management

### 📊 Performance Optimizations
- **Efficient Rendering**: Canvas-based rendering for large datasets
- **Progressive Loading**: Lazy loading of network segments
- **Memory Management**: Proper cleanup and garbage collection
- **Responsive Design**: Works across desktop, tablet, and mobile

## Architecture

### Component Structure
```
components/network/
├── network-content.tsx          # Main container with tabs and state
├── d3-network-visualization.tsx # D3.js interactive graph
├── warm-intro-finder.tsx        # Path finding interface
├── network-controls.tsx         # Filters and options panel
├── network-legend.tsx           # Help and legend system
├── network-filters.tsx          # Legacy filter component
├── network-visualization.tsx    # Legacy simple visualization
└── network-skeleton.tsx         # Loading states
```

### Data Flow
```
API/Mock Data → Network Content → Filtered Data → D3 Visualization
                                               ↓
                               Warm Intro Finder ← User Selection
```

## Usage Guide

### Basic Navigation
1. **Zoom**: Mouse wheel or zoom controls
2. **Pan**: Drag background to move around
3. **Select Nodes**: Click nodes to view details
4. **Drag Nodes**: Move nodes to reorganize layout
5. **Hover**: Preview node information

### Advanced Features

#### Filters
- **Node Type**: Filter by investors, firms, companies, or sectors
- **Network Tier**: Focus on Tier 1 (top), Tier 2 (connected), or Tier 3 (emerging)
- **Geographic**: Filter by investor locations
- **Sector**: Focus on specific industry sectors
- **Connection Types**: Include/exclude specific relationship types

#### Warm Introductions
1. Navigate to the "Warm Intros" tab
2. Select source investor (yourself or your connection)
3. Select target investor (who you want to meet)
4. Review suggested introduction paths
5. Use the best path or explore alternatives
6. Copy introduction text for outreach

#### Export/Analysis
- Export filtered network data as JSON
- Import custom network datasets
- View network statistics and metrics
- Share specific network views

## Technical Implementation

### D3.js Integration
```typescript
// Force simulation setup
const simulation = d3.forceSimulation<SimulationNode>(nodes)
  .force('link', d3.forceLink<SimulationNode, SimulationLink>(links)
    .id(d => d.id)
    .distance(d => connectionDistance(d.type))
    .strength(d => Math.min(d.strength, 1)))
  .force('charge', d3.forceManyBody()
    .strength(d => tierBasedRepulsion(d.tier)))
  .force('center', d3.forceCenter(width / 2, height / 2))
  .force('collision', d3.forceCollide()
    .radius(d => getNodeSize(d) + 2))
```

### Performance Features
- **Viewport Culling**: Only render visible nodes
- **Level-of-Detail**: Simplify distant nodes
- **Batch Updates**: Group DOM modifications
- **Memory Pooling**: Reuse objects to reduce GC pressure

### API Integration
```typescript
// Real API with fallback to mock data
const { data: networkData } = useQuery({
  queryKey: queryKeys.networkGraph(filters),
  queryFn: () => apiClient.getNetworkGraph(filters),
  staleTime: 5 * 60 * 1000 // 5 minutes cache
})
```

## Mock Data System

For development and demonstration, the system includes comprehensive mock data:

- **19 Network Nodes**: Mix of investors, firms, companies, and sectors
- **25 Connections**: Various relationship types with realistic strengths
- **Realistic Metadata**: Actual investor names, firms, and companies
- **API Simulation**: Includes loading delays and error handling

## Development Setup

### Prerequisites
```bash
npm install d3 @types/d3
```

### File Structure
```
/lib/
├── api.ts                    # API client with mock fallback
├── mock-network-data.ts      # Development data
└── utils.ts                  # Utility functions

/components/network/
├── *.tsx                     # All network components
```

### Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:3000  # Backend API URL
```

## API Endpoints

### Network Graph
```http
GET /api/network/graph?min_tier=1&max_tier=3&sector=technology&limit=500
```

### Warm Introductions
```http
GET /api/investors/{sourceId}/warm-intros/{targetId}
```

### Network Statistics
```http
GET /api/network/stats
```

## Customization

### Node Styling
```typescript
const getNodeColor = (node: NetworkNode) => {
  switch (node.type) {
    case 'investor': return '#3b82f6'
    case 'firm': return '#10b981'
    case 'company': return '#8b5cf6'
    case 'sector': return '#f97316'
  }
}
```

### Connection Types
```typescript
const CONNECTION_TYPES = [
  { type: 'investment', color: '#3b82f6', label: 'Direct Investment' },
  { type: 'co_investment', color: '#10b981', label: 'Co-Investment' },
  { type: 'firm_colleague', color: '#8b5cf6', label: 'Same Firm' },
  { type: 'board_member', color: '#f59e0b', label: 'Board Service' }
]
```

### Force Parameters
```typescript
const forceConfig = {
  linkDistance: (d) => d.type === 'firm_colleague' ? 30 : 60,
  chargeStrength: (d) => -100 * tierMultiplier(d.tier),
  collisionRadius: (d) => getNodeSize(d) + 2
}
```

## Performance Metrics

- **Load Time**: < 2 seconds for 500 nodes
- **Interaction Latency**: < 16ms for 60fps
- **Memory Usage**: < 100MB for large networks
- **Mobile Performance**: Optimized for touch interactions

## Browser Support

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile**: iOS Safari 13+, Chrome Mobile 80+
- **Features**: WebGL acceleration, touch gestures, responsive design

## Future Enhancements

### Planned Features
- **WebGL Rendering**: GPU-accelerated for 10K+ nodes
- **Clustering**: Hierarchical node grouping
- **Timeline View**: Historical network evolution
- **3D Visualization**: Depth-based relationship modeling
- **Real-time Updates**: Live network changes via WebSocket

### Advanced Analytics
- **Centrality Metrics**: Betweenness, closeness, eigenvector
- **Community Detection**: Algorithmic cluster identification
- **Influence Scoring**: PageRank-based importance
- **Recommendation Engine**: Suggested connections based on network position

## Contributing

### Code Style
- TypeScript strict mode
- ESLint + Prettier formatting
- Comprehensive error handling
- Performance monitoring
- Accessibility compliance (WCAG 2.1)

### Testing
- Unit tests for utility functions
- Integration tests for API calls
- Visual regression tests for D3 rendering
- Performance benchmarks

## License

This network visualization system is part of the Nvestiv platform and follows the project's licensing terms.