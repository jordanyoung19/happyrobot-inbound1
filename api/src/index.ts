import 'dotenv/config';
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { getDatabase } from "../database/init.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware to parse JSON bodies
app.use(express.json());

// Initialize database
const db = getDatabase();

// ============================================
// API KEY AUTHENTICATION MIDDLEWARE
// ============================================
function requireApiKey(req: express.Request, res: express.Response, next: express.NextFunction) {
  // Skip auth for public paths
  if (req.path === '/' || 
      req.path.startsWith('/dashboard') ||
      req.path === '/api/metrics') {
    return next();
  }

  // Allow public GET access to deals, calls, and data (read-only for dashboard)
  if ((req.path === '/api/deals' || req.path === '/api/calls' || req.path === '/api/data' ||
       req.path.startsWith('/api/deals/') || req.path.startsWith('/api/calls/')) && 
      req.method === 'GET') {
    return next();
  }

  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.API_KEY || 'dev-key-12345';
  
  if (apiKey !== validKey) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' });
  }
  
  next();
}

// Apply to all routes
app.use(requireApiKey);

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
    const totalMiles = loads.reduce((sum: number, load: any) => sum + load.miles, 0);
    const averageMiles = totalMiles / totalLoads;
    
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
      totalMiles,
      averageMiles,
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

// ============================================
// CALLS CRUD ENDPOINTS
// ============================================

// Create a new call
app.post("/api/calls", (req, res) => {
  try {
    const { sentiment, dba, datetime, outcome, call_outcome, load_id, start_location, end_location, initial_price, agreed_price } = req.body;
    
    if (!sentiment || !dba || !datetime || !outcome) {
      return res.status(400).json({ error: 'Missing required fields: sentiment, dba, datetime, outcome' });
    }
    
    // Insert the call record
    const callStmt = db.prepare('INSERT INTO calls (sentiment, dba, datetime, outcome, call_outcome) VALUES (?, ?, ?, ?, ?)');
    const callResult = callStmt.run(sentiment, dba, datetime, outcome, call_outcome || null);
    const callId = callResult.lastInsertRowid;
    
    const callData = {
      id: callId,
      sentiment,
      dba,
      datetime,
      outcome,
      call_outcome: call_outcome || null
    };
    
    // If outcome is "yes", create a deal record
    if (outcome === "yes") {
      // Validate deal fields are provided
      if (!load_id || !start_location || !end_location) {
        return res.status(400).json({ 
          error: 'When outcome is "yes", deal fields are required: load_id, start_location, end_location',
          call: callData
        });
      }
      
      // Insert the deal record with reference to the call
      const dealStmt = db.prepare(
        'INSERT INTO deals (load_id, start_location, end_location, call_id, initial_price, agreed_price) VALUES (?, ?, ?, ?, ?, ?)'
      );
      const dealResult = dealStmt.run(load_id, start_location, end_location, callId, initial_price || null, agreed_price || null);
      
      const dealData = {
        id: dealResult.lastInsertRowid,
        load_id,
        start_location,
        end_location,
        call_id: callId,
        initial_price: initial_price || null,
        agreed_price: agreed_price || null
      };
      
      // Return both call and deal data
      return res.status(201).json({ 
        call: callData,
        deal: dealData
      });
    }
    
    // If outcome is not "yes", return only call data
    res.status(201).json({ 
      call: callData
    });
  } catch (error) {
    console.error('Error creating call:', error);
    res.status(500).json({ error: 'Failed to create call' });
  }
});

// Get all calls
app.get("/api/calls", (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM calls ORDER BY datetime DESC');
    const calls = stmt.all();
    res.json(calls);
  } catch (error) {
    console.error('Error fetching calls:', error);
    res.status(500).json({ error: 'Failed to fetch calls' });
  }
});

// Get single call by id
app.get("/api/calls/:id", (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare('SELECT * FROM calls WHERE id = ?');
    const call = stmt.get(id);
    
    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    res.json(call);
  } catch (error) {
    console.error('Error fetching call:', error);
    res.status(500).json({ error: 'Failed to fetch call' });
  }
});

// Update a call
app.put("/api/calls/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { sentiment, dba, datetime, outcome, call_outcome } = req.body;
    
    // Check if call exists
    const checkStmt = db.prepare('SELECT id FROM calls WHERE id = ?');
    const exists = checkStmt.get(id);
    
    if (!exists) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    const stmt = db.prepare('UPDATE calls SET sentiment = ?, dba = ?, datetime = ?, outcome = ?, call_outcome = ? WHERE id = ?');
    stmt.run(sentiment, dba, datetime, outcome, call_outcome || null, id);
    
    res.json({ 
      id: parseInt(id),
      sentiment,
      dba,
      datetime,
      outcome,
      call_outcome: call_outcome || null
    });
  } catch (error) {
    console.error('Error updating call:', error);
    res.status(500).json({ error: 'Failed to update call' });
  }
});

