import assert from 'node:assert';
import http from 'node:http';
import { app, resetEvents } from './server.js';

console.log("=== RUNNING TASK 4 (EXPRESS & MIDDLEWARE) VERIFICATION TESTS ===");

const server = http.createServer(app);

server.listen(5099, async () => {
  const BASE_URL = 'http://localhost:5099';
  console.log(`Test server running at ${BASE_URL}`);

  try {
    resetEvents();

    // 1. Test POST /api/v1/events validation: empty title
    let res = await fetch(`${BASE_URL}/api/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: "   ", capacity: 50, fee: 0 })
    });
    let data = await res.json();
    assert.strictEqual(res.status, 400);
    assert.ok(data.error);
    console.log("✓ Empty title rejected with 400: " + data.error);

    // 2. Test POST /api/v1/events validation: title > 80 chars
    const longTitle = "A".repeat(81);
    res = await fetch(`${BASE_URL}/api/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: longTitle, capacity: 50 })
    });
    data = await res.json();
    assert.strictEqual(res.status, 400);
    console.log("✓ Long title (>80) rejected with 400: " + data.error);

    // 3. Test POST /api/v1/events validation: capacity not integer or out of bounds (1-500)
    res = await fetch(`${BASE_URL}/api/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: "Valid Title", capacity: 501 })
    });
    data = await res.json();
    assert.strictEqual(res.status, 400);

    res = await fetch(`${BASE_URL}/api/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: "Valid Title", capacity: 12.5 })
    });
    assert.strictEqual(res.status, 400);
    console.log("✓ Invalid capacity rejected with 400");

    // 4. Test POST /api/v1/events success: default fee is 0, trimmed title
    res = await fetch(`${BASE_URL}/api/v1/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: "   Web Dev Hackathon   ", capacity: 150 })
    });
    data = await res.json();
    assert.strictEqual(res.status, 201);
    assert.strictEqual(data.title, "Web Dev Hackathon"); // Trimmed!
    assert.strictEqual(data.capacity, 150);
    assert.strictEqual(data.fee, 0); // Default fee = 0!
    assert.ok(data.id);
    const createdId = data.id;
    console.log(`✓ Valid event created with 201: id=${createdId}, title="${data.title}", fee=${data.fee}`);

    // 5. Test GET /api/v1/events
    res = await fetch(`${BASE_URL}/api/v1/events`);
    data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(data));
    assert.ok(data.length >= 4);
    console.log(`✓ GET /api/v1/events returned 200 with ${data.length} events`);

    // 6. Test GET /api/v1/events?maxFee=50
    res = await fetch(`${BASE_URL}/api/v1/events?maxFee=50`);
    data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(data.every(e => e.fee <= 50));
    console.log(`✓ GET /api/v1/events?maxFee=50 returned only events with fee <= 50 (count: ${data.length})`);

    // 7. Test GET /api/v1/events/:id (found and not found)
    res = await fetch(`${BASE_URL}/api/v1/events/${createdId}`);
    data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.id, createdId);
    console.log(`✓ GET /api/v1/events/:id returned 200 for existing event`);

    res = await fetch(`${BASE_URL}/api/v1/events/99999`);
    data = await res.json();
    assert.strictEqual(res.status, 404);
    assert.ok(data.error);
    console.log(`✓ GET /api/v1/events/99999 returned 404 with error`);

    // 8. Test DELETE /api/v1/events/:id
    res = await fetch(`${BASE_URL}/api/v1/events/${createdId}`, { method: 'DELETE' });
    assert.strictEqual(res.status, 200);

    // Verify it is deleted
    res = await fetch(`${BASE_URL}/api/v1/events/${createdId}`);
    assert.strictEqual(res.status, 404);
    console.log(`✓ DELETE /api/v1/events/:id deleted event and subsequent GET returns 404`);

    res = await fetch(`${BASE_URL}/api/v1/events/${createdId}`, { method: 'DELETE' });
    assert.strictEqual(res.status, 404);
    console.log(`✓ DELETE /api/v1/events/:id for non-existing event returns 404`);

    // 9. Test GET /api/v1/boom unhandled error handling
    res = await fetch(`${BASE_URL}/api/v1/boom`);
    data = await res.json();
    assert.strictEqual(res.status, 500);
    assert.deepStrictEqual(data, { error: "Something went wrong" });
    assert.strictEqual(data.stack, undefined); // NO stack trace in response!
    console.log("✓ GET /api/v1/boom returned 500 { error: 'Something went wrong' } with no stack trace");

    console.log("\n>>> ALL TESTS FOR TASK 4 PASSED WITH 100% SUCCESS! <<<\n");
  } catch (err) {
    console.error("Test failure:", err);
    process.exit(1);
  } finally {
    server.close();
  }
});
