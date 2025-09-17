
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const Plant = require('./src/models/Plant');
const Warehouse = require('./src/models/Warehouse');
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

const seedWarehouses = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Find or create a warehouse owner
    let warehouseOwner = await User.findOne({ role: 'warehouse-owner' });
    if (!warehouseOwner) {
      const hashedPassword = await bcrypt.hash('Owner@123', 10);
      warehouseOwner = new User({
        firstName: 'John',
        lastName: 'Doe',
        email: 'owner@warehouse.com',
        password: hashedPassword,
        role: 'warehouse-owner',
        userType: 'warehouse-owner',
        roles: ['warehouse-owner'],
        verified: true,
        warehouseOwnerProfile: {
          verificationStatus: 'verified',
          businessName: 'Green Storage Solutions'
        }
      });
      await warehouseOwner.save();
      console.log('Warehouse owner created successfully!');
    }

    // Create sample warehouses
    const sampleWarehouses = [
      {
        name: 'Green Valley Cold Storage',
        description: 'Modern cold storage facility with temperature control and pest management',
        location: {
          address: '123 Farm Road, Green Valley',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          coordinates: [72.8777, 19.0760]
        },
        capacity: {
          total: 1000,
          available: 500,
          unit: 'tons'
        },
        storageTypes: ['cold-storage', 'temperature-control'],
        facilities: ['temperature-control', 'pest-control', 'security', 'loading-dock'],
        pricing: {
          basePrice: 500,
          currency: 'INR',
          minimumDays: 7,
          maximumDays: 365
        },
        owner: warehouseOwner._id,
        status: 'active',
        verification: {
          status: 'verified',
          verifiedAt: new Date()
        }
      },
      {
        name: 'Agri Storage Hub',
        description: 'Large capacity storage facility for grains and pulses',
        location: {
          address: '456 Agriculture Street, Farm District',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          coordinates: [73.8567, 18.5204]
        },
        capacity: {
          total: 2000,
          available: 1200,
          unit: 'tons'
        },
        storageTypes: ['general', 'pest-control'],
        facilities: ['pest-control', 'security', 'loading-dock', 'weighing-scale'],
        pricing: {
          basePrice: 300,
          currency: 'INR',
          minimumDays: 5,
          maximumDays: 180
        },
        owner: warehouseOwner._id,
        status: 'active',
        verification: {
          status: 'verified',
          verifiedAt: new Date()
        }
      }
    ];

    for (const warehouseData of sampleWarehouses) {
      const existingWarehouse = await Warehouse.findOne({ name: warehouseData.name });
      if (!existingWarehouse) {
        const warehouse = new Warehouse(warehouseData);
        await warehouse.save();
        console.log(`Warehouse "${warehouseData.name}" created successfully!`);
      } else {
        console.log(`Warehouse "${warehouseData.name}" already exists.`);
      }
    }
  } catch (error) {
    console.error('Error seeding warehouses:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Run all seed functions
const runSeeds = async () => {
  await seedAdmin();
  await seedWarehouses();
};

runSeeds();
