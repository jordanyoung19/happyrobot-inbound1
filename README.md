# HappyRobot Inbound

Freight logistics management system with real-time metrics dashboard.

## Features

- **REST API**: Express-based API serving freight load data
- **SQLite Database**: Persistent storage for calls and deals with full CRUD operations
- **Metrics Dashboard**: Real-time analytics dashboard with live updates and database integration
- **Docker Support**: Containerized deployment ready for Railway
- **Data Management**: JSON-based data storage for loads, drivers, and routes

## Project Structure

```
.
├── api/                    # Express API server
│   ├── src/
│   │   └── index.ts       # Main API with metrics and CRUD endpoints
│   ├── database/          # SQLite database
│   │   ├── schema.sql    # Database schema definitions
│   │   ├── init.ts       # Database initialization module
│   │   └── happyrobot.db # SQLite database file (auto-generated)
│   └── package.json
├── metrics/               # React metrics dashboard
│   ├── src/
│   │   ├── App.tsx       # Main dashboard component
│   │   └── App.css       # Dashboard styling
│   └── package.json
├── data/                  # JSON data files
│   ├── testData.json     # Freight loads data
│   ├── drivers.json      # Driver information
│   └── routes.json       # Route statistics
└── Dockerfile            # Production build configuration
```

## API Endpoints

### General
- `GET /` - API welcome message
- `GET /api/data` - Get all freight loads
- `GET /api/metrics` - Get calculated metrics (loads, revenue, breakdowns, etc.)
- `GET /dashboard` - Metrics dashboard UI

### Calls (Database)
- `POST /api/calls` - Create a new call
  - Body: `{ sentiment, dba, datetime, outcome }`
- `GET /api/calls` - Get all calls
- `GET /api/calls/:id` - Get single call by ID
- `PUT /api/calls/:id` - Update a call
- `DELETE /api/calls/:id` - Delete a call

### Deals (Database)
- `POST /api/deals` - Create a new deal
  - Body: `{ load_id, start_location, end_location, call_id?, initial_price?, agreed_price? }`
- `GET /api/deals` - Get all deals (with call information via JOIN)
- `GET /api/deals/:id` - Get single deal by ID
- `PUT /api/deals/:id` - Update a deal
- `DELETE /api/deals/:id` - Delete a deal

## Local Development

### API Only
```bash
cd api
npm install
npm run dev
```

### Metrics Dashboard Only
```bash
cd metrics
npm install
npm run dev
```

### Full Stack with Docker
```bash
docker build -t happyrobot-inbound .
docker run -p 3000:3000 happyrobot-inbound
```

Then visit:
- API: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard

### Testing the Database

Create a call:
```bash
curl -X POST http://localhost:3000/api/calls \
  -H "Content-Type: application/json" \
  -d '{
    "sentiment": "positive",
    "dba": "ABC Trucking Co",
    "datetime": "2025-10-24T10:30:00Z",
    "outcome": "deal_closed"
  }'
```

Create a deal:
```bash
curl -X POST http://localhost:3000/api/deals \
  -H "Content-Type: application/json" \
  -d '{
    "load_id": "LD-2025-001",
    "start_location": "Los Angeles, CA",
    "end_location": "Phoenix, AZ",
    "call_id": 1,
    "initial_price": 1500,
    "agreed_price": 1250
  }'
```

View all deals:
```bash
curl http://localhost:3000/api/deals
```

The dashboard at `/dashboard` will automatically display the deals from the database.

## Railway Deployment

The application is configured for Railway deployment using the root `Dockerfile`:

1. Push to GitHub
2. Railway automatically builds the Docker image
3. Metrics dashboard is built during Docker build
4. Express API serves both API endpoints and the dashboard

**Live URLs:**
- API: `https://your-app.railway.app/api/metrics`
- Dashboard: `https://your-app.railway.app/dashboard`

## Dashboard Features

- **Auto-refresh**: Updates every 10 seconds
- **Key Metrics**: Total loads, revenue, average rates, weights
- **Visual Charts**: Equipment types (pie chart), commodity breakdown (bar chart)
- **Top Routes**: Revenue-sorted route performance table
- **Driver Status**: Active vs total drivers
- **Responsive Design**: Works on desktop and mobile

## Database Schema

### Calls Table
- `id` - INTEGER PRIMARY KEY (auto-increment)
- `sentiment` - TEXT (e.g., "positive", "negative", "neutral")
- `dba` - TEXT (company/doing business as name)
- `datetime` - TEXT (ISO 8601 format)
- `outcome` - TEXT (call outcome description)
- `created_at` - TEXT (timestamp, auto-generated)

### Deals Table
- `id` - INTEGER PRIMARY KEY (auto-increment)
- `load_id` - TEXT (references load_id from testData.json)
- `start_location` - TEXT
- `end_location` - TEXT
- `call_id` - INTEGER (foreign key to Calls.id, nullable)
- `initial_price` - INTEGER (nullable)
- `agreed_price` - INTEGER (nullable)
- `created_at` - TEXT (timestamp, auto-generated)

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, TypeScript, Vite, Recharts
- **Database**: SQLite with better-sqlite3
- **Deployment**: Docker, Railway
- **Data**: JSON files + SQLite database
