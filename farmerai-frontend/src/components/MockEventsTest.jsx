// Test component to display all mock events
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, ExternalLink, Star } from 'lucide-react';

const MockEventsTest = () => {
  const mockEvents = [
    {
      _id: 'mock-1',
      title: 'Sustainable Farming Workshop',
      description: 'Learn modern sustainable farming techniques, organic crop management, and eco-friendly practices from industry experts.',
      dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Agricultural Research Center, Bangalore',
      category: 'training',
      imageUrl: '/Upcoming%20Events1.png',
      registrationLink: '/events',
      featured: true
    },
    {
      _id: 'mock-2',
      title: 'Farmers Market & Networking',
      description: 'Connect with fellow farmers, showcase your produce, and learn about market trends and pricing strategies.',
      dateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Community Hall, Pune',
      category: 'market',
      imageUrl: '/Upcoming%20Events2.png',
      registrationLink: '/events'
    },
    {
      _id: 'mock-3',
      title: 'Crop Disease Management Seminar',
      description: 'Expert-led session on identifying, preventing, and treating common crop diseases using natural and chemical methods.',
      dateTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Krishi Vigyan Kendra, Hyderabad',
      category: 'training',
      imageUrl: '/Upcoming%20Events3.png',
      registrationLink: '/events'
    },
    {
      _id: 'mock-4',
      title: 'Organic Certification Workshop',
      description: 'Complete guide to organic certification process, documentation requirements, and maintaining organic standards.',
      dateTime: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Organic Farming Institute, Chennai',
      category: 'training',
      imageUrl: '/Upcoming%20Events1.png',
      registrationLink: '/events'
    },
    {
      _id: 'mock-5',
      title: 'Farm Technology Expo',
      description: 'Explore latest agricultural technologies, smart farming solutions, and innovative equipment for modern farming.',
      dateTime: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'International Convention Center, Delhi',
      category: 'exhibition',
      imageUrl: '/Upcoming%20Events2.png',
      registrationLink: '/events'
    },
    {
      _id: 'mock-6',
      title: 'Women in Agriculture Summit',
      description: 'Empowering women farmers with knowledge, resources, and networking opportunities in modern agriculture.',
      dateTime: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Women\'s Development Center, Mumbai',
      category: 'community',
      imageUrl: '/Upcoming%20Events3.png',
      registrationLink: '/events'
    }
  ];

  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          All Mock Events (Test View)
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockEvents.map((ev, idx) => (
            <motion.div
              key={ev._id}
              className="block bg-white rounded-xl shadow hover:shadow-lg transition-shadow overflow-hidden group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <div className="h-40 bg-gray-100 overflow-hidden">
                <img
                  src={ev.imageUrl}
                  alt={ev.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{ev.title}</h3>
                  {ev.featured && (
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{ev.description}</p>
                <div className="pt-2 space-y-2 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" /> 
                    {new Date(ev.dateTime).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" /> 
                    {new Date(ev.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" /> 
                    {ev.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                      {ev.category}
                    </span>
                  </div>
                </div>
                <div className="pt-3">
                  <span className="inline-flex items-center gap-1 text-green-600 font-medium group-hover:gap-2 transition-all">
                    Learn More <ExternalLink className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MockEventsTest;

