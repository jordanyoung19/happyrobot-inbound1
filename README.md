# HappyRobot Inbound

Freight logistics management system with real-time metrics dashboard.

## Features

- **REST API**: Express-based API serving freight load data
- **Metrics Dashboard**: Real-time analytics dashboard with live updates
- **Docker Support**: Containerized deployment ready for Railway
- **Data Management**: JSON-based data storage for loads, drivers, and routes

## Project Structure

```
.
├── api/                    # Express API server
│   ├── src/
│   │   └── index.ts       # Main API with metrics endpoint
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

- `GET /` - API welcome message
- `GET /api/data` - Get all freight loads
- `GET /api/metrics` - Get calculated metrics (loads, revenue, breakdowns, etc.)
- `GET /dashboard` - Metrics dashboard UI

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

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Frontend**: React, TypeScript, Vite, Recharts
- **Deployment**: Docker, Railway
- **Data**: JSON files
