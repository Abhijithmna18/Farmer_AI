import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  location: yup.string().required('Location is required'),
  date: yup.string().required('Date is required'),
  time: yup.string().required('Time is required'),
  registrationLink: yup.string().url('Must be a valid URL').nullable().optional(),
  imageUrl: yup.string().url('Must be a valid URL').nullable().optional(),
}).required();

export default function EventForm({ initialValues, onSubmit, onCancel, submitting }){
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: initialValues || {
      title: '', description: '', location: '', date: '', time: '', registrationLink: '', imageUrl: ''
    }
  });

  useEffect(() => {
    if (initialValues) {
      reset(initialValues);
    }
  }, [initialValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input className="mt-1 w-full border rounded-lg px-3 py-2" {...register('title')} />
          {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Location</label>
          <input className="mt-1 w-full border rounded-lg px-3 py-2" {...register('location')} />
          {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea rows={4} className="mt-1 w-full border rounded-lg px-3 py-2" {...register('description')} />
        {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input type="date" className="mt-1 w-full border rounded-lg px-3 py-2" {...register('date')} />
          {errors.date && <p className="text-red-600 text-sm mt-1">{errors.date.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Time</label>
          <input type="time" className="mt-1 w-full border rounded-lg px-3 py-2" {...register('time')} />
          {errors.time && <p className="text-red-600 text-sm mt-1">{errors.time.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Image URL</label>
          <input className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="https://..." {...register('imageUrl')} />
          {errors.imageUrl && <p className="text-red-600 text-sm mt-1">{errors.imageUrl.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Registration Link</label>
          <input className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="https://..." {...register('registrationLink')} />
          {errors.registrationLink && <p className="text-red-600 text-sm mt-1">{errors.registrationLink.message}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border">Cancel</button>
        <button type="submit" disabled={submitting} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50">
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
}
