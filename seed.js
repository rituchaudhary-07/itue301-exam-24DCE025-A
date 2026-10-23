import mongoose from 'mongoose';
import Event from './models/Event.js';
import { formatValidationError } from './utils/formatValidationError.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_event_hub';

async function seed() {
  try {
    console.log("Connecting to MongoDB at:", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("✓ Connected to MongoDB successfully.\n");

    // Clean collection for fresh seed run
    await Event.deleteMany({});

    // 1. Save ONE VALID EVENT
    console.log("--- 1. SAVING ONE VALID EVENT ---");
    const validEvent = new Event({
      title: "CHARUSAT Tech Spandan 2026",
      date: new Date("2026-11-20T10:00:00Z"),
      category: "tech",
      capacity: 250,
      fee: 100
    });

    const savedEvent = await validEvent.save();
    console.log("✓ Valid event successfully saved to MongoDB:");
    console.log(JSON.stringify(savedEvent.toObject(), null, 2));

    // Additional valid events across tech, cultural, and sports categories
    const additionalEvents = [
      {
        title: "Campus Classical & Folk Fest 2026",
        date: new Date("2026-11-28T18:00:00Z"),
        category: "cultural",
        capacity: 180, // Cultural event <= 200
        fee: 150
      },
      {
        title: "Inter-College Badminton Championship",
        date: new Date("2026-12-05T09:00:00Z"),
        category: "sports",
        capacity: 64,
        fee: 50
      },
      {
        title: "AI & Cloud Computing Workshop",
        date: new Date("2026-12-12T10:00:00Z"),
        category: "tech",
        capacity: 200,
        fee: 0 // Free event
      },
      {
        title: "Street Dance Battle & Music Night",
        date: new Date("2026-12-18T19:00:00Z"),
        category: "cultural",
        capacity: 150, // Cultural event <= 200
        fee: 0 // Free event
      }
    ];

    const insertedAdditional = await Event.insertMany(additionalEvents);
    console.log(`✓ Added ${insertedAdditional.length} additional valid events to MongoDB.`);
    console.log("\n----------------------------------------------------\n");

    // 2. Trigger and print formatted error for ONE INVALID EVENT
    // Violations:
    // - title is empty (required)
    // - category is 'cultural', but capacity is 250 (> 200 cultural limit)
    // - fee is negative (-50)
    console.log("--- 2. ATTEMPTING TO SAVE ONE INVALID EVENT ---");
    const invalidEvent = new Event({
      title: "   ", // will fail required validation after trim
      date: "not-a-date",
      category: "cultural",
      capacity: 250, // exceeds 200 limit for cultural events
      fee: -50 // fee cannot be negative
    });

    try {
      await invalidEvent.save();
      console.error("❌ Unexpected: Invalid event should not have passed validation!");
    } catch (validationErr) {
      console.log("✓ Caught Mongoose ValidationError as expected.");
      const formattedError = formatValidationError(validationErr);
      console.log("Formatted Validation Error Object:");
      console.log(JSON.stringify(formattedError, null, 2));
    }

    console.log("\n----------------------------------------------------\n");
    console.log("Seed script completed successfully.");
  } catch (error) {
    console.error("Seed execution failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
}

seed();
