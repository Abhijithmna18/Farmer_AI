const SoilRecord = require('../models/SoilRecord');
const logger = require('../utils/logger');

exports.create = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = { ...req.body, user: userId };

    if (!data.sampleDate) {
      return res.status(400).json({ success: false, message: 'sampleDate is required' });
    }

    const record = await SoilRecord.create(data);
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    logger.error('Create soil record error', error);
    res.status(500).json({ success: false, message: 'Failed to create soil record' });
  }
};

exports.list = async (req, res) => {
  try {
    const userId = req.user.id;
    const { from, to, state, district, phMin, phMax, page = 1, limit = 20 } = req.query;

    const filter = { user: userId };
    if (from || to) {
      filter.sampleDate = {};
      if (from) filter.sampleDate.$gte = new Date(from);
      if (to) filter.sampleDate.$lte = new Date(to);
    }
    if (state) filter['location.state'] = state;
    if (district) filter['location.district'] = district;
    if (phMin || phMax) {
      filter.ph = {};
      if (phMin) filter.ph.$gte = Number(phMin);
      if (phMax) filter.ph.$lte = Number(phMax);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      SoilRecord.find(filter).sort({ sampleDate: -1 }).skip(skip).limit(parseInt(limit)),
      SoilRecord.countDocuments(filter)
    ]);

    res.json({ success: true, data: { items, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), total } } });
  } catch (error) {
    logger.error('List soil records error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch soil records' });
  }
};

exports.getById = async (req, res) => {
  try {
    const userId = req.user.id;
    const record = await SoilRecord.findOne({ _id: req.params.id, user: userId });
    if (!record) return res.status(404).json({ success: false, message: 'Soil record not found' });
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('Get soil record error', error);
    res.status(500).json({ success: false, message: 'Failed to fetch soil record' });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = req.user.id;
    const record = await SoilRecord.findOneAndUpdate({ _id: req.params.id, user: userId }, req.body, { new: true, runValidators: true });
    if (!record) return res.status(404).json({ success: false, message: 'Soil record not found' });
    res.json({ success: true, data: record });
  } catch (error) {
    logger.error('Update soil record error', error);
    res.status(500).json({ success: false, message: 'Failed to update soil record' });
  }
};

exports.remove = async (req, res) => {
  try {
    const userId = req.user.id;
    const record = await SoilRecord.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!record) return res.status(404).json({ success: false, message: 'Soil record not found' });
    res.json({ success: true, message: 'Soil record deleted' });
  } catch (error) {
    logger.error('Delete soil record error', error);
    res.status(500).json({ success: false, message: 'Failed to delete soil record' });
  }
};
