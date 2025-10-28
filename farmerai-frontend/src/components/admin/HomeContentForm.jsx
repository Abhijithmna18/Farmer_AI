import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';

const sections = [
  'hero-banner', 'featured-events', 'testimonials', 'stats', 'about', 'services'
];

export default function HomeContentForm({ editing, onSave, onClose, submitting }) {
  const [formData, setFormData] = useState({
    section: 'hero-banner',
    title: '',
    subtitle: '',
    description: '',
    link: '',
    linkText: '',
    displayOrder: 0,
    isActive: true,
    stats: [],
    testimonials: [],
    image: null
  });

  const [preview, setPreview] = useState(null);
  const [newStat, setNewStat] = useState({ label: '', value: '', icon: '' });
  const [newTestimonial, setNewTestimonial] = useState({ name: '', role: '', content: '', rating: 5 });

  useEffect(() => {
    if (editing) {
      setFormData({
        section: editing.section || 'hero-banner',
        title: editing.title || '',
        subtitle: editing.subtitle || '',
        description: editing.description || '',
        link: editing.link || '',
        linkText: editing.linkText || '',
        displayOrder: editing.displayOrder || 0,
        isActive: editing.isActive !== undefined ? editing.isActive : true,
        stats: editing.stats || [],
        testimonials: editing.testimonials || [],
        image: null
      });
      setPreview(editing.image?.url);
    }
  }, [editing]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const addStat = () => {
    if (newStat.label && newStat.value) {
      setFormData(prev => ({
        ...prev,
        stats: [...prev.stats, { ...newStat, value: parseInt(newStat.value) }]
      }));
      setNewStat({ label: '', value: '', icon: '' });
    }
  };

  const removeStat = (index) => {
    setFormData(prev => ({
      ...prev,
      stats: prev.stats.filter((_, i) => i !== index)
    }));
  };

  const addTestimonial = () => {
    if (newTestimonial.name && newTestimonial.content) {
      setFormData(prev => ({
        ...prev,
        testimonials: [...prev.testimonials, { ...newTestimonial }]
      }));
      setNewTestimonial({ name: '', role: '', content: '', rating: 5 });
    }
  };

  const removeTestimonial = (index) => {
    setFormData(prev => ({
      ...prev,
      testimonials: prev.testimonials.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold">
            {editing ? 'Edit Home Content Item' : 'Add Home Content Item'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {preview ? (
                <div className="space-y-4">
                  <img
                    src={preview}
                    alt="Preview"
                    className="mx-auto h-32 w-auto object-contain rounded"
                  />
                  <div className="flex justify-center">
                    <label className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Change Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div>
                    <label className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer flex items-center gap-2 mx-auto w-fit">
                      <Upload className="w-4 h-4" />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        required={!editing}
                      />
                    </label>
                    <p className="text-sm text-gray-500 mt-2">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Section *
            </label>
            <select
              name="section"
              value={formData.section}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sections.map(section => (
                <option key={section} value={section}>
                  {section.charAt(0).toUpperCase() + section.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subtitle
            </label>
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link URL
              </label>
              <input
                type="url"
                name="link"
                value={formData.link}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link Text
              </label>
              <input
                type="text"
                name="linkText"
                value={formData.linkText}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Display Order */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Order
            </label>
            <input
              type="number"
              name="displayOrder"
              value={formData.displayOrder}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Stats Section (for stats section) */}
          {formData.section === 'stats' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Statistics</h3>
              {formData.stats.map((stat, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg">{stat.icon}</span>
                  <span className="font-medium">{stat.label}:</span>
                  <span className="text-blue-600 font-bold">{stat.value}</span>
                  <button
                    type="button"
                    onClick={() => removeStat(index)}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Label"
                  value={newStat.label}
                  onChange={(e) => setNewStat(prev => ({ ...prev, label: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="number"
                  placeholder="Value"
                  value={newStat.value}
                  onChange={(e) => setNewStat(prev => ({ ...prev, value: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Icon (emoji)"
                  value={newStat.icon}
                  onChange={(e) => setNewStat(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={addStat}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Testimonials Section (for testimonials section) */}
          {formData.section === 'testimonials' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Testimonials</h3>
              {formData.testimonials.map((testimonial, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-medium">{testimonial.name}</span>
                      {testimonial.role && (
                        <span className="text-gray-600 ml-2">- {testimonial.role}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTestimonial(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{testimonial.content}</p>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span
                        key={i}
                        className={`text-yellow-400 ${
                          i < testimonial.rating ? 'text-yellow-500' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Name"
                  value={newTestimonial.name}
                  onChange={(e) => setNewTestimonial(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Role/Title"
                  value={newTestimonial.role}
                  onChange={(e) => setNewTestimonial(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <textarea
                  placeholder="Testimonial content"
                  value={newTestimonial.content}
                  onChange={(e) => setNewTestimonial(prev => ({ ...prev, content: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Rating:</span>
                  <select
                    value={newTestimonial.rating}
                    onChange={(e) => setNewTestimonial(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                    className="px-3 py-1 border border-gray-300 rounded"
                  >
                    {[1, 2, 3, 4, 5].map(rating => (
                      <option key={rating} value={rating}>{rating}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={addTestimonial}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-sm text-gray-700">
              Active (visible to users)
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : (editing ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}



