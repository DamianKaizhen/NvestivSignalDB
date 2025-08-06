# Nvestiv Frontend

A comprehensive React/Next.js frontend for the investor network database, featuring a professional, data-rich interface that allows users to explore 32,780+ investor profiles and their relationships.

## Features

### 🏠 Dashboard
- Network overview with key statistics
- Interactive charts showing investment trends
- Top sectors and locations visualization
- Investment timeline analysis

### 👥 Investors
- Comprehensive investor listing with pagination (50 per page)
- Advanced search and filtering
- Individual investor profile pages with detailed information
- Investment focus, portfolio companies, and network connections

### 🏢 Firms
- Investment firms and companies listing
- Aggregated firm statistics and investor counts
- Sector and location distribution

### 🔍 AI-Powered Search
- Natural language search queries
- AI matching for finding relevant investors
- Example search queries for guidance
- Detailed match results with explanations

### 🌐 Network Explorer
- Interactive network visualization
- Relationship mapping between investors, companies, and sectors
- Filterable network views
- Node selection and detailed connection information

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom OKLCH color theme
- **UI Components**: ShadCN UI (Radix UI primitives)
- **State Management**: TanStack Query for server state
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Font**: Inter with custom font variables

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- The backend API server running at `http://localhost:3010`

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd /home/damian/ExperimentationKaizhen/Nvestiv/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables

Create a `.env.local` file if you need to customize the API URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3010
```

## Project Structure

```
frontend/
├── app/                          # Next.js App Router pages
│   ├── investors/               # Investor listing and profiles
│   ├── firms/                   # Firms listing
│   ├── search/                  # AI-powered search
│   ├── network/                 # Network visualization
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Dashboard page
├── components/                   # React components
│   ├── ui/                      # ShadCN UI components
│   ├── layout/                  # Layout components
│   ├── dashboard/               # Dashboard-specific components
│   ├── investors/               # Investor-related components
│   ├── firms/                   # Firm-related components
│   ├── search/                  # Search components
│   ├── network/                 # Network visualization components
│   └── providers/               # React context providers
├── lib/                         # Utility functions and API client
│   ├── api.ts                   # API client and types
│   └── utils.ts                 # Utility functions
├── hooks/                       # Custom React hooks
└── styles/                      # Global styles and theme
```

## API Integration

The frontend integrates with the backend API through a centralized API client (`lib/api.ts`) that handles:

- Network statistics (`/api/network/stats`)
- Investor search with filters (`/api/investors/search`)
- Individual investor details (`/api/investors/:id`)
- AI-powered investor matching (`/api/investors/match`)

## Key Features Implementation

### Advanced Filtering
- Debounced search queries
- Multi-criteria filtering (location, sector, investment stage, check size, etc.)
- Real-time filter updates

### Responsive Design
- Mobile-first approach
- Responsive grid layouts
- Collapsible sidebar navigation
- Touch-friendly interactions

### Performance Optimizations
- React Query for caching and background updates
- Skeleton loading states
- Optimistic updates
- Image optimization with Next.js

### Accessibility
- WCAG 2.1 compliant components
- Keyboard navigation support
- Screen reader compatibility
- High contrast support

## Theme Customization

The app uses a custom OKLCH color theme defined in `globals.css`. Key colors include:

- **Primary**: Investment-focused blue-green
- **Secondary**: Complementary accent colors
- **Charts**: 5-color palette for data visualization
- **Dark/Light**: Full theme switching support

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Browser Support

- Chrome/Edge 88+
- Firefox 87+
- Safari 14+
- Mobile browsers with ES2020 support

## Contributing

1. Follow the existing code style and TypeScript patterns
2. Use ShadCN UI components when possible
3. Ensure responsive design on all screen sizes
4. Add proper loading and error states
5. Include accessibility considerations

## Deployment

The app can be deployed to any platform that supports Next.js:

- **Vercel** (recommended)
- **Netlify**
- **AWS Amplify**
- **Self-hosted** with PM2 or Docker

Make sure to set the `NEXT_PUBLIC_API_URL` environment variable to point to your production API server.