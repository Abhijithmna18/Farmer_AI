// src/services/warehouse.service.js
const Warehouse = require('../models/Warehouse');

function buildPublicQuery(filters = {}) {
  const query = { status: 'active', 'verification.status': 'verified' };
  if (filters.search) {
    const searchRegex = new RegExp(filters.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { name: { $regex: searchRegex } },
      { description: { $regex: searchRegex } },
      { 'location.city': { $regex: searchRegex } },
      { 'location.state': { $regex: searchRegex } }
    ];
  }
  if (filters.storageTypes && filters.storageTypes.length) {
    query.storageTypes = { $in: filters.storageTypes };
  }
  if (filters.minPrice || filters.maxPrice) {
    query['pricing.basePrice'] = {};
    if (filters.minPrice) query['pricing.basePrice'].$gte = filters.minPrice;
    if (filters.maxPrice) query['pricing.basePrice'].$lte = filters.maxPrice;
  }
  return query;
}

async function listPublicWarehouses({ page = 1, limit = 12, sort = { createdAt: -1 }, filters = {} }) {
  const query = buildPublicQuery(filters);
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 12));

  const [data, total] = await Promise.all([
    Warehouse.find(query)
      .populate('owner', 'firstName lastName email phone warehouseOwnerProfile')
      .sort(sort)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean()
      .exec(),
    Warehouse.countDocuments(query).exec()
  ]);

  return { data, total, page: pageNum, limit: limitNum };
}

async function listAdminWarehouses({ page = 1, limit = 10, sort = { createdAt: -1 }, filters = {} }) {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (typeof filters.verified !== 'undefined') query['verification.status'] = filters.verified;

  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 10));

  const [data, total] = await Promise.all([
    Warehouse.find(query)
      .populate('owner', 'firstName lastName email phone')
      .sort(sort)
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum)
      .lean()
      .exec(),
    Warehouse.countDocuments(query).exec()
  ]);

  return { data, total, page: pageNum, limit: limitNum };
}

module.exports = { listPublicWarehouses, listAdminWarehouses, buildPublicQuery };
