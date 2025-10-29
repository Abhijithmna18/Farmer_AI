import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import apiClient from '../../services/apiClient';

export default function EventsSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Curated fallback images used when an event doesn't provide one
  const fallbackImages = [
    '/Upcoming%20Events1.png',
    '/Upcoming%20Events2.png',
    '/Upcoming%20Events3.png',
  ];

  // Mock data for upcoming events
  const mockEvents = [
    {
      _id: 'mock-1',
      title: 'Sustainable Farming Workshop',
      description: 'Learn modern sustainable farming techniques, organic crop management, and eco-friendly practices from industry experts.',
      dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
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
      dateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
      location: 'Community Hall, Pune',
      category: 'market',
      imageUrl: '/Upcoming%20Events2.png',
      registrationLink: '/events'
    },
    {
      _id: 'mock-3',
      title: 'Crop Disease Management Seminar',
      description: 'Expert-led session on identifying, preventing, and treating common crop diseases using natural and chemical methods.',
      dateTime: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(), // 21 days from now
      location: 'Krishi Vigyan Kendra, Hyderabad',
      category: 'training',
      imageUrl: '/Upcoming%20Events3.png',
      registrationLink: '/events'
    },
    {
      _id: 'mock-4',
      title: 'Organic Certification Workshop',
      description: 'Complete guide to organic certification process, documentation requirements, and maintaining organic standards.',
      dateTime: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString(), // 28 days from now
      location: 'Organic Farming Institute, Chennai',
      category: 'training',
      imageUrl: '/Upcoming%20Events1.png',
      registrationLink: '/events'
    },
    {
      _id: 'mock-5',
      title: 'Farm Technology Expo',
      description: 'Explore latest agricultural technologies, smart farming solutions, and innovative equipment for modern farming.',
      dateTime: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(), // 35 days from now
      location: 'International Convention Center, Delhi',
      category: 'exhibition',
      imageUrl: '/Upcoming%20Events2.png',
      registrationLink: '/events'
    },
    {
      _id: 'mock-6',
      title: 'Women in Agriculture Summit',
      description: 'Empowering women farmers with knowledge, resources, and networking opportunities in modern agriculture.',
      dateTime: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString(), // 42 days from now
      location: 'Women\'s Development Center, Mumbai',
      category: 'community',
      imageUrl: '/Upcoming%20Events3.png',
      registrationLink: '/events'
    }
  ];

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const now = new Date().toISOString();
        const { data } = await apiClient.get('/events', { params: { status: 'published', from: now, limit: 3 } });
        const list = Array.isArray(data?.events) ? data.events : (Array.isArray(data) ? data : []);
        if (list.length) {
          const withImages = list.slice(0, 3).map((e, i) => ({
            ...e,
            imageUrl: e.imageUrl || e.images?.[0]?.url || fallbackImages[i % fallbackImages.length]
          }));
          setEvents(withImages);
        } else {
          // Use mock data when no real events are available
          console.log('No events found, using mock data');
          setEvents(mockEvents.slice(0, 3)); // Show only first 3 events on home page
        }
      } catch (e) {
        console.log('API failed, using mock data:', e.message);
        setError('Using sample events');
        // Use mock data when API fails
        setEvents(mockEvents.slice(0, 3)); // Show only first 3 events on home page
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="grid md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-gray-100 h-64 animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Upcoming Events</h2>
            {error && (
              <p className="text-sm text-amber-600 mt-1">
                📋 Showing sample events - <a href="/events" className="underline hover:text-amber-700">View all events</a>
              </p>
            )}
          </div>
          <a href="/events" className="text-green-600 hover:text-green-700 font-medium">View all</a>
        </div>
        {!events.length ? (
          <div className="text-center text-gray-500 py-10">
            <div className="text-lg font-medium mb-2">No Upcoming Events</div>
            <div className="text-sm">Check back soon for new events!</div>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {events.map((ev, idx) => (
              <motion.a
                key={ev._id || idx}
                href={ev.registrationLink || '/events'}
                target={ev.registrationLink ? '_blank' : undefined}
                rel={ev.registrationLink ? 'noopener noreferrer' : undefined}
                className="block bg-white rounded-xl shadow hover:shadow-lg transition-shadow overflow-hidden group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="h-40 bg-gray-100 overflow-hidden">
                  <img
                    src={ev.images?.[0]?.url || ev.imageUrl || fallbackImages[idx % fallbackImages.length]}
                    alt={ev.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{ev.title}</h3>
                    {ev.featured && (
                      <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full font-medium">
                        Featured
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{ev.description}</p>
                  <div className="pt-2 space-y-2 text-sm text-gray-700">
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-gray-400" /> {new Date(ev.dateTime).toLocaleDateString()}</div>
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /> {new Date(ev.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> {ev.location}</div>
                  </div>
                  <div className="pt-3">
                    <span className="inline-flex items-center gap-1 text-green-600 font-medium group-hover:gap-2 transition-all">
                      Learn More <ExternalLink className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
