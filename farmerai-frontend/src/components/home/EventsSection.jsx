import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Clock, ExternalLink } from 'lucide-react';
import apiClient from '../../services/apiClient';

export default function EventsSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const mockEvents = [
    {
      title: 'Soil Health Workshop',
      description: 'Learn soil testing and nutrient management basics.',
      dateTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Community Center, Kochi',
      imageUrl:
        '/Upcoming%20Events1.png',
      registrationLink: '/events',
    },
    {
      title: 'Irrigation Best Practices',
      description: 'Efficient water use techniques and scheduling.',
      dateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Agri Hall, Thrissur',
      imageUrl:
        '/Upcoming%20Events2.png',
      registrationLink: '/events',
    },
    {
      title: 'Organic Pest Control',
      description: 'Natural pest control methods for small farms.',
      dateTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'FarmerAI Campus, Palakkad',
      imageUrl:
        '/Upcoming%20Events3.png',
      registrationLink: '/events',
    },
  ];

  // Curated fallback images used when an event doesn't provide one
  const fallbackImages = [
    '/Upcoming%20Events1.png',
    '/Upcoming%20Events2.png',
    '/Upcoming%20Events3.png',
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
            imageUrl: fallbackImages[i % fallbackImages.length]
          }));
          setEvents(withImages);
        } else {
          setEvents(mockEvents);
        }
      } catch (e) {
        setError('Failed to load events');
        setEvents(mockEvents);
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
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Upcoming Events</h2>
          <a href="/events" className="text-green-600 hover:text-green-700 font-medium">View all</a>
        </div>
        {!events.length ? (
          <div className="text-center text-gray-500 py-10">No Upcoming Events</div>
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
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{ev.title}</h3>
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
