import mongoose from 'mongoose';

// Read env var lazily so missing env does not throw during module import.
const MONGODB_URI = process.env.MONGODB_URI || '';

// Global cache to prevent opening too many connections in development mode
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }
  const opts = {
    bufferCommands: false,
  };

  if (!cached.promise) {
    if (!MONGODB_URI) {
      // Throwing here ensures the error surfaces inside API route try/catch
      // so it returns a proper 500 with a helpful message instead of
      // failing during module import.
      throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("Successfully connected to MongoDB.");
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error: any) {
    // Detect common DNS SRV lookup failures (Atlas +mongodb+srv)
    const msg = String(error?.message || error);
    const isSrvLookupError = /querySrv/i.test(msg) || error?.code === 'ENOTFOUND';

    // If the URI used srv and there's an explicit fallback provided via env,
    // try connecting with the fallback (non-SRV) URI. Useful when local DNS
    // doesn't resolve SRV records or in restricted networks.
    const isUsingSrv = MONGODB_URI.startsWith('mongodb+srv://');
    const fallback = process.env.MONGODB_URI_FALLBACK || process.env.MONGODB_URI_STD || '';

    if (isSrvLookupError && isUsingSrv && fallback) {
      console.warn('SRV DNS lookup failed for MongoDB URI; attempting fallback URI from MONGODB_URI_FALLBACK');
      try {
        cached.promise = mongoose.connect(fallback, opts).then((mongoose) => {
          console.log('Successfully connected to MongoDB using fallback URI.');
          return mongoose;
        });

        cached.conn = await cached.promise;
        return cached.conn;
      } catch (fallbackErr: any) {
        // fall through to throw a combined error below
        error = fallbackErr;
      }
    }

    // Provide a more actionable error message for SRV/DNS failures
    if (isSrvLookupError) {
      const hint = `SRV DNS lookup failed for your MongoDB Atlas host. Possible fixes:\n` +
        `  - Verify your MONGODB_URI host (cluster name) is correct (not a placeholder).\n` +
        `  - In Atlas, copy the "Standard" (mongodb://) connection string and set it in MONGODB_URI_FALLBACK or MONGODB_URI_STD in .env.local.\n` +
        `  - Ensure your machine's DNS allows SRV lookups or try switching DNS to 8.8.8.8 / 1.1.1.1.\n` +
        `  - Ensure Atlas Network Access contains your IP.\n`;

      throw new Error(`MongoDB connection failed: ${msg}\n${hint}Original error: ${msg}`);
    }

    // Re-throw the original error for other failure modes
    throw error;
  }
}

export default connectToDatabase;
