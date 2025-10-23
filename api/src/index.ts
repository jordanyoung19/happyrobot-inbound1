import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Serve static dashboard files at /dashboard
const dashboardPath = path.join(__dirname, '../../metrics/dist');
app.use('/dashboard', express.static(dashboardPath, { index: 'index.html' }));

// API routes
app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the Simple API" });
});

app.get("/api/data", (_req, res) => {
  const dataPath = path.join("/data", "testData.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  const data = JSON.parse(raw);
  res.json(data);
});

// Keep legacy /data endpoint for backwards compatibility
app.get("/data", (_req, res) => {
  const dataPath = path.join("/data", "testData.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  const data = JSON.parse(raw);
  res.json(data);
});

// Metrics endpoint
app.get("/api/metrics", (_req, res) => {
  try {
    // Read all data files
    const loadsPath = path.join("/data", "testData.json");
    const driversPath = path.join("/data", "drivers.json");
    
    const loadsRaw = fs.readFileSync(loadsPath, "utf-8");
    const loads = JSON.parse(loadsRaw);
    
    let drivers = [];
    if (fs.existsSync(driversPath)) {
      const driversRaw = fs.readFileSync(driversPath, "utf-8");
      drivers = JSON.parse(driversRaw);
    }
    
    // Calculate metrics
    const totalLoads = loads.length;
    const totalRevenue = loads.reduce((sum: number, load: any) => sum + load.loadboard_rate, 0);
    const averageRate = totalRevenue / totalLoads;
    const averageWeight = loads.reduce((sum: number, load: any) => sum + load.weight, 0) / totalLoads;
    
    // Equipment breakdown
    const equipmentBreakdown = loads.reduce((acc: Record<string, number>, load: any) => {
      acc[load.equipment_type] = (acc[load.equipment_type] || 0) + 1;
      return acc;
    }, {});
    
    // Commodity breakdown
    const commodityBreakdown = loads.reduce((acc: Record<string, number>, load: any) => {
      acc[load.commodity_type] = (acc[load.commodity_type] || 0) + 1;
      return acc;
    }, {});
    
    // Top routes by revenue
    const topRoutes = loads
      .map((load: any) => ({
        route: `${load.origin} → ${load.destination}`,
        rate: load.loadboard_rate,
        load_id: load.load_id
      }))
      .sort((a: any, b: any) => b.rate - a.rate);
    
    // Driver metrics
    const activeDrivers = drivers.filter((d: any) => d.status === 'active').length;
    const totalDrivers = drivers.length;
    
    const metrics = {
      totalLoads,
      totalRevenue,
      averageRate,
      averageWeight,
      equipmentBreakdown,
      commodityBreakdown,
      topRoutes,
      activeDrivers,
      totalDrivers,
      timestamp: new Date().toISOString()
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Error calculating metrics:', error);
    res.status(500).json({ error: 'Failed to calculate metrics' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Dashboard available at http://0.0.0.0:${PORT}/dashboard`);
});