import mongoose from 'mongoose';
import Event from './models/Event.js';
import { formatValidationError } from './utils/formatValidationError.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_event_hub';

// Read arguments from command line or use defaults
// Usage: node add-event.js "<title>" "<date>" "<category>" <capacity> <fee>
const args = process.argv.slice(2);
const title = args[0] || "CHARUSAT National Hackathon 2026";
const dateStr = args[1] || "2026-12-25";
const category = args[2] || "tech";
const capacity = args[3] !== undefined ? Number(args[3]) : 300;
const fee = args[4] !== undefined ? Number(args[4]) : 50;

async function addEvent() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    const newEvent = new Event({
      title,
      date: new Date(dateStr),
      category,
      capacity,
      fee
    });

    const saved = await newEvent.save();
    console.log("✓ Successfully added event to MongoDB:");
    console.log(JSON.stringify(saved.toObject(), null, 2));
  } catch (err) {
    console.error("❌ Failed to add event:");
    const formatted = formatValidationError(err);
    console.log(JSON.stringify(formatted, null, 2));
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
}

addEvent();
