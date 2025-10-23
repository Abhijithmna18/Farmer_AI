// src/controllers/owner.controller.js
const Warehouse = require('../models/Warehouse');
const Booking = require('../models/Booking');

/**
 * GET /api/owner/dashboard
 * Comprehensive dashboard stats for the logged-in warehouse owner
 */
exports.getDashboardStats = async (req, res) => {
  try {
    console.log('=== OWNER DASHBOARD STATS CALLED ===');
    console.log('User:', req.user);
    const ownerId = req.user.id || req.user._id;
    console.log('Owner ID:', ownerId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalWarehouses,
      activeBookings,
      pendingBookings,
      rejectedBookings,
      monthlyEarningsAgg,
      weeklyEarningsAgg,
      yearlyEarningsAgg,
      totalEarningsAgg,
      occupancyData,
      recentBookings,
      topWarehouses,
      weeklyTrends
    ] = await Promise.all([
      // Basic counts
      Warehouse.countDocuments({ owner: ownerId }),
      Booking.countDocuments({ warehouseOwner: ownerId, status: { $in: ['approved', 'paid'] } }),
      Booking.countDocuments({ warehouseOwner: ownerId, status: 'pending' }),
      Booking.countDocuments({ warehouseOwner: ownerId, status: 'rejected' }),
      
      // Revenue aggregations
      Booking.aggregate([
        { $match: { warehouseOwner: ownerId, 'payment.status': 'paid', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$pricing.ownerAmount' } } }
      ]),
      Booking.aggregate([
        { $match: { warehouseOwner: ownerId, 'payment.status': 'paid', createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$pricing.ownerAmount' } } }
      ]),
      Booking.aggregate([
        { $match: { warehouseOwner: ownerId, 'payment.status': 'paid', createdAt: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: '$pricing.ownerAmount' } } }
      ]),
      Booking.aggregate([
        { $match: { warehouseOwner: ownerId, 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$pricing.ownerAmount' } } }
      ]),

      // Occupancy calculation
      Booking.aggregate([
        { $match: { warehouseOwner: ownerId, status: { $in: ['approved', 'paid'] } } },
        { $lookup: { from: 'warehouses', localField: 'warehouse', foreignField: '_id', as: 'warehouse' } },
        { $unwind: '$warehouse' },
        { $group: { 
            _id: '$warehouse._id', 
            warehouseName: { $first: '$warehouse.name' },
            totalCapacity: { $first: '$warehouse.capacity.total' },
            usedCapacity: { $sum: '$produce.quantity' }
          } 
        },
        { $project: { 
            occupancy: { 
              $multiply: [
                { $divide: ['$usedCapacity', '$totalCapacity'] }, 
                100
              ] 
            },
            warehouseName: 1
          } 
        }
      ]),

      // Recent bookings
      Booking.find({ warehouseOwner: ownerId })
        .populate('farmer', 'firstName lastName email')
        .populate('warehouse', 'name')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      // Top performing warehouses
      Booking.aggregate([
        { $match: { warehouseOwner: ownerId, 'payment.status': 'paid' } },
        { $lookup: { from: 'warehouses', localField: 'warehouse', foreignField: '_id', as: 'warehouse' } },
        { $unwind: '$warehouse' },
        { $group: { 
            _id: '$warehouse._id', 
            name: { $first: '$warehouse.name' },
            revenue: { $sum: '$pricing.ownerAmount' },
            bookings: { $sum: 1 }
          } 
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]),

      // Weekly trends for charts
      Booking.aggregate([
        { $match: { warehouseOwner: ownerId, createdAt: { $gte: startOfWeek } } },
        { $group: {
            _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } },
            bookings: { $sum: 1 },
            revenue: { $sum: { $cond: [{ $eq: ['$payment.status', 'paid'] }, '$pricing.ownerAmount', 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const monthlyEarnings = monthlyEarningsAgg?.[0]?.total || 0;
    const weeklyEarnings = weeklyEarningsAgg?.[0]?.total || 0;
    const yearlyEarnings = yearlyEarningsAgg?.[0]?.total || 0;
    const totalEarnings = totalEarningsAgg?.[0]?.total || 0;

    // Calculate average occupancy
    const avgOccupancyPercent = occupancyData.length > 0 
      ? Math.round(occupancyData.reduce((sum, w) => sum + w.occupancy, 0) / occupancyData.length)
      : 0;

    // Calculate growth trends
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const previousMonthEarnings = await Booking.aggregate([
      { $match: { 
          warehouseOwner: ownerId, 
          'payment.status': 'paid', 
          createdAt: { $gte: previousMonthStart, $lte: previousMonthEnd } 
        } 
      },
      { $group: { _id: null, total: { $sum: '$pricing.ownerAmount' } } }
    ]);

    const previousMonthAmount = previousMonthEarnings?.[0]?.total || 0;
    const monthlyGrowth = previousMonthAmount > 0 
      ? Math.round(((monthlyEarnings - previousMonthAmount) / previousMonthAmount) * 100)
      : 0;

    return res.json({
      success: true,
      data: {
        // Basic stats
        totalWarehouses,
        activeBookings,
        pendingBookings,
        rejectedBookings,
        
        // Revenue data
        monthlyEarnings,
        weeklyEarnings,
        yearlyEarnings,
        totalEarnings,
        monthlyGrowth,
        
        // Occupancy data
        avgOccupancyPercent,
        occupancyBreakdown: occupancyData,
        
        // Recent activity
        recentBookings,
        topWarehouses,
        
        // Chart data
        weeklyTrends,
        
        // Additional metrics
        totalCustomers: await Booking.distinct('farmer', { warehouseOwner: ownerId }).then(ids => ids.length),
        averageBookingValue: totalEarnings > 0 && activeBookings > 0 ? Math.round(totalEarnings / activeBookings) : 0
      }
    });
  } catch (error) {
    console.error('Owner dashboard stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch owner dashboard stats' });
  }
};

/**
 * GET /api/owner/analytics
 * Comprehensive analytics data for warehouse owner dashboard
 */
exports.getAnalytics = async (req, res) => {
  try {
    const ownerId = req.user.id || req.user._id;
    const { range = '30d' } = req.query;
    
    const now = new Date();
    const startDate = range === '7d' ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                   : range === '90d' ? new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
                   : range === '1y' ? new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
                   : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      revenueData,
      bookingData,
      occupancyData,
      customerData,
      topWarehouses,
      topCustomers,
      weeklyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      totalRevenue
    ] = await Promise.all([
      // Revenue analytics
      Booking.aggregate([
        { $match: { warehouseOwner: ownerId, 'payment.status': 'paid', createdAt: { $gte: startDate } } },
        { $group: {
            _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } },
            revenue: { $sum: '$pricing.ownerAmount' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Booking analytics
      Booking.aggregate([
        { $match: { warehouseOwner: ownerId, createdAt: { $gte: startDate } } },
        { $group: {
            _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } },
            bookings: { $sum: 1 },
            approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
            pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
            rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Occupancy analytics
      Booking.aggregate([
        { $match: { warehouseOwner: ownerId, status: { $in: ['approved', 'paid'] } } },
        { $lookup: { from: 'warehouses', localField: 'warehouse', foreignField: '_id', as: 'warehouse' } },
        { $unwind: '$warehouse' },
        { $group: { 
            _id: '$warehouse._id', 
            warehouseName: { $first: '$warehouse.name' },
            totalCapacity: { $first: '$warehouse.capacity.total' },
            usedCapacity: { $sum: '$produce.quantity' },
            bookings: { $sum: 1 }
          } 
        },
        { $project: { 
            warehouseName: 1,
            occupancy: { 
              $multiply: [
                { $divide: ['$usedCapacity', '$totalCapacity'] }, 
                100
              ] 
            },
            bookings: 1
          } 
        },
        { $sort: { occupancy: -1 } }
      ]),

      // Customer analytics
      Booking.aggregate([
        { $match: { warehouseOwner: ownerId, createdAt: { $gte: startDate } } },
        { $group: {
            _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } },
            newCustomers: { $addToSet: '$farmer' },
            totalBookings: { $sum: 1 }
          }
        },
        { $project: {
            _id: 1,
            newCustomers: { $size: '$newCustomers' },
            totalBookings: 1
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Top performing warehouses
      Booking.aggregate([
        { $match: { warehouseOwner: ownerId, 'payment.status': 'paid' } },
        { $lookup: { from: 'warehouses', localField: 'warehouse', foreignField: '_id', as: 'warehouse' } },
        { $unwind: '$warehouse' },
        { $group: { 
            _id: '$warehouse._id', 
            name: { $first: '$warehouse.name' },
            revenue: { $sum: '$pricing.ownerAmount' },
            bookings: { $sum: 1 }
          } 
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]),

      // Top customers
      Booking.aggregate([
        { $match: { warehouseOwner: ownerId, 'payment.status': 'paid' } },
        { $lookup: { from: 'users', localField: 'farmer', foreignField: '_id', as: 'farmer' } },
        { $unwind: '$farmer' },
        { $group: { 
            _id: '$farmer._id', 
            firstName: { $first: { $ifNull: ['$farmer.firstName', ''] } },
            lastName:  { $first: { $ifNull: ['$farmer.lastName',  ''] } },
            revenue: { $sum: '$pricing.ownerAmount' },
            bookings: { $sum: 1 },
            lastBooking: { $max: '$createdAt' }
          } 
        },
        { $project: {
            _id: 1,
            name: { $trim: { input: { $concat: ['$firstName', ' ', '$lastName'] } } },
            revenue: 1,
            bookings: 1,
            lastBooking: 1
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 5 }
      ]),

      // Revenue totals
      Booking.aggregate([
        { $match: { warehouseOwner: ownerId, 'payment.status': 'paid', createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: null, total: { $sum: '$pricing.ownerAmount' } } }
      ]),
      Booking.aggregate([
        { $match: { warehouseOwner: ownerId, 'payment.status': 'paid', createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } } },
        { $group: { _id: null, total: { $sum: '$pricing.ownerAmount' } } }
      ]),
      Booking.aggregate([
        { $match: { warehouseOwner: ownerId, 'payment.status': 'paid', createdAt: { $gte: new Date(now.getFullYear(), 0, 1) } } },
        { $group: { _id: null, total: { $sum: '$pricing.ownerAmount' } } }
      ]),
      Booking.aggregate([
        { $match: { warehouseOwner: ownerId, 'payment.status': 'paid' } },
        { $group: { _id: null, total: { $sum: '$pricing.ownerAmount' } } }
      ])
    ]);

    // Calculate trends
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousRevenue = await Booking.aggregate([
      { $match: { warehouseOwner: ownerId, 'payment.status': 'paid', createdAt: { $gte: previousPeriodStart, $lt: startDate } } },
      { $group: { _id: null, total: { $sum: '$pricing.ownerAmount' } } }
    ]);

    const currentRevenue = revenueData.reduce((sum, day) => sum + day.revenue, 0);
    const previousRevenueAmount = previousRevenue?.[0]?.total || 0;
    const revenueTrend = previousRevenueAmount > 0 
      ? Math.round(((currentRevenue - previousRevenueAmount) / previousRevenueAmount) * 100)
      : 0;

    const totalBookings = bookingData.reduce((sum, day) => sum + day.bookings, 0);
    const previousBookings = await Booking.countDocuments({ 
      warehouseOwner: ownerId, 
      createdAt: { $gte: previousPeriodStart, $lt: startDate } 
    });
    const bookingTrend = previousBookings > 0 
      ? Math.round(((totalBookings - previousBookings) / previousBookings) * 100)
      : 0;

    const avgOccupancy = occupancyData.length > 0 
      ? Math.round(occupancyData.reduce((sum, w) => sum + w.occupancy, 0) / occupancyData.length)
      : 0;

    const totalCustomers = await Booking.distinct('farmer', { warehouseOwner: ownerId }).then(ids => ids.length);
    const newCustomersThisPeriod = await Booking.distinct('farmer', { 
      warehouseOwner: ownerId, 
      createdAt: { $gte: startDate } 
    }).then(ids => ids.length);
    const customerTrend = totalCustomers > 0 
      ? Math.round((newCustomersThisPeriod / totalCustomers) * 100)
      : 0;

    return res.json({
      success: true,
      data: {
        revenue: {
          total: totalRevenue?.[0]?.total || 0,
          monthly: monthlyRevenue?.[0]?.total || 0,
          weekly: weeklyRevenue?.[0]?.total || 0,
          yearly: yearlyRevenue?.[0]?.total || 0,
          trend: revenueTrend,
          chartData: revenueData.map(d => ({ date: d._id, value: d.revenue }))
        },
        bookings: {
          total: totalBookings,
          pending: bookingData.reduce((sum, day) => sum + day.pending, 0),
          approved: bookingData.reduce((sum, day) => sum + day.approved, 0),
          rejected: bookingData.reduce((sum, day) => sum + day.rejected, 0),
          trend: bookingTrend,
          chartData: bookingData.map(d => ({ date: d._id, value: d.bookings }))
        },
        occupancy: {
          average: avgOccupancy,
          peak: occupancyData.length > 0 ? Math.max(...occupancyData.map(w => w.occupancy)) : 0,
          low: occupancyData.length > 0 ? Math.min(...occupancyData.map(w => w.occupancy)) : 0,
          trend: 0, // Could calculate based on historical data
          chartData: occupancyData.map(w => ({ warehouse: w.warehouseName, occupancy: w.occupancy }))
        },
        customers: {
          total: totalCustomers,
          new: newCustomersThisPeriod,
          returning: totalCustomers - newCustomersThisPeriod,
          trend: customerTrend,
          chartData: customerData.map(d => ({ date: d._id, value: d.newCustomers }))
        },
        topWarehouses,
        topCustomers
      }
    });
  } catch (error) {
    console.error('Owner analytics error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch analytics data' });
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


