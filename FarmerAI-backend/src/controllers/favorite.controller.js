// src/controllers/favorite.controller.js
const Favorite = require('../models/Favorite');

exports.list = async (req, res) => {
  try {
    const items = await Favorite.find({ userId: req.user._id || req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: items });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to fetch favorites' });
  }
};

exports.toggle = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { crop, meta, source = 'ai' } = req.body || {};
    if (!crop) return res.status(400).json({ message: 'crop is required' });

    const found = await Favorite.findOne({ userId, crop });
    if (found) {
      await Favorite.deleteOne({ _id: found._id });
      return res.json({ success: true, data: { favorited: false } });
    }
    const created = await Favorite.create({ userId, crop, meta, source });
    return res.json({ success: true, data: { favorited: true, id: created._id } });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to toggle favorite' });
  }
};















