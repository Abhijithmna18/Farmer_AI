// scripts/seed-workshops.js
// Script to seed workshop data for testing
require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Workshop = require('../src/models/Workshop');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // Clear existing workshops
    await Workshop.deleteMany({});
    console.log('Cleared existing workshops');

    // Create mock workshops
    const workshops = [
      // Free workshops (3)
      {
        title: 'Introduction to Organic Farming',
        description: 'Learn the basics of organic farming practices and how to transition from conventional to organic methods.',
        thumbnail: '/Introduction to Organic Farming.png',
        videoUrl: 'https://youtu.be/EsyRd4WihUk?si=sLPLLu2zbxGFG_Ne', // Introduction to Organic Farming - YouTube tutorial
        duration: 45,
        category: 'beginner',
        level: 'beginner',
        isPremium: false,
        price: 0,
        tags: ['organic', 'beginner', 'introduction'],
        instructor: {
          name: 'Dr. Sarah Johnson',
          bio: 'Agricultural scientist with 15 years of experience in organic farming',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80'
        },
        learningOutcomes: [
          'Understand the principles of organic farming',
          'Learn about soil health and composting',
          'Identify organic pest control methods'
        ],
        prerequisites: [
          'Basic understanding of farming concepts'
        ],
        materials: [
          {
            name: 'Notebook and pen',
            description: 'For taking notes during the workshop'
          }
        ]
      },
      {
        title: 'Soil Testing Basics',
        description: 'Learn how to test your soil quality and understand the results to improve your crop yield.',
        thumbnail: 'public/soil testing basics.png',
        videoUrl: 'https://youtu.be/2xATIbYnUgM?si=aJMBrJ5vMkmvTIpt', // Soil Testing Basics - YouTube tutorial
        duration: 30,
        category: 'beginner',
        level: 'beginner',
        isPremium: false,
        price: 0,
        tags: ['soil', 'testing', 'beginner'],
        instructor: {
          name: 'Prof. Michael Chen',
          bio: 'Soil scientist with expertise in agricultural chemistry',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80'
        },
        learningOutcomes: [
          'Perform basic soil tests at home',
          'Interpret soil test results',
          'Recommend soil amendments based on test results'
        ],
        prerequisites: [
          'Access to soil samples',
          'Basic understanding of pH concept'
        ],
        materials: [
          {
            name: 'Soil test kit',
            description: 'Available at most garden centers'
          },
          {
            name: 'Measuring spoons',
            description: 'For accurate measurements'
          }
        ]
      },
      {
        title: 'Water Conservation Techniques',
        description: 'Discover effective water conservation methods for sustainable farming in drought-prone areas.',
        thumbnail: '/Water Conservation Techniques.png',
        videoUrl: 'https://youtu.be/gJmY3dzg3Gk?si=BgXptcRvd8UUmlWL', // Water Conservation Techniques - YouTube tutorial
        duration: 35,
        category: 'beginner',
        level: 'beginner',
        isPremium: false,
        price: 0,
        tags: ['water', 'conservation', 'sustainability'],
        instructor: {
          name: 'Dr. Priya Sharma',
          bio: 'Environmental scientist specializing in water resource management',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80'
        },
        learningOutcomes: [
          'Implement drip irrigation systems',
          'Create rainwater harvesting systems',
          'Reduce water waste in farming operations'
        ],
        prerequisites: [
          'Basic understanding of irrigation systems'
        ],
        materials: [
          {
            name: 'Drip irrigation kit',
            description: 'Basic components for a small system'
          }
        ]
      },
      
      // Premium workshops (7)
      {
        title: 'Advanced Crop Rotation Strategies',
        description: 'Master advanced crop rotation techniques to maximize yield and soil health over multiple seasons.',
        thumbnail: '/Advanced Crop Rotation Strategies.png',
        videoUrl: 'https://youtu.be/B2y1XR5UYGo?si=8tdhGJVMzxDUzK_k', // Advanced Crop Rotation - YouTube tutorial
        duration: 60,
        category: 'advanced',
        level: 'advanced',
        isPremium: true,
        price: 299,
        tags: ['crop rotation', 'advanced', 'yield'],
        instructor: {
          name: 'Dr. Robert Williams',
          bio: 'Agronomist with 20 years of experience in crop management',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80'
        },
        learningOutcomes: [
          'Design multi-year crop rotation plans',
          'Maximize soil nutrient cycling',
          'Prevent pest and disease buildup'
        ],
        prerequisites: [
          'Intermediate knowledge of crop management',
          'Access to farm records from previous seasons'
        ],
        materials: [
          {
            name: 'Farm planning software access',
            description: 'Recommended but not required'
          }
        ]
      },
      {
        title: 'Precision Agriculture with Drones',
        description: 'Learn how to use drone technology for crop monitoring, spraying, and data collection.',
        thumbnail: '/Precision Agriculture with Drones.png',
        videoUrl: 'https://youtu.be/9YqEtlv_qXY?si=BkYEy7WtcObelClN', // Precision Agriculture with Drones - YouTube tutorial
        duration: 90,
        category: 'specialized',
        level: 'intermediate',
        isPremium: true,
        price: 599,
        tags: ['drones', 'technology', 'precision'],
        instructor: {
          name: 'James Rodriguez',
          bio: 'Agricultural technology specialist with expertise in drone applications',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80'
        },
        learningOutcomes: [
          'Operate agricultural drones safely',
          'Analyze multispectral imagery for crop health',
          'Plan precision spraying missions'
        ],
        prerequisites: [
          'Basic understanding of drone operation',
          'Access to a drone (recommended but not required)'
        ],
        materials: [
          {
            name: 'Drone simulator software',
            description: 'For practice flights (provided with subscription)'
          }
        ]
      },
      {
        title: 'Integrated Pest Management',
        description: 'Comprehensive guide to managing pests using biological, cultural, and chemical methods.',
        thumbnail: '/Integrated Pest Management.png',
        videoUrl: 'https://youtu.be/z2AMnP4nn2E?si=KF61c8PWt7go0v7p', // Placeholder
        duration: 75,
        category: 'intermediate',
        level: 'intermediate',
        isPremium: true,
        price: 399,
        tags: ['pest management', 'IPM', 'sustainability'],
        instructor: {
          name: 'Dr. Emily Foster',
          bio: 'Entomologist specializing in agricultural pest control',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80'
        },
        learningOutcomes: [
          'Identify common agricultural pests',
          'Implement biological control methods',
          'Reduce pesticide use while maintaining crop protection'
        ],
        prerequisites: [
          'Basic knowledge of plant biology',
          'Access to a microscope (recommended)'
        ],
        materials: [
          {
            name: 'Pest identification guide',
            description: 'Digital copy provided with workshop'
          }
        ]
      },
      {
        title: 'Greenhouse Management',
        description: 'Master the art of greenhouse cultivation for year-round production and climate control.',
        thumbnail: '/Greenhouse Management.png',
        videoUrl: 'https://youtu.be/eQSNKrigiOM?si=I3d0G-yeFrHTRLHH', // Placeholder
        duration: 80,
        category: 'specialized',
        level: 'intermediate',
        isPremium: true,
        price: 499,
        tags: ['greenhouse', 'climate control', 'year-round'],
        instructor: {
          name: 'Dr. Thomas Kim',
          bio: 'Horticulturist with expertise in controlled environment agriculture',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80'
        },
        learningOutcomes: [
          'Design efficient greenhouse layouts',
          'Manage temperature and humidity control systems',
          'Optimize crop production in controlled environments'
        ],
        prerequisites: [
          'Basic understanding of plant growth requirements',
          'Access to a greenhouse (recommended but not required)'
        ],
        materials: [
          {
            name: 'Greenhouse design templates',
            description: 'Digital resources provided with workshop'
          }
        ]
      },
      {
        title: 'Sustainable Livestock Management',
        description: 'Learn ethical and sustainable practices for raising livestock while maintaining profitability.',
        thumbnail: '/Sustainable Livestock Management.png',
        videoUrl: 'https://youtu.be/B0zKMQHc8ww?si=mJGAcFMARqcp_cKR', // Placeholder
        duration: 95,
        category: 'specialized',
        level: 'intermediate',
        isPremium: true,
        price: 549,
        tags: ['livestock', 'sustainability', 'ethics'],
        instructor: {
          name: 'Dr. Maria Gonzalez',
          bio: 'Veterinarian and livestock management expert',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80'
        },
        learningOutcomes: [
          'Implement rotational grazing systems',
          'Ensure animal welfare in farming operations',
          'Reduce environmental impact of livestock farming'
        ],
        prerequisites: [
          'Basic knowledge of animal husbandry',
          'Access to livestock (recommended but not required)'
        ],
        materials: [
          {
            name: 'Livestock management checklist',
            description: 'Digital resource provided with workshop'
          }
        ]
      },
      {
        title: 'Agri-Tourism Business Development',
        description: 'Turn your farm into a profitable agri-tourism destination with marketing and visitor management strategies.',
        thumbnail: '/Agri-Tourism Business Development.png',
        videoUrl: 'https://youtu.be/HRzFXkZ1cTA?si=gE7OMZ6YV4TIZQ32', // Placeholder
        duration: 70,
        category: 'specialized',
        level: 'intermediate',
        isPremium: true,
        price: 449,
        tags: ['agri-tourism', 'business', 'marketing'],
        instructor: {
          name: 'David Thompson',
          bio: 'Agri-tourism consultant with 12 years of experience',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80'
        },
        learningOutcomes: [
          'Develop agri-tourism business plans',
          'Create engaging visitor experiences',
          'Market your farm to tourists effectively'
        ],
        prerequisites: [
          'Ownership or management of a farm',
          'Basic business knowledge'
        ],
        materials: [
          {
            name: 'Agri-tourism business plan template',
            description: 'Digital resource provided with workshop'
          }
        ]
      },
      {
        title: 'Climate-Resilient Farming',
        description: 'Adapt your farming practices to climate change with resilient crop varieties and techniques.',
        thumbnail: '/Climate-Resilient Farming.png',
        videoUrl: 'https://youtu.be/6HmtTEZ2sEU?si=5E7bsAd8dyMsmW_j', // Placeholder
        duration: 85,
        category: 'advanced',
        level: 'advanced',
        isPremium: true,
        price: 699,
        tags: ['climate change', 'resilience', 'adaptation'],
        instructor: {
          name: 'Dr. Amanda Patel',
          bio: 'Climate scientist specializing in agricultural adaptation',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&q=80'
        },
        learningOutcomes: [
          'Select climate-resilient crop varieties',
          'Implement drought-resistant farming techniques',
          'Plan for extreme weather events'
        ],
        prerequisites: [
          'Advanced knowledge of crop management',
          'Access to historical weather data for your region'
        ],
        materials: [
          {
            name: 'Climate risk assessment toolkit',
            description: 'Digital resources provided with workshop'
          }
        ]
      }
    ];

    // Insert workshops
    await Workshop.insertMany(workshops);
    console.log('Successfully seeded workshops');

    // Display summary
    const freeCount = workshops.filter(w => !w.isPremium).length;
    const premiumCount = workshops.filter(w => w.isPremium).length;
    console.log(`\nWorkshop Summary:`);
    console.log(`- Free workshops: ${freeCount}`);
    console.log(`- Premium workshops: ${premiumCount}`);
    console.log(`- Total workshops: ${workshops.length}`);

  } catch (error) {
    console.error('Error seeding workshops:', error);
  } finally {
    mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
});