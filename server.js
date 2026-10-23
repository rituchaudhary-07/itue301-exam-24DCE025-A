import express from 'express';
import cors from 'cors';

export const app = express();
const PORT = process.env.PORT || 5000;

// Enable JSON body parsing and CORS
app.use(cors());
app.use(express.json());

// Rule: Every request logs one line: [METHOD] [PATH] [TIMESTAMP].
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${req.method}] [${req.path}] [${timestamp}]`);
  next();
});

// In-memory data store for Task 4
export let events = [
  { id: "1", title: "AI & Cloud Computing Summit 2026", capacity: 200, fee: 0 },
  { id: "2", title: "Campus Classical & Folk Fest", capacity: 150, fee: 150 },
  { id: "3", title: "Inter-College Badminton Tournament", capacity: 64, fee: 50 }
];
let nextId = 4;

/**
 * Reset events store (useful for tests)
 */
export function resetEvents() {
  events = [
    { id: "1", title: "AI & Cloud Computing Summit 2026", capacity: 200, fee: 0 },
    { id: "2", title: "Campus Classical & Folk Fest", capacity: 150, fee: 150 },
    { id: "3", title: "Inter-College Badminton Tournament", capacity: 64, fee: 50 }
  ];
  nextId = 4;
}

// ----------------------------------------------------
// TASK 4 ROUTES
// ----------------------------------------------------

/**
 * POST /api/v1/events
 * Requires title (1 to 80 characters after trimming) and capacity (whole number 1 to 500),
 * and accepts fee (number, 0 or more, default 0).
 * Otherwise respond 400 { "error": "..." }.
 * On success respond 201 with the event.
 */
app.post('/api/v1/events', (req, res) => {
  const { title, capacity, fee } = req.body;

  // Title validation: required, 1 to 80 characters after trimming
  if (typeof title !== 'string') {
    return res.status(400).json({ error: "Title is required and must be a string" });
  }
  const trimmedTitle = title.trim();
  if (trimmedTitle.length < 1 || trimmedTitle.length > 80) {
    return res.status(400).json({ error: "Title must be between 1 and 80 characters after trimming" });
  }

  // Capacity validation: required, whole number 1 to 500
  if (capacity === undefined || capacity === null || capacity === '') {
    return res.status(400).json({ error: "Capacity is required" });
  }
  const capNum = Number(capacity);
  if (!Number.isInteger(capNum) || capNum < 1 || capNum > 500) {
    return res.status(400).json({ error: "Capacity must be a whole number between 1 and 500" });
  }

  // Fee validation: optional, number 0 or more, default 0
  let feeNum = 0;
  if (fee !== undefined && fee !== null) {
    feeNum = Number(fee);
    if (isNaN(feeNum) || feeNum < 0) {
      return res.status(400).json({ error: "Fee must be a number greater than or equal to 0" });
    }
  }

  const newEvent = {
    id: String(nextId++),
    title: trimmedTitle,
    capacity: capNum,
    fee: feeNum
  };

  events.push(newEvent);
  return res.status(201).json(newEvent);
});

/**
 * GET /api/v1/events
 * Responds 200 with the list; with ?maxFee=n only events whose fee is n or less.
 */
app.get('/api/v1/events', (req, res) => {
  let result = [...events];

  if (req.query.maxFee !== undefined) {
    const maxFee = Number(req.query.maxFee);
    if (isNaN(maxFee)) {
      return res.status(400).json({ error: "maxFee query parameter must be a valid number" });
    }
    result = result.filter((e) => e.fee <= maxFee);
  }

  return res.status(200).json(result);
});

/**
 * GET /api/v1/events/:id
 * Responds 200 when the event exists, otherwise 404 { "error": "..." }.
 */
app.get('/api/v1/events/:id', (req, res) => {
  const event = events.find((e) => e.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }
  return res.status(200).json(event);
});

/**
 * DELETE /api/v1/events/:id
 * Responds 200 when the event exists, otherwise 404 { "error": "..." }.
 */
app.delete('/api/v1/events/:id', (req, res) => {
  const index = events.findIndex((e) => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Event not found" });
  }
  const deleted = events.splice(index, 1)[0];
  return res.status(200).json(deleted);
});

/**
 * GET /api/v1/boom
 * Throws an error on purpose to test unhandled error handling.
 */
app.get('/api/v1/boom', (req, res) => {
  throw new Error("Deliberate unhandled boom error");
});

// Rule: Any unhandled error responds 500 { "error": "Something went wrong" } with no stack trace in the response.
app.use((err, req, res, next) => {
  res.status(500).json({ error: "Something went wrong" });
});

import { fileURLToPath } from 'node:url';

// Start server if run directly
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('server.js') ||
  fileURLToPath(import.meta.url) === process.argv[1]
);

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}
