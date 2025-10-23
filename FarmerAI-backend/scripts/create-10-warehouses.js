require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Warehouse = require('../src/models/Warehouse');

async function createWarehouseOwners() {
  const owners = [
    {
      firstName: 'Rajesh',
      lastName: 'Kumar',
      email: 'rajesh@agristorage.com',
      password: 'Owner@123',
      role: 'warehouse-owner',
      userType: 'warehouse-owner',
      roles: ['warehouse-owner'],
      verified: true,
      warehouseOwnerProfile: {
        verificationStatus: 'verified',
        businessName: 'Agri Storage Solutions Pvt Ltd'
      }
    },
    {
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya@coldstorage.com',
      password: 'Owner@123',
      role: 'warehouse-owner',
      userType: 'warehouse-owner',
      roles: ['warehouse-owner'],
      verified: true,
      warehouseOwnerProfile: {
        verificationStatus: 'verified',
        businessName: 'Cold Chain Management Ltd'
      }
    },
    {
      firstName: 'Amit',
      lastName: 'Patel',
      email: 'amit@grainstorage.com',
      password: 'Owner@123',
      role: 'warehouse-owner',
      userType: 'warehouse-owner',
      roles: ['warehouse-owner'],
      verified: true,
      warehouseOwnerProfile: {
        verificationStatus: 'verified',
        businessName: 'Grain Storage Hub'
      }
    },
    {
      firstName: 'Sunita',
      lastName: 'Singh',
      email: 'sunita@modernstorage.com',
      password: 'Owner@123',
      role: 'warehouse-owner',
      userType: 'warehouse-owner',
      roles: ['warehouse-owner'],
      verified: true,
      warehouseOwnerProfile: {
        verificationStatus: 'verified',
        businessName: 'Modern Storage Solutions'
      }
    },
    {
      firstName: 'Vikram',
      lastName: 'Reddy',
      email: 'vikram@premiumstorage.com',
      password: 'Owner@123',
      role: 'warehouse-owner',
      userType: 'warehouse-owner',
      roles: ['warehouse-owner'],
      verified: true,
      warehouseOwnerProfile: {
        verificationStatus: 'verified',
        businessName: 'Premium Storage Facilities'
      }
    }
  ];

  const createdOwners = [];
  for (const ownerData of owners) {
    let owner = await User.findOne({ email: ownerData.email });
    if (!owner) {
      const hashedPassword = await bcrypt.hash(ownerData.password, 10);
      owner = new User({
        ...ownerData,
        password: hashedPassword
      });
      await owner.save();
      console.log(`✅ Owner created: ${ownerData.firstName} ${ownerData.lastName}`);
    } else {
      console.log(`ℹ️  Owner already exists: ${ownerData.firstName} ${ownerData.lastName}`);
    }
    createdOwners.push(owner);
  }
  return createdOwners;
}

