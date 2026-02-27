// server.js
// -------------------------------------------------------------
// Simple Node.js + Express backend used by the Chrome extension.
//
// Purpose:
// - Expose a POST /track endpoint that receives aggregated time data
//   from the background service worker.
// - Log and (optionally) persist the data for later analytics.
//
// How the extension sends data:
// - The background.js script uses the Fetch API to POST JSON to
//   http://localhost:3000/track every 60 seconds.
// - The payload includes:
//   {
//     timeByDomain: { "github.com": 120000, ... },
//     timeByCategory: { productive: 120000, unproductive: 60000, neutral: 0 },
//     syncedAt: "2026-02-11T12:34:56.000Z"
//   }
//
// You can later extend this server to:
// - Store data in a database (MongoDB, Postgres, etc).
// - Expose additional endpoints for reporting.
// - Secure it using authentication and HTTPS.
// -------------------------------------------------------------

const express = require("express");
const cors = require("cors");

const app = express();
const port = 3001;

// Enable CORS so the Chrome extension can POST to this server.
app.use(cors());

// Parse JSON request bodies.
app.use(express.json());

// In-memory store for demo purposes only.
// In a real project, replace this with a proper database.
let latestSnapshot = null;

// Simple health-check / info route so opening http://localhost:3001
// in the browser shows a friendly message instead of an error.
app.get("/", (req, res) => {
  res.send(
    "Time tracking backend is running. Use POST /track to send data or GET /latest to view the last snapshot."
  );
});

// POST /track
// This endpoint receives aggregated time data from the extension.
app.post("/track", (req, res) => {
  const { timeByDomain, timeByCategory, syncedAt } = req.body || {};

  if (!timeByDomain || !timeByCategory) {
    return res.status(400).json({
      ok: false,
      message: "Missing timeByDomain or timeByCategory in request body."
    });
  }

  latestSnapshot = {
    timeByDomain,
    timeByCategory,
    syncedAt: syncedAt || new Date().toISOString()
  };

  // For the internship demo, we just log the snapshot to the console.
  console.log("Received time tracking snapshot:");
  console.log(JSON.stringify(latestSnapshot, null, 2));

  return res.json({ ok: true });
});

// (Optional convenience endpoint)
// GET /latest
// Quick way to see what the last synced snapshot looks like.
app.get("/latest", (req, res) => {
  if (!latestSnapshot) {
    return res.json({
      ok: true,
      message: "No snapshots received yet.",
      data: null
    });
  }

  return res.json({
    ok: true,
    data: latestSnapshot
  });
});

app.listen(port, () => {
  console.log(`Time tracking backend listening on http://localhost:${port}`);
});

