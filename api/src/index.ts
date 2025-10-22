import express from "express";
import fs from "fs";

const app = express();
const PORT = 3000;

app.get("/", (_req, res) => {
  res.json({ message: "Welcome to the Simple API" });
});

app.get("/data", (_req, res) => {
  const raw = fs.readFileSync("../data/testData.json", "utf-8");
  const data = JSON.parse(raw);
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});