
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Plant = require('./src/models/Plant');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const adminEmail = 'admin@farmerai.com';
    const adminPassword = 'Admin@123';

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const adminUser = new User({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        roles: ['admin', 'farmer'],
        verified: true,
      });
      await adminUser.save();
      console.log('Admin user created successfully!');
    } else {
      console.log('Admin user already exists.');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    mongoose.disconnect();
  }
};

const seedPlants = async () => {
  try {
    // upsert a few demo plants
    const samples = [
      {
        name: 'Tomato',
        scientificName: 'Solanum lycopersicum',
        growthTime: '60-85 days',
        climate: 'Warm-season',
        season: 'Summer',
        uses: ['Culinary', 'Salads', 'Sauces'],
        imageUrl: '/plants/uploads/sample_tomato.jpg',
      },
      {
        name: 'Basil',
        scientificName: 'Ocimum basilicum',
        growthTime: '50-75 days',
        climate: 'Warm, sunny',
        season: 'Late Spring to Summer',
        uses: ['Culinary', 'Herbal'],
        imageUrl: '/plants/uploads/sample_basil.jpg',
      },
    ];

    for (const s of samples) {
      await Plant.findOneAndUpdate(
        { name: s.name },
        { $set: s },
        { upsert: true, new: true }
      );
    }
    console.log('Sample plants seeded.');
  } catch (error) {
    console.error('Error seeding plants:', error);
  }
};

const run = async () => {
  await seedAdmin();
  await seedPlants();
  mongoose.disconnect();
};

run();
