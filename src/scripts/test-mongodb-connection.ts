import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';

async function testConnection() {
  console.log('Testing MongoDB connection...');
  console.log('MONGODB_URI present:', !!process.env.MONGODB_URI);
  const uri = process.env.MONGODB_URI || '';

  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'ridesetu',
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });
    console.log('✅ Mongoose connected successfully! readyState:', mongoose.connection.readyState);
    
    const collections = await conn.connection.db?.listCollections().toArray();
    console.log('Collections in database:', collections?.map(c => c.name));

    const vendorsCount = await conn.connection.db?.collection('vendors').countDocuments();
    console.log('Vendors count:', vendorsCount);

    const vehiclesCount = await conn.connection.db?.collection('vehicles').countDocuments();
    console.log('Vehicles count:', vehiclesCount);

    await mongoose.disconnect();
  } catch (err: any) {
    console.error('❌ Mongoose connection failed:', err.name, err.message);
  }
}

testConnection();
