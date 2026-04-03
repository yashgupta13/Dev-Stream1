import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config(); // Since it's in the same dir as .env now

const DB_URL = process.env.DB_URL;

async function testConnection() {
  if (!DB_URL) {
    console.error('DB_URL not found in current directory .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to:', DB_URL.split('@')[1].split('/')[0]); // Log cluster only
    await mongoose.connect(DB_URL);
    console.log('Successfully connected to MongoDB');

    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    
    if (collections.length === 0) {
      console.log('No collections found in the database.');
    }

    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`- ${col.name}: ${count} documents`);
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

testConnection();
