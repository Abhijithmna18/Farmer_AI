import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  cropName: yup.string().required('Crop name is required'),
  variety: yup.string().nullable(),
  plantingDate: yup.string().required('Planting date is required'),
  estimatedHarvestDate: yup.string().nullable(),
  season: yup.string().nullable(),
  year: yup
    .number()
    .typeError('Year must be a number')
    .min(1900)
    .max(3000)
    .required('Year is required'),
  isActive: yup.boolean().required(),
  notes: yup.string().nullable(),
});

export default function GrowthCalendarForm({ calendar, mode = 'create', onSubmit, onCancel }) {
  const isView = mode === 'view';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      cropName: '',
      variety: '',
      plantingDate: '',
      estimatedHarvestDate: '',
      season: '',
      year: new Date().getFullYear(),
      isActive: true,
      notes: '',
    },
  });

  useEffect(() => {
    if (calendar && mode !== 'create') {
      reset({
        cropName: calendar.cropName || '',
        variety: calendar.variety || '',
        plantingDate: calendar.plantingDate ? new Date(calendar.plantingDate).toISOString().slice(0, 10) : '',
        estimatedHarvestDate: calendar.estimatedHarvestDate ? new Date(calendar.estimatedHarvestDate).toISOString().slice(0, 10) : '',
        season: calendar.season || '',
        year: calendar.year || new Date().getFullYear(),
        isActive: calendar.isActive !== undefined ? calendar.isActive : true,
        notes: calendar.notes || '',
      });
    }
  }, [calendar, mode, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Crop Name *</label>
          <input
            type="text"
            disabled={isView}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
            {...register('cropName')}
          />
          {errors.cropName && <p className="text-xs text-red-600 mt-1">{errors.cropName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Variety</label>
          <input
            type="text"
            disabled={isView}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
            {...register('variety')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Planting Date *</label>
          <input
            type="date"
            disabled={isView}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
            {...register('plantingDate')}
          />
          {errors.plantingDate && <p className="text-xs text-red-600 mt-1">{errors.plantingDate.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Harvest Date</label>
          <input
            type="date"
            disabled={isView}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
            {...register('estimatedHarvestDate')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Season</label>
          <input
            type="text"
            placeholder="e.g., 2025-spring"
            disabled={isView}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
            {...register('season')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
          <input
            type="number"
            disabled={isView}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
            {...register('year')}
          />
          {errors.year && <p className="text-xs text-red-600 mt-1">{errors.year.message}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            rows={3}
            disabled={isView}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100"
            {...register('notes')}
          />
        </div>
        <div className="md:col-span-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              disabled={isView}
              className="rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:bg-gray-100"
              {...register('isActive')}
            />
            <span className="ml-2 text-sm text-gray-700">Active</span>
          </label>
        </div>
      </div>

      {!isView ? (
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            {mode === 'create' ? 'Create' : 'Update'}
          </button>
        </div>
      ) : (
        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Close</button>
        </div>
      )}
    </form>
  );
}
