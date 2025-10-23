import React, { useState, useEffect } from 'react';
import apiClient from '../../services/apiClient';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    sku: '',
    name: '',
    description: '',
    category: '',
    supplier: '',
    cost: '',
    price: '',
    quantity: '',
    unit: 'kg',
    location: {
      warehouse: '',
      aisle: '',
      rack: '',
      bin: ''
    },
    reorderPoint: '',
    maxQuantity: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const categories = [
    'Seeds', 'Fertilizers', 'Pesticides', 'Tools', 'Equipment', 'Packaging', 'Other'
  ];

  const units = ['kg', 'tons', 'quintals', 'bags', 'pieces', 'liters', 'gallons'];

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      // Mock data for now - in real app, this would come from API
      const mockInventory = [
        {
          id: 1,
          sku: 'WHT-001',
          name: 'Wheat Seeds',
          description: 'High yield wheat seeds for winter season',
          category: 'Seeds',
          supplier: 'AgriCorp Ltd',
          cost: 150,
          price: 200,
          quantity: 500,
          unit: 'kg',
          location: { warehouse: 'A', aisle: '1', rack: 'A1', bin: 'B1' },
          reorderPoint: 100,
          maxQuantity: 1000,
          lastUpdated: new Date()
        },
        {
          id: 2,
          sku: 'FERT-002',
          name: 'NPK Fertilizer',
          description: 'Balanced NPK fertilizer 19-19-19',
          category: 'Fertilizers',
          supplier: 'Fertilizer Co',
          cost: 25,
          price: 35,
          quantity: 2000,
          unit: 'kg',
          location: { warehouse: 'A', aisle: '2', rack: 'B1', bin: 'B2' },
          reorderPoint: 500,
          maxQuantity: 3000,
          lastUpdated: new Date()
        },
        {
          id: 3,
          sku: 'PEST-003',
          name: 'Insecticide',
          description: 'Broad spectrum insecticide',
          category: 'Pesticides',
          supplier: 'CropCare Inc',
          cost: 80,
          price: 120,
          quantity: 50,
          unit: 'liters',
          location: { warehouse: 'B', aisle: '1', rack: 'C1', bin: 'C1' },
          reorderPoint: 20,
          maxQuantity: 200,
          lastUpdated: new Date()
        }
      ];
      setInventory(mockInventory);
    } catch (err) {
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!form.sku.trim()) errors.sku = 'SKU is required';
    if (!form.name.trim()) errors.name = 'Name is required';
    if (!form.category) errors.category = 'Category is required';
    if (!form.supplier.trim()) errors.supplier = 'Supplier is required';
    if (!form.cost || form.cost <= 0) errors.cost = 'Valid cost is required';
    if (!form.price || form.price <= 0) errors.price = 'Valid price is required';
    if (!form.quantity || form.quantity < 0) errors.quantity = 'Valid quantity is required';
    if (!form.location.warehouse) errors.warehouse = 'Warehouse location is required';
    if (!form.reorderPoint || form.reorderPoint < 0) errors.reorderPoint = 'Valid reorder point is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const itemData = {
        ...form,
        cost: parseFloat(form.cost),
        price: parseFloat(form.price),
        quantity: parseFloat(form.quantity),
        reorderPoint: parseFloat(form.reorderPoint),
        maxQuantity: parseFloat(form.maxQuantity) || null
      };

      if (editingItem) {
        // Update existing item
        setInventory(prev => prev.map(item => 
          item.id === editingItem.id ? { ...item, ...itemData } : item
        ));
      } else {
        // Add new item
        const newItem = {
          id: Date.now(),
          ...itemData,
          lastUpdated: new Date()
        };
        setInventory(prev => [newItem, ...prev]);
      }

      setShowAddForm(false);
      setEditingItem(null);
      setForm({
        sku: '',
        name: '',
        description: '',
        category: '',
        supplier: '',
        cost: '',
        price: '',
        quantity: '',
        unit: 'kg',
        location: { warehouse: '', aisle: '', rack: '', bin: '' },
        reorderPoint: '',
        maxQuantity: ''
      });
      setFormErrors({});
    } catch (err) {
      setError('Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setForm({
      sku: item.sku,
      name: item.name,
      description: item.description,
      category: item.category,
      supplier: item.supplier,
      cost: item.cost.toString(),
      price: item.price.toString(),
      quantity: item.quantity.toString(),
      unit: item.unit,
      location: { ...item.location },
      reorderPoint: item.reorderPoint.toString(),
      maxQuantity: item.maxQuantity?.toString() || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setInventory(prev => prev.filter(item => item.id !== id));
    }
  };

  const getStockStatus = (item) => {
    const percentage = (item.quantity / item.maxQuantity) * 100;
    if (item.quantity <= item.reorderPoint) return { status: 'low', color: 'text-red-600 bg-red-100' };
    if (percentage < 30) return { status: 'medium', color: 'text-yellow-600 bg-yellow-100' };
    return { status: 'good', color: 'text-green-600 bg-green-100' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage your warehouse inventory and stock levels</p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowAddForm(true);
          }}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
        >
          Add Item
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="SKU"
              required
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              error={formErrors.sku}
            />
            <Input
              label="Name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={formErrors.name}
            />
            <Select
              label="Category"
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              options={categories.map(cat => ({ value: cat, label: cat }))}
              error={formErrors.category}
            />
            <Input
              label="Supplier"
              required
              value={form.supplier}
              onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              error={formErrors.supplier}
            />
            <Input
              label="Cost (₹)"
              type="number"
              step="0.01"
              required
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              error={formErrors.cost}
            />
            <Input
              label="Price (₹)"
              type="number"
              step="0.01"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              error={formErrors.price}
            />
            <Input
              label="Quantity"
              type="number"
              step="0.01"
              required
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              error={formErrors.quantity}
            />
            <Select
              label="Unit"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              options={units.map(unit => ({ value: unit, label: unit }))}
            />
            <Input
              label="Reorder Point"
              type="number"
              step="0.01"
              required
              value={form.reorderPoint}
              onChange={(e) => setForm({ ...form, reorderPoint: e.target.value })}
              error={formErrors.reorderPoint}
            />
            <Input
              label="Max Quantity"
              type="number"
              step="0.01"
              value={form.maxQuantity}
              onChange={(e) => setForm({ ...form, maxQuantity: e.target.value })}
            />
            <Textarea
              label="Description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="md:col-span-2 lg:col-span-3">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Location</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Input
                  label="Warehouse"
                  value={form.location.warehouse}
                  onChange={(e) => setForm({ 
                    ...form, 
                    location: { ...form.location, warehouse: e.target.value }
                  })}
                  error={formErrors.warehouse}
                />
                <Input
                  label="Aisle"
                  value={form.location.aisle}
                  onChange={(e) => setForm({ 
                    ...form, 
                    location: { ...form.location, aisle: e.target.value }
                  })}
                />
                <Input
                  label="Rack"
                  value={form.location.rack}
                  onChange={(e) => setForm({ 
                    ...form, 
                    location: { ...form.location, rack: e.target.value }
                  })}
                />
                <Input
                  label="Bin"
                  value={form.location.bin}
                  onChange={(e) => setForm({ 
                    ...form, 
                    location: { ...form.location, bin: e.target.value }
                  })}
                />
              </div>
            </div>
            <div className="md:col-span-2 lg:col-span-3 flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : (editingItem ? 'Update' : 'Add')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingItem(null);
                  setForm({
                    sku: '',
                    name: '',
                    description: '',
                    category: '',
                    supplier: '',
                    cost: '',
                    price: '',
                    quantity: '',
                    unit: 'kg',
                    location: { warehouse: '', aisle: '', rack: '', bin: '' },
                    reorderPoint: '',
                    maxQuantity: ''
                  });
                  setFormErrors({});
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Inventory Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventory.map(item => {
                const stockStatus = getStockStatus(item);
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.sku}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.supplier}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-900">
                          {item.quantity} {item.unit}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded-full ${stockStatus.color}`}>
                          {stockStatus.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.location.warehouse}-{item.location.aisle}-{item.location.rack}-{item.location.bin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{item.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-emerald-600 hover:text-emerald-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Input({ label, error, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function Select({ label, options, error, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
        {...props}
      >
        <option value="">Select {label}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function Textarea({ label, error, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <textarea
        rows={3}
        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 ${
          error ? 'border-red-300' : 'border-gray-300'
        }`}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}



