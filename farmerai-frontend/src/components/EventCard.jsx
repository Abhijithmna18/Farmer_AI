import React, { useState } from 'react';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { registerEvent } from '../services/eventService'; // Import registerEvent
import Toast from './Toast';

const EventCard = ({ event }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventId: event.id,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Name is required.');
      return;
    }
    if (!formData.email) {
      setError('Email is required.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Invalid email format.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await registerEvent(formData); // Use registerEvent
      setToast({ type: 'success', message: response.message || "✅ Registered successfully! Confirmation email sent." });
      setIsModalOpen(false);
      // Clear form after successful registration
      setFormData({
        name: '',
        email: '',
        phone: '',
        eventId: event.id, // Keep eventId
      });
    } catch (err) {
      setToast({ type: 'error', message: err.message || "⚠️ Registration failed. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusColors = {
    upcoming: 'border-blue-500',
    ongoing: 'border-green-500',
    past: 'border-gray-500',
  };

  return (
    <>
      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
      <div className={`bg-white/10 backdrop-blur-lg border ${statusColors[event.status]} rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform duration-300 flex flex-col`}>
        <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Calendar size={16} />
          <span>{event.date}</span>
          <Clock size={16} />
          <span>{event.time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <MapPin size={16} />
          <span>{event.location}</span>
        </div>
        <p className="text-gray-700 flex-grow">{event.description}</p>
        <div className="mt-6">
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={event.status === 'past'}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition disabled:bg-gray-400"
          >
            {event.status === 'past' ? 'Event Over' : 'Register Now'}
          </button>
        </div>

        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
                <form onSubmit={handleSubmit}>
                  <h4 className="text-2xl font-bold mb-4">Register for {event.title}</h4>
                  {error && <p className="text-red-500 mb-4">{error}</p>}
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                      <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="mt-1 w-full p-3 border rounded-lg" required />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                      <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} className="mt-1 w-full p-3 border rounded-lg" required />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
                      <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} className="mt-1 w-full p-3 border rounded-lg" />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400">
                      {isSubmitting ? 'Submitting...' : 'Confirm Registration'}
                    </button>
                  </div>
                </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default EventCard;
