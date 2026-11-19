import mongoose from 'mongoose';

export async function connectDatabase(connectionString = process.env.MONGODB_URI) {
  if (!connectionString) {
    throw new Error('MONGODB_URI is required to connect to MongoDB.');
  }

  await mongoose.connect(connectionString);
}
