const express = require('express');
const cors = require("cors");
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.set('trust proxy', true);
const PORT = process.env.PORT || 3000;

// Load reasons from JSON
const reasonsPath = path.join(__dirname, 'data', 'reasons.json');
const reasons = JSON.parse(fs.readFileSync(reasonsPath, 'utf-8'));

// Rate limiter: 120 requests per minute per IP
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  keyGenerator: (req, res) => {
    return req.headers['cf-connecting-ip'] || req.ip; // Fallback if header missing (or for non-CF)
  },
  message: { error: "Too many requests, please try again later. (120 reqs/min/IP)" }
});

app.use(limiter);

const parseList = (value) =>
  value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];

// Random rejection reason endpoint (string only)
app.get('/no', (req, res) => {
  const entry = pickRandom(reasons);
  res.json({ reason: entry.reason });
});

// Filtered rejection reason endpoint (string only)
app.get('/no/rich', (req, res) => {
  const types = parseList(req.query.type);
  const tones = parseList(req.query.tone);
  const topics = parseList(req.query.topic);

  const filtered = reasons.filter((entry) => {
    if (types.length && !types.includes(entry.type)) {
      return false;
    }
    if (tones.length && !tones.includes(entry.tone)) {
      return false;
    }
    if (topics.length && !topics.includes(entry.topic)) {
      return false;
    }
    return true;
  });

  if (!filtered.length) {
    return res.status(404).json({
      error: "No reasons match the requested filters.",
    });
  }

  const entry = pickRandom(filtered);
  return res.json({ reason: entry.reason });
});

// Start server
app.listen(PORT, () => {
  console.log(`No-as-a-Service is running on port ${PORT}`);
});
