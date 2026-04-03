import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

const DB_URL = process.env.DB_URL;

async function testConnection() {
  if (!DB_URL) {
    console.error('DB_URL not found in current directory .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(DB_URL);
    console.log('Successfully connected to MongoDB');

    const db = mongoose.connection.db;

    const users = await db.collection("users").find({}).toArray();
    console.log(`\n--- Users Collection (${users.length} documents) ---`);
    console.log(JSON.stringify(users, null, 2));

    const sessions = await db.collection("sessions").find({}).toArray();
    console.log(`\n--- Sessions Collection (${sessions.length} documents) ---`);
    console.log(JSON.stringify(sessions, null, 2));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

testConnection();
