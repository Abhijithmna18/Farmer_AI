import React, { useState } from 'react';
import InputField from './InputField';
import { hostEvent } from '../services/eventService';
import Modal from './Modal.jsx';

const HostEventForm = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    dateTime: '',
    location: '',
    description: '',
    farmerName: '',
    farmerEmail: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title) errors.title = 'Event Title is required.';
    if (!formData.dateTime) errors.dateTime = 'Event Date & Time is required.';
    if (!formData.location) errors.location = 'Event Location is required.';
    if (!formData.description) errors.description = 'Event Description is required.';
    if (!formData.farmerName) errors.farmerName = 'Farmer Name is required.';
    if (!formData.farmerEmail) {
      errors.farmerEmail = 'Farmer Email is required.';
    } else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.farmerEmail)) {
      errors.farmerEmail = 'Invalid email format.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        await hostEvent(formData);
        onSuccess('✅ Event submitted! Please check your email for verification.');
        onClose();
        setFormData({
          title: '',
          dateTime: '',
          location: '',
          description: '',
          farmerName: '',
          farmerEmail: '',
        });
      } catch (error) {
        onSuccess(error.message || 'Failed to submit event.', 'error');
      }
    }
  };

  return (
    <Modal onClose={onClose} title="Host a New Event">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField
          label="Event Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          error={formErrors.title}
        />
        <InputField
          label="Event Date & Time"
          name="dateTime"
          type="datetime-local"
          value={formData.dateTime}
          onChange={handleChange}
          error={formErrors.dateTime}
        />
        <InputField
          label="Event Location"
          name="location"
          value={formData.location}
          onChange={handleChange}
          error={formErrors.location}
        />
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Event Description</label>
          <textarea
            id="description"
            name="description"
            rows="4"
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
          ></textarea>
          {formErrors.description && <p className="mt-1 text-sm text-red-600">{formErrors.description}</p>}
        </div>
        <InputField
          label="Farmer Name"
          name="farmerName"
          value={formData.farmerName}
          onChange={handleChange}
          error={formErrors.farmerName}
        />
        <InputField
          label="Farmer Email"
          name="farmerEmail"
          type="email"
          value={formData.farmerEmail}
          onChange={handleChange}
          error={formErrors.farmerEmail}
        />
        <button
          type="submit"
          className="w-full px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Submit Event
        </button>
      </form>
    </Modal>
  );
};

export default HostEventForm;
