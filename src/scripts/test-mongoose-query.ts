import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import connectToDatabase from '../lib/mongodb';
import { Vendor } from '../models/Vendor';

async function testQuery() {
  await connectToDatabase();
  const searchCity = 'Rishikesh';
  const vendorQuery: any = {
    $or: [
      { city: { $regex: searchCity, $options: 'i' } },
      { address: { $regex: searchCity, $options: 'i' } },
    ],
  };

  const vendors = await Vendor.find(vendorQuery).lean();
  console.log('Query result count:', vendors.length);
  vendors.forEach(v => console.log('Vendor:', v.businessName, v.city));

  process.exit(0);
}

testQuery();
