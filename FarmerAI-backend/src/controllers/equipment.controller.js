const Equipment = require('../models/Equipment');
const logger = require('../utils/logger');

exports.create = async (req, res) => {
  try {
    const owner = req.user.id;
    const payload = { ...req.body, owner };
    if (!payload.title || !payload.type || !payload.mode) {
      return res.status(400).json({ success: false, message: 'title, type and mode are required' });
    }
    const doc = await Equipment.create(payload);
    res.status(201).json({ success: true, data: doc });
  } catch (error) {
    logger.error('Create equipment error', error);
    res.status(500).json({ success: false, message: 'Failed to create equipment' });
  }
};

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, mode, type, state, city, q, status = 'active' } = req.query;
    const filter = {};
    if (mode) filter.mode = mode;
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (state) filter['location.state'] = state;
    if (city) filter['location.city'] = city;
    if (q) filter.$or = [{ title: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      Equipment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Equipment.countDocuments(filter)
    ]);

    res.json({ success: true, data: { items, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), total } } });
  } catch (error) {
    logger.error('List equipment error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch equipment' });
  }
};

exports.getById = async (req, res) => {
  try {
    const item = await Equipment.findById(req.params.id).populate('owner', 'name photoURL farmerProfile.farmName');
    if (!item) return res.status(404).json({ success: false, message: 'Equipment not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    logger.error('Get equipment error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch equipment' });
  }
};

exports.update = async (req, res) => {
  try {
    const owner = req.user.id;
    const item = await Equipment.findOneAndUpdate({ _id: req.params.id, owner }, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Equipment not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    logger.error('Update equipment error', error);
    res.status(500).json({ success: false, message: 'Failed to update equipment' });
  }
};

exports.remove = async (req, res) => {
  try {
    const owner = req.user.id;
    const item = await Equipment.findOneAndDelete({ _id: req.params.id, owner });
    if (!item) return res.status(404).json({ success: false, message: 'Equipment not found' });
    res.json({ success: true, message: 'Equipment deleted' });
  } catch (error) {
    logger.error('Delete equipment error', error);
    res.status(500).json({ success: false, message: 'Failed to delete equipment' });
  }
};

exports.ownerInventory = async (req, res) => {
  try {
    const owner = req.params.userId || req.user.id;
    const items = await Equipment.find({ owner }).sort({ createdAt: -1 });
    res.json({ success: true, data: items });
  } catch (error) {
    logger.error('Owner inventory error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch inventory' });
  }
};
