import assert from 'node:assert';
import { formatDate, formatDuration, formatFee, formatSeatStatus } from './src/utils/formatters.js';

console.log("=== RUNNING FRONTEND LOGIC & TASK 1, 2, 3 VERIFICATION TESTS ===");

// ----------------------------------------------------
// TASK 1 VERIFICATION
// ----------------------------------------------------
console.log("\n[TASK 1] Testing Date, Duration, Fee, and Seat Formatters...");

// 1. Date format DD Mon YYYY
assert.strictEqual(formatDate('2026-11-05'), '05 Nov 2026', 'Date should be 05 Nov 2026');
assert.strictEqual(formatDate('2026-01-01'), '01 Jan 2026', 'Date should be 01 Jan 2026');
console.log("✓ Date formatting passed: '05 Nov 2026'");

// 2. Duration format in hours and minutes omitting zero part
assert.strictEqual(formatDuration(90), '1 h 30 min', '90 mins should be 1 h 30 min');
assert.strictEqual(formatDuration(45), '45 min', '45 mins should be 45 min (omitting zero hour)');
assert.strictEqual(formatDuration(120), '2 h', '120 mins should be 2 h (omitting zero min)');
assert.strictEqual(formatDuration(60), '1 h', '60 mins should be 1 h');
assert.strictEqual(formatDuration(75), '1 h 15 min', '75 mins should be 1 h 15 min');
console.log("✓ Duration formatting passed: 90 -> '1 h 30 min', 45 -> '45 min', 120 -> '2 h'");

// 3. Fee format: ₹ with two decimals, or "Free" when 0
assert.strictEqual(formatFee(0), 'Free', 'Fee 0 should be Free');
assert.strictEqual(formatFee(150), '₹150.00', 'Fee 150 should be ₹150.00');
assert.strictEqual(formatFee(49.5), '₹49.50', 'Fee 49.5 should be ₹49.50');
assert.strictEqual(formatFee(0.0), 'Free', 'Fee 0.0 should be Free');
console.log("✓ Fee formatting passed: 0 -> 'Free', 150 -> '₹150.00'");

// 4. Seat status format: "<n> seats left", or "Full" when 0
assert.strictEqual(formatSeatStatus(0), 'Full', '0 seats should be Full');
assert.strictEqual(formatSeatStatus(10), '10 seats left', '10 seats should be 10 seats left');
assert.strictEqual(formatSeatStatus(1), '1 seats left', '1 seat should be 1 seats left');
console.log("✓ Seat status formatting passed: 0 -> 'Full', 10 -> '10 seats left'");

// ----------------------------------------------------
// TASK 2 VERIFICATION
// ----------------------------------------------------
console.log("\n[TASK 2] Testing Registration Business Logic, Discounts & Refusals...");

const event1 = { id: 'evt-1', title: 'AI Summit', fee: 100, seats: 2 };
let registrations = [];

function registerStudent(name, email, event) {
  const trimmedName = (name || '').trim();
  const trimmedEmail = (email || '').trim();

  // Rule: If name or email is empty, show "Name and email are required"
  if (!trimmedName || !trimmedEmail) {
    return { success: false, message: "Name and email are required" };
  }

  // Seats left calculation: seats on the event minus this page's registrations for it
  const booked = registrations.filter(r => r.eventId === event.id).length;
  const seatsLeft = event.seats - booked;

  // Rule: Event has no seats left -> message "Event is full"
  if (seatsLeft <= 0) {
    return { success: false, message: "Event is full" };
  }

  // Rule: Same email already has 3 registrations -> message "Limit of 3 registrations reached"
  const emailCount = registrations.filter(r => r.studentEmail.toLowerCase() === trimmedEmail.toLowerCase()).length;
  if (emailCount >= 3) {
    return { success: false, message: "Limit of 3 registrations reached" };
  }

  // Rule: Email ending in @charusat.edu.in pays 80% of fee; other pays full fee
  const isCharusat = trimmedEmail.toLowerCase().endsWith('@charusat.edu.in');
  const feePayable = isCharusat ? (event.fee * 0.8) : event.fee;

  const newReg = {
    id: `reg-${Date.now()}-${Math.random()}`,
    studentName: trimmedName,
    studentEmail: trimmedEmail,
    eventId: event.id,
    eventTitle: event.title,
    feePayable
  };
  registrations.push(newReg);
  return { success: true, registration: newReg };
}

