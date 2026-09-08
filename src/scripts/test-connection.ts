import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import mongoose from 'mongoose';
import connectToDatabase from '../lib/mongodb';

async function testConnection() {
  console.log('====================================================');
  console.log('       RideSetu MongoDB Atlas Connection Test        ');
  console.log('====================================================');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ [FAIL] MONGODB_URI is not set in .env.local');
    process.exit(1);
  }

  // Verify that URI is not exposed client side
  if (process.env.NEXT_PUBLIC_MONGODB_URI) {
    console.error('❌ [SECURITY ALERT] MONGODB_URI is exposed to client-side NEXT_PUBLIC_ namespace!');
    process.exit(1);
  }

  console.log('📡 [1/3] Initiating connection to MongoDB Atlas cluster...');

  try {
    const startTime = Date.now();
    await connectToDatabase();
    const duration = Date.now() - startTime;

    console.log(`✅ [2/3] Successfully connected to MongoDB Atlas in ${duration}ms!`);

    if (mongoose.connection.db) {
      const pingResult = await mongoose.connection.db.admin().ping();
      console.log('✅ [3/3] Ping response from Atlas server:', pingResult);

      const dbName = mongoose.connection.db.databaseName;
      console.log(`📊 Database Name: "${dbName}"`);
      console.log(`🔌 Connection State: ${mongoose.STATES[mongoose.connection.readyState]}`);

      const collections = await mongoose.connection.db.listCollections().toArray();
      console.log(`📁 Collections Found in Database (${collections.length}):`, collections.map(c => c.name).join(', ') || '(Empty database - ready for seed)');

      // Test CRUD operation on test collection
      const testCollection = mongoose.connection.db.collection('_connection_test');
      const testDoc = { testId: 'ridesetu_init', timestamp: new Date(), status: 'ACTIVE' };
      await testCollection.insertOne(testDoc);
      const readDoc = await testCollection.findOne({ testId: 'ridesetu_init' });
      await testCollection.deleteOne({ testId: 'ridesetu_init' });
      console.log(`✅ [CRUD Test] Verified document write, query & cleanup on Atlas cluster:`, readDoc?.status === 'ACTIVE' ? 'PASSED' : 'FAILED');
    }

    console.log('====================================================');
    console.log('  🎉 MongoDB Atlas Connection Test: 100% SUCCESSFUL  ');
    console.log('====================================================');
  } catch (error: any) {
    console.error('❌ [FAIL] MongoDB Atlas connection error:', error.message || error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testConnection();
