# Investor Database Browser - Server Guide

## Quick Start

### Easy Startup (Recommended)
```bash
./start_server.sh
```

### Manual Startup
```bash
node simple_server.js
```

## Server Information

- **Port**: 3010
- **Web Interface**: http://localhost:3010
- **Database**: investor_network_full.db (25.67MB)
- **Records**: 32,780 investors from 5,761 firms

## Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `/` | Web interface for browsing investors |
| `/health` | Server health and status |
| `/api/diagnostics` | Detailed diagnostic information |
| `/api/network/stats` | Database statistics |
| `/api/investors/search` | Search investors with filters |
| `/api/investors/match` | Match investors to profiles |

## API Examples

### Get Database Statistics
```bash
curl http://localhost:3010/api/network/stats
```

### Search Investors
```bash
# Search by firm
curl "http://localhost:3010/api/investors/search?firm=Sequoia&limit=5"

# Search by network tier
curl "http://localhost:3010/api/investors/search?networkTier=Super Connected&limit=10"

# Search with multiple filters
curl "http://localhost:3010/api/investors/search?hasLinkedIn=true&minConnections=1000&limit=20"
```

### Check Server Health
```bash
curl http://localhost:3010/health
```

## Troubleshooting

### Server Won't Start

1. **Check if port is in use**:
   ```bash
   ss -tlnp | grep 3010
   ```

2. **Check database file exists**:
   ```bash
   ls -la investor_network_full.db
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Check Node.js version**:
   ```bash
   node --version  # Should be v14+ 
   ```

### Web Interface Shows Blank Screen

1. **Check server is running**:
   ```bash
   curl http://localhost:3010/health
   ```

2. **Check web interface file**:
   ```bash
   ls -la web_interface.html
   ```

3. **View browser console** (F12) for JavaScript errors

4. **Check server logs**:
   ```bash
   tail -f server.log  # if running in background
   ```

### API Errors

1. **Database connection issues**:
   - Check `/api/diagnostics` for database status
   - Verify `investor_network_full.db` exists and is readable

2. **Query timeouts**:
   - Large queries may take time with 32K+ records
   - Use `limit` parameter to reduce result size

3. **CORS issues**:
   - Server allows localhost:3010 and 127.0.0.1:3010
   - Check browser network tab for CORS errors

## Server Features

### Enhanced Error Handling
- Global error catching for uncaught exceptions
- Detailed error logging with timestamps
- Graceful database connection handling
- API endpoint validation

### Diagnostic Capabilities
- Real-time server health monitoring
- Database connectivity status
- File existence verification
- Memory usage tracking
- Request/response logging

### Performance Optimizations
- Query result limits (max 100 per request)
- Database connection reuse
- Static file caching headers
- Efficient SQLite queries

## Log Files

### server.log (Background Mode)
Contains all server output including:
- Startup messages
- Request/response logs
- Error messages
- Database connection status

### Console Output (Foreground Mode)
Real-time logging with emoji indicators:
- 📥 Incoming requests
- 📤 Outgoing responses
- ✅ Success operations
- ❌ Error conditions
- 🔍 Search operations

## Development

### File Structure
```
├── simple_server.js          # Main server file
├── web_interface.html        # Frontend interface
├── network_analysis_full.js  # Database layer
├── investor_network_full.db  # SQLite database
├── start_server.sh          # Startup script
└── server.log               # Log file (background mode)
```

### Making Changes
1. Stop server (Ctrl+C or `kill <PID>`)
2. Edit files as needed
3. Restart server
4. Test changes at http://localhost:3010

### Database Schema
The system uses SQLite with optimized views for:
- Investor profiles with network metrics
- Firm aggregations and statistics
- Investment tracking and analysis
- Data quality scoring

For database schema details, see `database_schema.sql`.