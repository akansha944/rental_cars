import mongoose from 'mongoose';
import { env } from './env';

mongoose.set('strictQuery', true);

export async function connectDb(): Promise<void> {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('[db] Connected to MongoDB');
  } catch (err) {
    console.error('[db] Connection error:', err);
    throw err;
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[db] MongoDB error:', err);
  });
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
