// One-off maintenance script to activate all verified warehouses
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const Warehouse = require('../src/models/Warehouse');

async function run() {
  try {
    await connectDB();
    console.log('✅ Connected to DB');

    const filter = { 'verification.status': 'verified', status: { $ne: 'active' } };
    const update = { $set: { status: 'active' } };

    const { matchedCount, modifiedCount } = await Warehouse.updateMany(filter, update);
    console.log(`Matched: ${matchedCount}, Activated: ${modifiedCount}`);

    const totalActiveVerified = await Warehouse.countDocuments({ 'verification.status': 'verified', status: 'active' });
    console.log(`Total active+verified warehouses: ${totalActiveVerified}`);
  } catch (e) {
    console.error('❌ Error:', e?.message || e);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected');
  }
}

run();





