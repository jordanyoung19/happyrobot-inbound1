import express from "express";
import fs from "fs";
import ngrok from "@ngrok/ngrok";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Load ngrok configuration
const configPath = path.join(__dirname, "..", "ngrok.config.json");
const ngrokConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the Simple API" });
});

app.get("/data", (_req, res) => {
  const raw = fs.readFileSync(
    path.join(__dirname, "..", "..", "data", "testData.json"),
    "utf-8"
  );
  const data = JSON.parse(raw);
  res.json(data);
});

// Start the Express server
const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  try {
    // Start ngrok tunnel
    const listener = await ngrok.forward({
      addr: ngrokConfig.addr,
      authtoken: ngrokConfig.authtoken,
      region: ngrokConfig.region,
    });

    const publicUrl = listener.url();
    console.log(`\n🌐 Public URL: ${publicUrl}`);
    console.log(`\n✨ Your API is now accessible from anywhere!`);
    console.log(`   - Root: ${publicUrl}/`);
    console.log(`   - Data: ${publicUrl}/data\n`);
  } catch (error) {
    console.error("❌ Failed to start ngrok tunnel:", error);
    console.error("Server will continue running locally only.");
  }
});

// Graceful shutdown
const shutdown = async () => {
  console.log("\n\n🛑 Shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

