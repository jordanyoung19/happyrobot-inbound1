import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the Simple API" });
});

app.get("/data", (_req, res) => {
  const dataPath = path.join("/data", "testData.json");
  const raw = fs.readFileSync(dataPath, "utf-8");
  const data = JSON.parse(raw);
  res.json(data);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});