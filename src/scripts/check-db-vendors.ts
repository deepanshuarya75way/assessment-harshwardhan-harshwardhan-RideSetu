import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';

async function checkVendors() {
  const uri = process.env.MONGODB_URI || '';
  await mongoose.connect(uri, { dbName: 'ridesetu', bufferCommands: false });
  
  const vendors = await mongoose.connection.db?.collection('vendors').find({}).limit(10).toArray();
  console.log('Sample Vendors in DB:');
  vendors?.forEach(v => {
    console.log(`- _id: ${v._id}, businessName: ${v.businessName}, city: ${v.city}, verificationStatus: ${v.verificationStatus}`);
  });

  await mongoose.disconnect();
}

checkVendors();
