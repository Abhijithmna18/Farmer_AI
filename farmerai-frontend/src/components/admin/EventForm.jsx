import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Upload, X, Image as ImageIcon, Calendar, MapPin, Clock, Users, Link } from 'lucide-react';
import { toast } from 'react-hot-toast';

const schema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  location: yup.string().required('Location is required'),
  date: yup.string().required('Date is required'),
  time: yup.string().required('Time is required'),
  category: yup.string().required('Category is required'),
  maxAttendees: yup.number().min(1, 'Must be at least 1').optional(),
  registrationLink: yup.string().url('Must be a valid URL').nullable().optional(),
  imageUrl: yup.string().url('Must be a valid URL').nullable().optional(),
}).required();

export default function EventForm({ initialValues, onSubmit, onCancel, submitting }){
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: initialValues || {
      title: '', 
      description: '', 
      location: '', 
      date: '', 
      time: '', 
      category: 'training',
      maxAttendees: '',
      registrationLink: '', 
      imageUrl: ''
    }
  });

  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const watchedImageUrl = watch('imageUrl');

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
      if (initialValues.imageUrl) {
        setPreviewImage(initialValues.imageUrl);
      }
    }
  }, [initialValues, reset]);

  useEffect(() => {
    if (watchedImageUrl) {
      setPreviewImage(watchedImageUrl);
    }
  }, [watchedImageUrl]);

  const handleImageUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';
      const response = await fetch(`${apiBaseUrl}/upload/image`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setValue('imageUrl', data.url);
        setPreviewImage(data.url);
        toast.success('Image uploaded successfully');
      } else {
        // Fallback: Use a placeholder image URL
        const placeholderUrl = `https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=${encodeURIComponent(file.name)}`;
        setValue('imageUrl', placeholderUrl);
        setPreviewImage(placeholderUrl);
        toast.warning('Upload service unavailable. Using placeholder image. Please update with actual image URL.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      // Fallback: Use a placeholder image URL
      const placeholderUrl = `https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=${encodeURIComponent(file.name)}`;
      setValue('imageUrl', placeholderUrl);
      setPreviewImage(placeholderUrl);
      toast.warning('Upload service unavailable. Using placeholder image. Please update with actual image URL.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const removeImage = () => {
    setValue('imageUrl', '');
    setPreviewImage(null);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Event Details
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Event Title *</label>
            <input 
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Enter event title"
              {...register('title')} 
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Category *</label>
            <select 
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              {...register('category')}
            >
              <option value="training">Training</option>
              <option value="market">Market</option>
              <option value="community">Community</option>
              <option value="workshop">Workshop</option>
              <option value="conference">Conference</option>
            </select>
            {errors.category && <p className="text-red-600 text-sm mt-1">{errors.category.message}</p>}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Description *</label>
          <textarea 
            rows={4} 
            className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            placeholder="Describe the event details, agenda, and what participants will learn"
            {...register('description')} 
          />
          {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
        </div>
      </div>

      {/* Date, Time & Location */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          Schedule & Location
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date *</label>
            <input 
              type="date" 
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              {...register('date')} 
            />
            {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Time *</label>
            <input 
              type="time" 
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              {...register('time')} 
            />
            {errors.time && <p className="text-red-600 text-sm mt-1">{errors.time.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Attendees</label>
            <input 
              type="number" 
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="Optional"
              {...register('maxAttendees')} 
            />
            {errors.maxAttendees && <p className="text-red-600 text-sm mt-1">{errors.maxAttendees.message}</p>}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">Location *</label>
          <input 
            className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            placeholder="Enter event location or venue"
            {...register('location')} 
          />
          {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>}
        </div>
      </div>

      {/* Image Upload */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <ImageIcon className="w-5 h-5 mr-2" />
          Event Image
        </h3>
        
        <div className="space-y-4">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop an image here, or click to select
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
            >
              {uploading ? 'Uploading...' : 'Choose Image'}
            </label>
            <p className="text-xs text-gray-500 mt-2">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>

          {/* Image URL Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Or enter image URL</label>
            <input 
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="https://example.com/image.jpg"
              {...register('imageUrl')} 
            />
            {errors.imageUrl && <p className="text-red-600 text-sm mt-1">{errors.imageUrl.message}</p>}
          </div>

          {/* Preview */}
          {previewImage && (
            <div className="relative">
              <img 
                src={previewImage} 
                alt="Event preview" 
                className="w-full h-48 object-cover rounded-lg border"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Registration & Links */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Link className="w-5 h-5 mr-2" />
          Registration & Links
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Registration Link</label>
            <input 
              className="mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              placeholder="https://example.com/register"
              {...register('registrationLink')} 
            />
            {errors.registrationLink && <p className="text-red-600 text-sm mt-1">{errors.registrationLink.message}</p>}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={submitting || uploading} 
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Saving...' : 'Save Event'}
        </button>
      </div>
    </form>
  );
}