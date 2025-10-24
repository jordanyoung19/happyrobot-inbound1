-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Calls table
CREATE TABLE IF NOT EXISTS calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sentiment TEXT NOT NULL,
    dba TEXT NOT NULL,
    datetime TEXT NOT NULL,
    outcome TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Deals table
CREATE TABLE IF NOT EXISTS deals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    load_id TEXT NOT NULL,
    start_location TEXT NOT NULL,
    end_location TEXT NOT NULL,
    call_id INTEGER,
    initial_price INTEGER,
    agreed_price INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE SET NULL
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_calls_datetime ON calls(datetime);
CREATE INDEX IF NOT EXISTS idx_deals_load_id ON deals(load_id);
CREATE INDEX IF NOT EXISTS idx_deals_call_id ON deals(call_id);

