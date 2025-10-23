require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../src/config/db');
const Warehouse = require('../src/models/Warehouse');

async function run() {
  try {
    await connectDB();
    const items = await Warehouse.find({}).lean();
    console.log(`Total warehouses: ${items.length}`);
    for (const w of items) {
      console.log({
        id: w._id.toString(),
        name: w.name,
        status: w.status,
        verification: w.verification,
        createdAt: w.createdAt,
      });
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await mongoose.connection.close();
  }
}

run();





