import { useEffect, useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface Metrics {
  totalLoads: number;
  totalRevenue: number;
  averageRate: number;
  averageWeight: number;
  equipmentBreakdown: Record<string, number>;
  commodityBreakdown: Record<string, number>;
  topRoutes: Array<{
    route: string;
    rate: number;
    load_id: string;
  }>;
  activeDrivers?: number;
  totalDrivers?: number;
  timestamp: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

function App() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/metrics');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch metrics:', err);
      setError('Failed to load metrics. Retrying...');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();

    // Poll every 10 seconds
    const interval = setInterval(fetchMetrics, 10000);

    // Refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMetrics();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchMetrics]);

  if (!metrics && isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading metrics...</p>
      </div>
    );
  }

  if (!metrics && error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchMetrics}>Retry</button>
      </div>
    );
  }

  if (!metrics) return null;

  const equipmentData = Object.entries(metrics.equipmentBreakdown).map(([name, value]) => ({
    name,
    value,
  }));

  const commodityData = Object.entries(metrics.commodityBreakdown).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>🚛 Freight Logistics Dashboard</h1>
          <p className="subtitle">Real-time metrics and analytics</p>
        </div>
        <div className="header-info">
          <div className="status-indicator">
            <span className={`status-dot ${isLoading ? 'loading' : 'live'}`}></span>
            <span className="status-text">{isLoading ? 'Updating...' : 'LIVE'}</span>
          </div>
          <span className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <button className="refresh-btn" onClick={fetchMetrics} disabled={isLoading}>
            <span className={isLoading ? 'spinning' : ''}>↻</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Total Loads</h3>
          <p className="metric-value">{metrics.totalLoads}</p>
          <span className="metric-label">Active shipments</span>
        </div>
        <div className="metric-card">
          <h3>Total Revenue</h3>
          <p className="metric-value">${metrics.totalRevenue.toLocaleString()}</p>
          <span className="metric-label">Combined loadboard rates</span>
        </div>
        <div className="metric-card">
          <h3>Average Rate</h3>
          <p className="metric-value">${metrics.averageRate.toFixed(2)}</p>
          <span className="metric-label">Per load</span>
        </div>
        <div className="metric-card">
          <h3>Average Weight</h3>
          <p className="metric-value">{metrics.averageWeight.toLocaleString(undefined, { maximumFractionDigits: 0 })} lbs</p>
          <span className="metric-label">Per shipment</span>
        </div>
        {metrics.totalDrivers && (
          <div className="metric-card">
            <h3>Active Drivers</h3>
            <p className="metric-value">{metrics.activeDrivers} / {metrics.totalDrivers}</p>
            <span className="metric-label">Currently on duty</span>
          </div>
        )}
      </div>

      <div className="charts-grid">
        <div className="chart-card">
          <h3>Equipment Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={equipmentData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {equipmentData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Commodity Types</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={commodityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#0088FE" name="Loads" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="table-card">
        <h3>Top Routes by Revenue</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Load ID</th>
                <th>Route</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              {metrics.topRoutes.slice(0, 10).map((route) => (
                <tr key={route.load_id}>
                  <td className="load-id">{route.load_id}</td>
                  <td className="route">{route.route}</td>
                  <td className="rate">${route.rate.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;

