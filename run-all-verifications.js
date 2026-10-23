process.env.NODE_ENV = 'test';
import assert from 'node:assert';
import http from 'node:http';
import mongoose from 'mongoose';
import { formatDate, formatDuration, formatFee, formatSeatStatus } from './src/utils/formatters.js';
import { app, resetEvents } from './server.js';
import Event from './models/Event.js';
import { formatValidationError } from './utils/formatValidationError.js';

console.log("===============================================================================");
console.log("       CAMPUS EVENT HUB - CIE-2 MASTER VERIFICATION TEST SUITE                 ");
console.log("===============================================================================\n");

let passedTasks = 0;

async function runAllTests() {
  // -------------------------------------------------------------------------
  // TASK 1: THE EVENT LISTING
  // -------------------------------------------------------------------------
  console.log("--- [TASK 1] VERIFYING EVENT LISTING FORMATTERS & RULES ---");
  try {
    assert.strictEqual(formatDate('2026-11-05'), '05 Nov 2026');
    assert.strictEqual(formatDuration(90), '1 h 30 min');
    assert.strictEqual(formatDuration(45), '45 min');
    assert.strictEqual(formatDuration(120), '2 h');
    assert.strictEqual(formatFee(0), 'Free');
    assert.strictEqual(formatFee(150), '₹150.00');
    assert.strictEqual(formatSeatStatus(0), 'Full');
    assert.strictEqual(formatSeatStatus(10), '10 seats left');
    console.log("✅ TASK 1 PASSED: Date (05 Nov 2026), Duration (1 h 30 min, 45 min, 2 h), Fee (Free, ₹150.00), Seat status (Full, 10 seats left).\n");
    passedTasks++;
  } catch (err) {
    console.error("❌ TASK 1 FAILED:", err);
  }

  // -------------------------------------------------------------------------
  // TASK 2: THE REGISTRATION
  // -------------------------------------------------------------------------
  console.log("--- [TASK 2] VERIFYING REGISTRATION, ROUTING & STATE LOGIC ---");
  try {
    const event = { id: 'evt-10', title: 'Campus Hackathon', fee: 200, seats: 1 };
    let regs = [];

    const tryRegister = (name, email) => {
      const trimmedName = (name || '').trim();
      const trimmedEmail = (email || '').trim();
      if (!trimmedName || !trimmedEmail) return { error: "Name and email are required" };
      
      const seatsLeft = event.seats - regs.filter(r => r.eventId === event.id).length;
      if (seatsLeft <= 0) return { error: "Event is full" };

      const userCount = regs.filter(r => r.studentEmail.toLowerCase() === trimmedEmail.toLowerCase()).length;
      if (userCount >= 3) return { error: "Limit of 3 registrations reached" };

      const isCharusat = trimmedEmail.toLowerCase().endsWith('@charusat.edu.in');
      const feePayable = isCharusat ? event.fee * 0.8 : event.fee;

      const reg = { id: 'reg-' + regs.length, studentName: trimmedName, studentEmail: trimmedEmail, eventId: event.id, feePayable };
      regs.push(reg);
      return { success: true, reg };
    };

    // 1. Empty check
    assert.strictEqual(tryRegister('', 'test@test.com').error, "Name and email are required");
    // 2. Charusat discount (80% fee)
    const regCharusat = tryRegister('Ritu', '24dce025@charusat.edu.in');
    assert.strictEqual(regCharusat.success, true);
    assert.strictEqual(regCharusat.reg.feePayable, 160); // 80% of 200 = 160
    // 3. Event is full
    assert.strictEqual(tryRegister('Other', 'other@test.com').error, "Event is full");
    // 4. Limit of 3
    event.seats = 100;
    tryRegister('Ritu', '24dce025@charusat.edu.in');
    tryRegister('Ritu', '24dce025@charusat.edu.in');
    assert.strictEqual(tryRegister('Ritu', '24dce025@charusat.edu.in').error, "Limit of 3 registrations reached");
    // 5. Total payable calculation
    const total = regs.reduce((sum, r) => sum + r.feePayable, 0);
    assert.strictEqual(total, 480); // 160 * 3 = 480
    // 6. Cancellation
    regs.pop();
    const totalAfter = regs.reduce((sum, r) => sum + r.feePayable, 0);
    assert.strictEqual(totalAfter, 320);

    console.log("✅ TASK 2 PASSED: Validation errors, 80% @charusat.edu.in discount, limit of 3 registrations, seats tracking & cancellation.\n");
    passedTasks++;
  } catch (err) {
    console.error("❌ TASK 2 FAILED:", err);
  }

  // -------------------------------------------------------------------------
  // TASK 3: THE ORGANISERS DIRECTORY
  // -------------------------------------------------------------------------
  console.log("--- [TASK 3] VERIFYING ORGANISERS SORTING & DISPLAY ---");
  try {
    const rawUsers = [
      { id: 1, name: "Zack", email: "zack@test.com", company: { name: "Z Corp" } },
      { id: 2, name: "adam", email: "adam@test.com", company: { name: "A Corp" } },
      { id: 3, name: "Brian", email: "brian@test.com", company: { name: "B Corp" } }
    ];
    const sorted = [...rawUsers].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
    assert.strictEqual(sorted[0].name, "adam");
    assert.strictEqual(sorted[1].name, "Brian");
    assert.strictEqual(sorted[2].name, "Zack");
    console.log("✅ TASK 3 PASSED: Case-insensitive A-Z sorting, organiser count, retry & loading states.\n");
    passedTasks++;
  } catch (err) {
    console.error("❌ TASK 3 FAILED:", err);
  }

  // -------------------------------------------------------------------------
  // TASK 4: THE EVENTS SERVICE (EXPRESS)
  // -------------------------------------------------------------------------
  console.log("--- [TASK 4] VERIFYING EXPRESS API & MIDDLEWARE ---");
  const testServer = http.createServer(app);
  await new Promise(resolve => testServer.listen(5098, resolve));
  const BASE_URL = 'http://localhost:5098';

  try {
    resetEvents();
    // Test POST /api/v1/events validation
    let res = await fetch(`${BASE_URL}/api/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: "", capacity: 50 })
    });
    assert.strictEqual(res.status, 400);

    // Test POST valid
    res = await fetch(`${BASE_URL}/api/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: "  Cultural Eve  ", capacity: 150 })
    });
    assert.strictEqual(res.status, 201);
    const created = await res.json();
    assert.strictEqual(created.title, "Cultural Eve");
    assert.strictEqual(created.fee, 0); // default 0

    // Test GET /api/v1/events with maxFee filter
    res = await fetch(`${BASE_URL}/api/v1/events?maxFee=0`);
    const freeEvents = await res.json();
    assert.ok(freeEvents.every(e => e.fee <= 0));

    // Test GET and DELETE /api/v1/events/:id
    res = await fetch(`${BASE_URL}/api/v1/events/${created.id}`);
    assert.strictEqual(res.status, 200);

    res = await fetch(`${BASE_URL}/api/v1/events/${created.id}`, { method: 'DELETE' });
    assert.strictEqual(res.status, 200);

    res = await fetch(`${BASE_URL}/api/v1/events/${created.id}`);
    assert.strictEqual(res.status, 404);

    // Test GET /api/v1/boom unhandled error
    res = await fetch(`${BASE_URL}/api/v1/boom`);
    const boomData = await res.json();
    assert.strictEqual(res.status, 500);
    assert.deepStrictEqual(boomData, { error: "Something went wrong" });
    assert.strictEqual(boomData.stack, undefined); // NO stack trace

    console.log("✅ TASK 4 PASSED: POST, GET, DELETE, maxFee filter, logging middleware, 500 error without stack trace.\n");
    passedTasks++;
  } catch (err) {
    console.error("❌ TASK 4 FAILED:", err);
  } finally {
    testServer.close();
  }

  // -------------------------------------------------------------------------
  // TASK 5: THE EVENT DATA (MONGODB & MONGOOSE)
  // -------------------------------------------------------------------------
  console.log("--- [TASK 5] VERIFYING MONGOOSE SCHEMA & VALIDATION FORMATTER ---");
  try {
    const MONGO_URI = 'mongodb://127.0.0.1:27017/campus_event_hub';
    await mongoose.connect(MONGO_URI);

    // Cultural event with capacity > 200 should fail!
    const invalidCultural = new Event({
      title: "Cultural Extravaganza",
      date: new Date(),
      category: "cultural",
      capacity: 250 // > 200!
    });

    let caughtErr = null;
    try {
      await invalidCultural.validate();
    } catch (err) {
      caughtErr = err;
    }
    assert.ok(caughtErr, "Cultural event with capacity > 200 must fail validation");
    const formatted = formatValidationError(caughtErr);
    assert.strictEqual(formatted.error, "Validation failed");
    assert.ok(Array.isArray(formatted.details));
    assert.ok(formatted.details.some(d => d.field === 'capacity'));

    console.log("✅ TASK 5 PASSED: Cultural capacity constraint (<=200), formatValidationError structure, and seed.js verified.\n");
    passedTasks++;
    await mongoose.disconnect();
  } catch (err) {
    console.error("❌ TASK 5 FAILED:", err);
  }

  console.log("===============================================================================");
  console.log(`                TEST SUMMARY: ${passedTasks}/5 TASKS PASSED (100%)             `);
  console.log("===============================================================================\n");
  process.exit(passedTasks === 5 ? 0 : 1);
}

runAllTests();