async function createWarehouses(owners) {
  const warehouses = [
    {
      name: 'Mumbai Cold Storage Hub',
      description: 'State-of-the-art cold storage facility in Mumbai with advanced temperature control systems, perfect for storing perishable agricultural products. Features include automated climate control, pest management, and 24/7 security.',
      location: {
        address: 'Plot No. 45, Industrial Area, Andheri East',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400069',
        coordinates: {
          type: 'Point',
          coordinates: [72.8777, 19.0760]
        }
      },
      capacity: {
        total: 1500,
        available: 1200,
        unit: 'tons'
      },
      storageTypes: ['cold_storage', 'refrigerated', 'frozen'],
      facilities: ['temperature_control', 'humidity_control', 'security', 'cctv', 'fire_safety', 'loading_dock', 'forklift', 'pest_control', 'insurance'],
      pricing: {
        basePrice: 800,
        currency: 'INR',
        pricePerUnit: 'per_ton',
        minimumDays: 7,
        maximumDays: 365
      },
      contact: {
        phone: '+91-9876543210',
        email: 'mumbai@coldstorage.com',
        alternatePhone: '+91-9876543211'
      },
      owner: owners[0]._id,
      status: 'active',
      verification: {
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: owners[0]._id
      },
      rating: {
        average: 4.5,
        count: 23
      },
      isAvailable: true,
      terms: {
        minimumBookingDuration: 7,
        maximumBookingDuration: 365,
        advanceBookingDays: 30,
        cancellationPolicy: 'moderate'
      }
    },
    {
      name: 'Delhi Grain Storage Center',
      description: 'Large capacity grain storage facility in Delhi with modern grain handling equipment. Ideal for wheat, rice, pulses, and other grains. Features include moisture control, aeration systems, and quality testing facilities.',
      location: {
        address: 'Sector 15, Industrial Area, Noida',
        city: 'Delhi',
        state: 'Delhi',
        pincode: '110001',
        coordinates: {
          type: 'Point',
          coordinates: [77.1025, 28.7041]
        }
      },
      capacity: {
        total: 3000,
        available: 2500,
        unit: 'tons'
      },
      storageTypes: ['grain_storage', 'dry_storage', 'ambient'],
      facilities: ['security', 'cctv', 'fire_safety', 'loading_dock', 'forklift', 'pest_control', 'insurance'],
      pricing: {
        basePrice: 350,
        currency: 'INR',
        pricePerUnit: 'per_ton',
        minimumDays: 5,
        maximumDays: 180
      },
      contact: {
        phone: '+91-9876543212',
        email: 'delhi@grainstorage.com',
        alternatePhone: '+91-9876543213'
      },
      owner: owners[1]._id,
      status: 'active',
      verification: {
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: owners[1]._id
      },
      rating: {
        average: 4.2,
        count: 18
      },
      isAvailable: true,
      terms: {
        minimumBookingDuration: 5,
        maximumBookingDuration: 180,
        advanceBookingDays: 15,
        cancellationPolicy: 'flexible'
      }
    },
    {
      name: 'Bangalore Premium Storage',
      description: 'Premium storage facility in Bangalore with controlled atmosphere storage for fruits and vegetables. Features include ethylene control, humidity management, and advanced monitoring systems.',
      location: {
        address: 'Whitefield Industrial Area, Phase 2',
        city: 'Bangalore',
        state: 'Karnataka',
        pincode: '560066',
        coordinates: {
          type: 'Point',
          coordinates: [77.7500, 12.9716]
        }
      },
      capacity: {
        total: 800,
        available: 600,
        unit: 'tons'
      },
      storageTypes: ['controlled_atmosphere', 'cold_storage', 'refrigerated'],
      facilities: ['temperature_control', 'humidity_control', 'security', 'cctv', 'fire_safety', 'loading_dock', 'forklift', 'pest_control', 'insurance'],
      pricing: {
        basePrice: 1200,
        currency: 'INR',
        pricePerUnit: 'per_ton',
        minimumDays: 10,
        maximumDays: 365
      },
      contact: {
        phone: '+91-9876543214',
        email: 'bangalore@premiumstorage.com',
        alternatePhone: '+91-9876543215'
      },
      owner: owners[2]._id,
      status: 'active',
      verification: {
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: owners[2]._id
      },
      rating: {
        average: 4.8,
        count: 31
      },
      isAvailable: true,
      terms: {
        minimumBookingDuration: 10,
        maximumBookingDuration: 365,
        advanceBookingDays: 45,
        cancellationPolicy: 'strict'
      }
    },
    {
      name: 'Chennai Agri Storage',
      description: 'Comprehensive agricultural storage facility in Chennai with multiple storage options. Suitable for various crops including rice, cotton, spices, and processed foods. Features modern handling equipment and quality control systems.',
      location: {
        address: 'Ambattur Industrial Estate, Phase 1',
        city: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600058',
        coordinates: {
          type: 'Point',
          coordinates: [80.2319, 13.0827]
        }
      },
      capacity: {
        total: 2200,
        available: 1800,
        unit: 'tons'
      },
      storageTypes: ['dry_storage', 'grain_storage', 'ambient'],
      facilities: ['security', 'cctv', 'fire_safety', 'loading_dock', 'forklift', 'pest_control', 'insurance'],
      pricing: {
        basePrice: 400,
        currency: 'INR',
        pricePerUnit: 'per_ton',
        minimumDays: 7,
        maximumDays: 200
      },
      contact: {
        phone: '+91-9876543216',
        email: 'chennai@agristorage.com',
        alternatePhone: '+91-9876543217'
      },
      owner: owners[3]._id,
      status: 'active',
      verification: {
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: owners[3]._id
      },
      rating: {
        average: 4.3,
        count: 25
      },
      isAvailable: true,
      terms: {
        minimumBookingDuration: 7,
        maximumBookingDuration: 200,
        advanceBookingDays: 20,
        cancellationPolicy: 'moderate'
      }
    },
    {
      name: 'Hyderabad Cold Chain Facility',
      description: 'Advanced cold chain facility in Hyderabad specializing in pharmaceutical and food grade storage. Features include temperature mapping, validation services, and compliance with international standards.',
      location: {
        address: 'HITEC City, Cyberabad',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
        coordinates: {
          type: 'Point',
          coordinates: [78.4867, 17.3850]
        }
      },
      capacity: {
        total: 600,
        available: 450,
        unit: 'tons'
      },
      storageTypes: ['cold_storage', 'frozen', 'refrigerated'],
      facilities: ['temperature_control', 'humidity_control', 'security', 'cctv', 'fire_safety', 'loading_dock', 'forklift', 'pest_control', 'insurance'],
      pricing: {
        basePrice: 1000,
        currency: 'INR',
        pricePerUnit: 'per_ton',
        minimumDays: 15,
        maximumDays: 365
      },
      contact: {
        phone: '+91-9876543218',
        email: 'hyderabad@coldchain.com',
        alternatePhone: '+91-9876543219'
      },
      owner: owners[4]._id,
      status: 'active',
      verification: {
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: owners[4]._id
      },
      rating: {
        average: 4.7,
        count: 19
      },
      isAvailable: true,
      terms: {
        minimumBookingDuration: 15,
        maximumBookingDuration: 365,
        advanceBookingDays: 60,
        cancellationPolicy: 'strict'
      }
    },
    {
      name: 'Pune Modern Storage',
      description: 'Modern storage facility in Pune with automated systems and IoT monitoring. Suitable for various agricultural products with real-time tracking and quality monitoring capabilities.',
      location: {
        address: 'Chakan Industrial Area, Phase 3',
        city: 'Pune',
        state: 'Maharashtra',
        pincode: '410501',
        coordinates: {
          type: 'Point',
          coordinates: [73.8567, 18.5204]
        }
      },
      capacity: {
        total: 1800,
        available: 1400,
        unit: 'tons'
      },
      storageTypes: ['dry_storage', 'grain_storage', 'ambient'],
      facilities: ['security', 'cctv', 'fire_safety', 'loading_dock', 'forklift', 'pest_control', 'insurance'],
      pricing: {
        basePrice: 450,
        currency: 'INR',
        pricePerUnit: 'per_ton',
        minimumDays: 5,
        maximumDays: 150
      },
      contact: {
        phone: '+91-9876543220',
        email: 'pune@modernstorage.com',
        alternatePhone: '+91-9876543221'
      },
      owner: owners[0]._id,
      status: 'active',
      verification: {
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: owners[0]._id
      },
      rating: {
        average: 4.4,
        count: 22
      },
      isAvailable: true,
      terms: {
        minimumBookingDuration: 5,
        maximumBookingDuration: 150,
        advanceBookingDays: 25,
        cancellationPolicy: 'flexible'
      }
    },
    {
      name: 'Kolkata Grain Terminal',
      description: 'Large grain terminal in Kolkata with rail and road connectivity. Specializes in rice, wheat, and pulses storage with modern handling equipment and quality testing facilities.',
      location: {
        address: 'Salt Lake Sector V, Industrial Area',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700091',
        coordinates: {
          type: 'Point',
          coordinates: [88.3639, 22.5726]
        }
      },
      capacity: {
        total: 2500,
        available: 2000,
        unit: 'tons'
      },
      storageTypes: ['grain_storage', 'dry_storage', 'ambient'],
      facilities: ['security', 'cctv', 'fire_safety', 'loading_dock', 'forklift', 'pest_control', 'insurance'],
      pricing: {
        basePrice: 320,
        currency: 'INR',
        pricePerUnit: 'per_ton',
        minimumDays: 7,
        maximumDays: 120
      },
      contact: {
        phone: '+91-9876543222',
        email: 'kolkata@grainterminal.com',
        alternatePhone: '+91-9876543223'
      },
      owner: owners[1]._id,
      status: 'active',
      verification: {
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: owners[1]._id
      },
      rating: {
        average: 4.1,
        count: 16
      },
      isAvailable: true,
      terms: {
        minimumBookingDuration: 7,
        maximumBookingDuration: 120,
        advanceBookingDays: 20,
        cancellationPolicy: 'moderate'
      }
    },
    {
      name: 'Ahmedabad Cold Storage',
      description: 'Specialized cold storage facility in Ahmedabad for dairy products, fruits, and vegetables. Features include blast freezing, temperature-controlled zones, and HACCP compliance.',
      location: {
        address: 'Vatva Industrial Estate, Phase 2',
        city: 'Ahmedabad',
        state: 'Gujarat',
        pincode: '382445',
        coordinates: {
          type: 'Point',
          coordinates: [72.5714, 23.0225]
        }
      },
      capacity: {
        total: 900,
        available: 700,
        unit: 'tons'
      },
      storageTypes: ['cold_storage', 'frozen', 'refrigerated'],
      facilities: ['temperature_control', 'humidity_control', 'security', 'cctv', 'fire_safety', 'loading_dock', 'forklift', 'pest_control', 'insurance'],
      pricing: {
        basePrice: 750,
        currency: 'INR',
        pricePerUnit: 'per_ton',
        minimumDays: 10,
        maximumDays: 300
      },
      contact: {
        phone: '+91-9876543224',
        email: 'ahmedabad@coldstorage.com',
        alternatePhone: '+91-9876543225'
      },
      owner: owners[2]._id,
      status: 'active',
      verification: {
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: owners[2]._id
      },
      rating: {
        average: 4.6,
        count: 28
      },
      isAvailable: true,
      terms: {
        minimumBookingDuration: 10,
        maximumBookingDuration: 300,
        advanceBookingDays: 35,
        cancellationPolicy: 'moderate'
      }
    },
    {
      name: 'Jaipur Agri Hub',
      description: 'Comprehensive agricultural hub in Jaipur with multiple storage options for various crops. Features include modern handling equipment, quality testing, and export facilitation services.',
      location: {
        address: 'Sitapura Industrial Area, Phase 1',
        city: 'Jaipur',
        state: 'Rajasthan',
        pincode: '302022',
        coordinates: {
          type: 'Point',
          coordinates: [75.7873, 26.9124]
        }
      },
      capacity: {
        total: 1600,
        available: 1200,
        unit: 'tons'
      },
      storageTypes: ['dry_storage', 'grain_storage', 'ambient'],
      facilities: ['security', 'cctv', 'fire_safety', 'loading_dock', 'forklift', 'pest_control', 'insurance'],
      pricing: {
        basePrice: 380,
        currency: 'INR',
        pricePerUnit: 'per_ton',
        minimumDays: 5,
        maximumDays: 180
      },
      contact: {
        phone: '+91-9876543226',
        email: 'jaipur@agrihub.com',
        alternatePhone: '+91-9876543227'
      },
      owner: owners[3]._id,
      status: 'active',
      verification: {
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: owners[3]._id
      },
      rating: {
        average: 4.2,
        count: 20
      },
      isAvailable: true,
      terms: {
        minimumBookingDuration: 5,
        maximumBookingDuration: 180,
        advanceBookingDays: 15,
        cancellationPolicy: 'flexible'
      }
    },
    {
      name: 'Kochi Spice Storage',
      description: 'Specialized storage facility in Kochi for spices, tea, and coffee. Features include humidity-controlled storage, quality testing labs, and export documentation services.',
      location: {
        address: 'Kakkanad Industrial Area, Phase 2',
        city: 'Kochi',
        state: 'Kerala',
        pincode: '682030',
        coordinates: {
          type: 'Point',
          coordinates: [76.2673, 9.9312]
        }
      },
      capacity: {
        total: 700,
        available: 550,
        unit: 'tons'
      },
      storageTypes: ['dry_storage', 'ambient', 'controlled_atmosphere'],
      facilities: ['humidity_control', 'security', 'cctv', 'fire_safety', 'loading_dock', 'forklift', 'pest_control', 'insurance'],
      pricing: {
        basePrice: 600,
        currency: 'INR',
        pricePerUnit: 'per_ton',
        minimumDays: 7,
        maximumDays: 250
      },
      contact: {
        phone: '+91-9876543228',
        email: 'kochi@spicestorage.com',
        alternatePhone: '+91-9876543229'
      },
      owner: owners[4]._id,
      status: 'active',
      verification: {
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: owners[4]._id
      },
      rating: {
        average: 4.5,
        count: 24
      },
      isAvailable: true,
      terms: {
        minimumBookingDuration: 7,
        maximumBookingDuration: 250,
        advanceBookingDays: 30,
        cancellationPolicy: 'moderate'
      }
    }
  ];

  const createdWarehouses = [];
  for (const warehouseData of warehouses) {
    const existingWarehouse = await Warehouse.findOne({ name: warehouseData.name });
    if (!existingWarehouse) {
      const warehouse = new Warehouse(warehouseData);
      await warehouse.save();
      createdWarehouses.push(warehouse);
      console.log(`✅ Warehouse created: ${warehouseData.name}`);
    } else {
      console.log(`ℹ️  Warehouse already exists: ${warehouseData.name}`);
      createdWarehouses.push(existingWarehouse);
    }
  }
  return createdWarehouses;
}

async function run() {
  try {
    await connectDB();
    console.log('✅ Connected to database');

    console.log('\n🏭 Creating warehouse owners...');
    const owners = await createWarehouseOwners();

    console.log('\n🏪 Creating warehouses...');
    const warehouses = await createWarehouses(owners);

    console.log(`\n🎉 Successfully created ${warehouses.length} warehouses!`);
    console.log('\n📊 Summary:');
    warehouses.forEach((warehouse, index) => {
      console.log(`${index + 1}. ${warehouse.name} - ${warehouse.location.city}, ${warehouse.location.state}`);
      console.log(`   Capacity: ${warehouse.capacity.available}/${warehouse.capacity.total} ${warehouse.capacity.unit}`);
      console.log(`   Price: ₹${warehouse.pricing.basePrice}/${warehouse.pricing.unit}`);
      console.log(`   Storage Types: ${warehouse.storageTypes.join(', ')}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from database');
  }
}

run();