// Delete a call
app.delete("/api/calls/:id", (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if call exists
    const checkStmt = db.prepare('SELECT id FROM calls WHERE id = ?');
    const exists = checkStmt.get(id);
    
    if (!exists) {
      return res.status(404).json({ error: 'Call not found' });
    }
    
    const stmt = db.prepare('DELETE FROM calls WHERE id = ?');
    stmt.run(id);
    
    res.json({ message: 'Call deleted successfully' });
  } catch (error) {
    console.error('Error deleting call:', error);
    res.status(500).json({ error: 'Failed to delete call' });
  }
});

// ============================================
// DEALS CRUD ENDPOINTS
// ============================================

// Create a new deal
app.post("/api/deals", (req, res) => {
  try {
    const { load_id, start_location, end_location, call_id, initial_price, agreed_price } = req.body;
    
    if (!load_id || !start_location || !end_location) {
      return res.status(400).json({ error: 'Missing required fields: load_id, start_location, end_location' });
    }
    
    // Verify call_id exists if provided
    if (call_id) {
      const checkStmt = db.prepare('SELECT id FROM calls WHERE id = ?');
      const callExists = checkStmt.get(call_id);
      if (!callExists) {
        return res.status(400).json({ error: 'Referenced call_id does not exist' });
      }
    }
    
    const stmt = db.prepare(
      'INSERT INTO deals (load_id, start_location, end_location, call_id, initial_price, agreed_price) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(load_id, start_location, end_location, call_id || null, initial_price || null, agreed_price || null);
    
    res.status(201).json({ 
      id: result.lastInsertRowid,
      load_id,
      start_location,
      end_location,
      call_id: call_id || null,
      initial_price: initial_price || null,
      agreed_price: agreed_price || null
    });
  } catch (error) {
    console.error('Error creating deal:', error);
    res.status(500).json({ error: 'Failed to create deal' });
  }
});

// Get all deals (with optional JOIN to calls)
app.get("/api/deals", (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        deals.*,
        calls.sentiment as call_sentiment,
        calls.dba as call_dba,
        calls.outcome as call_outcome
      FROM deals
      LEFT JOIN calls ON deals.call_id = calls.id
      ORDER BY deals.created_at DESC
    `);
    const deals = stmt.all();
    res.json(deals);
  } catch (error) {
    console.error('Error fetching deals:', error);
    res.status(500).json({ error: 'Failed to fetch deals' });
  }
});

// Get single deal by id
app.get("/api/deals/:id", (req, res) => {
  try {
    const { id } = req.params;
    const stmt = db.prepare(`
      SELECT 
        deals.*,
        calls.sentiment as call_sentiment,
        calls.dba as call_dba,
        calls.datetime as call_datetime,
        calls.outcome as call_outcome
      FROM deals
      LEFT JOIN calls ON deals.call_id = calls.id
      WHERE deals.id = ?
    `);
    const deal = stmt.get(id);
    
    if (!deal) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    res.json(deal);
  } catch (error) {
    console.error('Error fetching deal:', error);
    res.status(500).json({ error: 'Failed to fetch deal' });
  }
});

// Update a deal
app.put("/api/deals/:id", (req, res) => {
  try {
    const { id } = req.params;
    const { load_id, start_location, end_location, call_id, initial_price, agreed_price } = req.body;
    
    // Check if deal exists
    const checkStmt = db.prepare('SELECT id FROM deals WHERE id = ?');
    const exists = checkStmt.get(id);
    
    if (!exists) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    // Verify call_id exists if provided
    if (call_id) {
      const checkCallStmt = db.prepare('SELECT id FROM calls WHERE id = ?');
      const callExists = checkCallStmt.get(call_id);
      if (!callExists) {
        return res.status(400).json({ error: 'Referenced call_id does not exist' });
      }
    }
    
    const stmt = db.prepare(
      'UPDATE deals SET load_id = ?, start_location = ?, end_location = ?, call_id = ?, initial_price = ?, agreed_price = ? WHERE id = ?'
    );
    stmt.run(load_id, start_location, end_location, call_id || null, initial_price || null, agreed_price || null, id);
    
    res.json({ 
      id: parseInt(id),
      load_id,
      start_location,
      end_location,
      call_id: call_id || null,
      initial_price: initial_price || null,
      agreed_price: agreed_price || null
    });
  } catch (error) {
    console.error('Error updating deal:', error);
    res.status(500).json({ error: 'Failed to update deal' });
  }
});

// Delete a deal
app.delete("/api/deals/:id", (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if deal exists
    const checkStmt = db.prepare('SELECT id FROM deals WHERE id = ?');
    const exists = checkStmt.get(id);
    
    if (!exists) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    
    const stmt = db.prepare('DELETE FROM deals WHERE id = ?');
    stmt.run(id);
    
    res.json({ message: 'Deal deleted successfully' });
  } catch (error) {
    console.error('Error deleting deal:', error);
    res.status(500).json({ error: 'Failed to delete deal' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Dashboard available at http://0.0.0.0:${PORT}/dashboard`);
});