import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose | null> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('[MongoDB] MONGODB_URI environment variable is not defined.');
    return null;
  }

  if (cached.conn && (mongoose.connection.readyState as number) === 1) {
    return cached.conn;
  }

  if ((mongoose.connection.readyState as number) === 1) {
    cached.conn = mongoose;
    return mongoose;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      dbName: 'ridesetu',
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(uri, opts)
      .then((m) => {
        cached.conn = m;
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        cached.conn = null;
        const safeReason = err instanceof Error ? err.name + ': ' + err.message.replace(/mongodb(\+srv)?:\/\/[^@]+@/, 'mongodb://$1***:***@') : 'Database connection error';
        console.error('[MongoDB] Connection warning:', safeReason);
        mongoose.set('bufferCommands', false);
        return null;
      });
  }

  try {
    cached.conn = await cached.promise;
    if (cached.conn && (mongoose.connection.readyState as number) === 1) {
      mongoose.set('bufferCommands', true);
      return cached.conn;
    }
    mongoose.set('bufferCommands', false);
    return null;
  } catch (e) {
    cached.promise = null;
    cached.conn = null;
    mongoose.set('bufferCommands', false);
    return null;
  }
}

export default connectToDatabase;
