// src/controllers/owner.controller.js
const Warehouse = require('../models/Warehouse');
const Booking = require('../models/Booking');

/**
 * GET /api/owner/dashboard
 * Summary stats for the logged-in warehouse owner
 */
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('=== OWNER DASHBOARD STATS CALLED ===');
    console.log('User:', req.user);
    const ownerId = req.user.id || req.user._id;
    console.log('Owner ID:', ownerId);

    const [totalWarehouses, activeBookings, monthlyEarningsAgg] = await Promise.all([
      Warehouse.countDocuments({ owner: ownerId }),
      Booking.countDocuments({ warehouseOwner: ownerId, status: { $in: ['approved', 'paid'] } }),
      Booking.aggregate([
        { $match: { warehouseOwner: req.user._id, 'payment.status': 'paid', createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } },
        { $group: { _id: null, total: { $sum: '$pricing.ownerAmount' } } }
      ])
    ]);

    const monthlyEarnings = monthlyEarningsAgg?.[0]?.total || 0;

    // Placeholder occupancy: ratio of approved/paid bookings to warehouses (not exact without capacity mapping)
    const avgOccupancyPercent = totalWarehouses > 0 ? Math.min(100, Math.round((activeBookings / totalWarehouses) * 100)) : 0;

    return res.json({
      success: true,
      data: {
        totalWarehouses,
        activeBookings,
        monthlyEarnings,
        avgOccupancyPercent
      }
    });
  } catch (error) {
    console.error('Owner dashboard stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch owner dashboard stats' });
  }
};

/**
 * GET /api/owner/customers
 * List unique farmers (customers) who booked this owner's warehouses
 */
exports.getCustomers = async (req, res) => {
  try {
    const ownerId = req.user.id || req.user._id;
    const customers = await Booking.aggregate([
      { $match: { warehouseOwner: req.user._id || ownerId } },
      { $group: { _id: '$farmer', lastBookingAt: { $max: '$createdAt' }, bookings: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'farmer' } },
      { $unwind: '$farmer' },
      { $project: { _id: 0, farmerId: '$farmer._id', name: { $concat: [{ $ifNull: ['$farmer.firstName', ''] }, ' ', { $ifNull: ['$farmer.lastName', ''] }] }, email: '$farmer.email', phone: '$farmer.phone', bookings: 1, lastBookingAt: 1 } },
      { $sort: { lastBookingAt: -1 } }
    ]);

    return res.json({ success: true, data: customers });
  } catch (error) {
    console.error('Owner customers list error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch customers' });
  }
};