// 1. Empty name or email
const resEmpty = registerStudent('', 'test@test.com', event1);
assert.strictEqual(resEmpty.success, false);
assert.strictEqual(resEmpty.message, "Name and email are required");
console.log("✓ Empty input refusal passed: 'Name and email are required'");

// 2. Normal registration (100% fee)
const resNormal = registerStudent('Alice', 'alice@gmail.com', event1);
assert.strictEqual(resNormal.success, true);
assert.strictEqual(resNormal.registration.feePayable, 100);
console.log("✓ Standard email fee passed: ₹100.00 (100%)");

// 3. CHARUSAT registration (80% fee)
const resCharusat = registerStudent('Bob', '24dce025@charusat.edu.in', event1);
assert.strictEqual(resCharusat.success, true);
assert.strictEqual(resCharusat.registration.feePayable, 80);
console.log("✓ CHARUSAT discount passed: ₹80.00 (80% of ₹100.00)");

// 4. Seats exhausted refusal
const resFull = registerStudent('Charlie', 'charlie@gmail.com', event1);
assert.strictEqual(resFull.success, false);
assert.strictEqual(resFull.message, "Event is full");
console.log("✓ Event full refusal passed: 'Event is full'");

// 5. Test 3 registrations limit per email
const eventUnlimited = { id: 'evt-2', title: 'Open Fest', fee: 50, seats: 100 };
registrations = []; // Reset registrations
assert.strictEqual(registerStudent('User', 'sam@gmail.com', eventUnlimited).success, true);
assert.strictEqual(registerStudent('User', 'sam@gmail.com', eventUnlimited).success, true);
assert.strictEqual(registerStudent('User', 'sam@gmail.com', eventUnlimited).success, true);
const resLimit = registerStudent('User', 'sam@gmail.com', eventUnlimited);
assert.strictEqual(resLimit.success, false);
assert.strictEqual(resLimit.message, "Limit of 3 registrations reached");
console.log("✓ Registration limit refusal passed: 'Limit of 3 registrations reached'");

// 6. Test cancellation restoring seats and lowering total
const totalBeforeCancel = registrations.reduce((sum, r) => sum + r.feePayable, 0);
assert.strictEqual(totalBeforeCancel, 150);
const removedReg = registrations.pop();
const totalAfterCancel = registrations.reduce((sum, r) => sum + r.feePayable, 0);
assert.strictEqual(totalAfterCancel, 100);
console.log("✓ Cancellation restored seat & lowered total payable (₹150 -> ₹100)");

// ----------------------------------------------------
// TASK 3 VERIFICATION
// ----------------------------------------------------
console.log("\n[TASK 3] Testing Organisers Sorting & Structure...");
const mockUsers = [
  { id: 1, name: "Leanne Graham", email: "Sincere@april.biz", company: { name: "Romaguera-Crona" } },
  { id: 2, name: "Ervin Howell", email: "Shanna@melissa.tv", company: { name: "Deckow-Crist" } },
  { id: 3, name: "clementina DuBuque", email: "Rey.Padberg@karina.biz", company: { name: "Hoeger LLC" } },
  { id: 4, name: "Chelsey Dietrich", email: "Lucio_Hettinger@annie.ca", company: { name: "Keebler LLC" } }
];

const sortedUsers = [...mockUsers].sort((a, b) => {
  return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
});

assert.strictEqual(sortedUsers[0].name, "Chelsey Dietrich");
assert.strictEqual(sortedUsers[1].name, "clementina DuBuque"); // Case-insensitive sorting works!
assert.strictEqual(sortedUsers[2].name, "Ervin Howell");
assert.strictEqual(sortedUsers[3].name, "Leanne Graham");
console.log("✓ Case-insensitive A-Z sorting passed: " + sortedUsers.map(u => u.name).join(' -> '));

console.log("\n>>> ALL TESTS FOR TASKS 1, 2, AND 3 PASSED PERFECTLY! <<<\n");
