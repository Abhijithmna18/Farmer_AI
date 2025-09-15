const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const EmailLog = require('../models/EmailLog');
const Contact = require('../models/Contact');
const Product = require('../models/Product');
const GrowthCalendar = require('../models/GrowthCalendar');
const SoilRecord = require('../models/SoilRecord');
const Warehouse = require('../models/Warehouse');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { createRefund } = require('../config/razorpay');

// Overview Statistics
exports.getOverviewStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const farmersCount = await User.countDocuments({ $or: [ { role: 'farmer' }, { roles: { $in: ['farmer'] } } ] });
    const buyersCount = await User.countDocuments({ userType: { $in: ['buyer', 'both'] } });
    const pendingReports = await Contact.countDocuments({ status: 'new' });

    res.status(200).json({
      totalUsers,
      farmersCount,
      buyersCount,
      pendingReports,
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({ message: 'Failed to fetch overview stats.' });
  }
};

// User Management
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'firstName lastName name email role roles verified createdAt').sort({ createdAt: -1 });
    res.status(200).json(users.map(u => ({
      _id: u._id,
      name: u.name || `${u.firstName||''} ${u.lastName||''}`.trim(),
      email: u.email,
      role: u.role || (Array.isArray(u.roles) && u.roles.includes('admin') ? 'admin' : 'farmer'),
      verified: u.verified,
      createdAt: u.createdAt,
    })));
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { roles, verified, isActive } = req.body;

    const update = {};
    if (Array.isArray(roles)) update.roles = roles;
    if (typeof verified === 'boolean') update.verified = verified;
    if (typeof isActive === 'boolean') update.isActive = isActive;

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'Provide roles (array) and/or verified/isActive (boolean).' });
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.status(200).json({ message: 'User updated successfully.', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user.' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
};

// Event Management
exports.getEvents = async (req, res) => {
  try {
    // Return comprehensive fields needed by admin UI
    const events = await Event.find({}, 'title dateTime status farmerEmail farmerName location description createdAt')
      .sort({ createdAt: -1 });
    res.status(200).json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events.' });
  }
};

exports.approveEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findByIdAndUpdate(eventId, { status: 'verified' }, { new: true });

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    res.status(200).json({ message: 'Event approved successfully.', event });
  } catch (error) {
    console.error('Error approving event:', error);
    res.status(500).json({ message: 'Failed to approve event.' });
  }
};

exports.rejectEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findByIdAndUpdate(eventId, { status: 'rejected' }, { new: true });

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    res.status(200).json({ message: 'Event rejected successfully.', event });
  } catch (error) {
    console.error('Error rejecting event:', error);
    res.status(500).json({ message: 'Failed to reject event.' });
  }
};

// Unified verify/reject endpoint
exports.verifyOrRejectEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status } = req.body; // expected: 'verified' | 'rejected'

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ message: "Status must be 'verified' or 'rejected'" });
    }

    const event = await Event.findByIdAndUpdate(eventId, { status }, { new: true });
    if (!event) return res.status(404).json({ message: 'Event not found.' });

    res.status(200).json({ message: `Event ${status === 'verified' ? 'approved' : 'rejected'} successfully.`, event });
  } catch (error) {
    console.error('Error updating event status:', error);
    res.status(500).json({ message: 'Failed to update event status.' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findByIdAndDelete(eventId);

    if (!event) {
      return res.status(404).json({ message: 'Event not found.' });
    }

    res.status(200).json({ message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event.' });
  }
};

// Registrations Management
exports.getRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate('eventId', 'title')
      .populate('userId', 'name email');
    res.status(200).json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    res.status(500).json({ message: 'Failed to fetch registrations.' });
  }
};

// Email Logs
exports.getEmailLogs = async (req, res) => {
  try {
    const emailLogs = await EmailLog.find({});
    res.status(200).json(emailLogs);
  } catch (error) {
    console.error('Error fetching email logs:', error);
    res.status(500).json({ message: 'Failed to fetch email logs.' });
  }
};

exports.retryEmail = async (req, res) => {
  try {
    const { logId } = req.params;
    const emailLog = await EmailLog.findById(logId);

    if (!emailLog) {
      return res.status(404).json({ message: 'Email log not found.' });
    }

    emailLog.status = 'success';
    emailLog.error = undefined;
    await emailLog.save();

    res.status(200).json({ message: 'Email retry simulated successfully.', emailLog });
  } catch (error) {
    console.error('Error retrying email:', error);
    res.status(500).json({ message: 'Failed to retry email.' });
  }
};

// Contacts
exports.getContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({}).sort({ createdAt: -1 });
    res.status(200).json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ message: 'Failed to fetch contacts.' });
  }
};

exports.deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findByIdAndDelete(id);
    if (!contact) return res.status(404).json({ message: 'Message not found.' });
    res.status(200).json({ message: 'Message deleted successfully.' });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ message: 'Failed to delete contact.' });
  }
};

// --- Admin Analytics with date filters ---
// GET /api/admin/analytics?range=7d|30d|all&start=ISO&end=ISO
exports.getAnalytics = async (req, res) => {
  try {
    const { range, start, end } = req.query;

    let startDate;
    let endDate = end ? new Date(end) : new Date();
    if (start) {
      startDate = new Date(start);
    } else if (range === '7d') {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '30d') {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    } else {
      startDate = undefined; // all-time
      endDate = undefined;
    }

    const dateMatch = (field = 'createdAt') => (
      startDate || endDate
        ? { [field]: Object.fromEntries([
            ...(startDate ? [[ '$gte', startDate ]] : []),
            ...(endDate ? [[ '$lte', endDate ]] : []),
          ].map(([k, v]) => [k, v])) }
        : {}
    );

    // Users summary and role distribution
    const userMatch = dateMatch('createdAt');
    const userAggPromise = User.aggregate([
      { $match: { ...userMatch } },
      {
        $facet: {
          totals: [
            { $group: {
              _id: null,
              totalUsers: { $sum: 1 },
              farmers: { $sum: { $cond: [{ $in: ['$userType', ['farmer', 'both']] }, 1, 0] } },
              buyers: { $sum: { $cond: [{ $in: ['$userType', ['buyer', 'both']] }, 1, 0] } },
            }},
          ],
          admins: [
            { $match: { roles: { $in: ['admin'] } } },
            { $count: 'adminUsers' }
          ],
          byDay: [
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
          ],
        }
      }
    ]);

    // Products active vs inactive and top crops (by name/category)
    const productMatch = dateMatch('createdAt');
    const productAggPromise = Product.aggregate([
      { $match: { ...productMatch } },
      {
        $facet: {
          statusCounts: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          topCategories: [
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ],
          topNames: [
            { $group: { _id: '$name', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ]
        }
      }
    ]);

    // Growth calendar stats and trends
    const gcMatch = dateMatch('createdAt');
    const growthAggPromise = GrowthCalendar.aggregate([
      { $match: { ...gcMatch } },
      {
        $facet: {
          total: [ { $count: 'total' } ],
          byCrop: [
            { $group: { _id: '$cropName', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
          ],
          byDay: [
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    // Soil records count and trends
    const soilMatch = dateMatch('createdAt');
    const soilAggPromise = SoilRecord.aggregate([
      { $match: { ...soilMatch } },
      {
        $facet: {
          total: [ { $count: 'total' } ],
          byDay: [
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    // Pending contacts (reports/feedback)
    const pendingContactsPromise = Contact.countDocuments({ status: 'new', ...(dateMatch('createdAt')) });

    const [userAggArr, productAggArr, growthAggArr, soilAggArr, pendingContacts] = await Promise.all([
      userAggPromise,
      productAggPromise,
      growthAggPromise,
      soilAggPromise,
      pendingContactsPromise
    ]);

    const userAgg = userAggArr?.[0] || {};
    const productAgg = productAggArr?.[0] || {};
    const growthAgg = growthAggArr?.[0] || {};
    const soilAgg = soilAggArr?.[0] || {};

    const totals = userAgg?.totals?.[0] || { totalUsers: 0, farmers: 0, buyers: 0 };
    const adminUsers = userAgg?.admins?.[0]?.adminUsers || 0;

    const productStatusMap = Object.fromEntries((productAgg?.statusCounts || []).map(s => [s._id || 'unknown', s.count]));
    const activeListings = productStatusMap['active'] || 0;
    const inactiveListings = Object.entries(productStatusMap).reduce((acc, [k, v]) => k === 'active' ? acc : acc + v, 0);

    res.json({
      range: range || (startDate ? 'custom' : 'all'),
      dateWindow: startDate ? { start: startDate, end: endDate || new Date() } : null,
      users: {
        total: totals.totalUsers || 0,
        farmers: totals.farmers || 0,
        buyers: totals.buyers || 0,
        admins: adminUsers,
        timeSeries: (userAgg?.byDay || []).map(d => ({ date: d._id, value: d.count })),
      },
      marketplace: {
        total: (activeListings + inactiveListings),
        active: activeListings,
        inactive: inactiveListings,
        topCategories: (productAgg?.topCategories || []).map(x => ({ name: x._id, value: x.count })),
        topCrops: (productAgg?.topNames || []).map(x => ({ name: x._id, value: x.count })),
      },
      crops: {
        totalGrowthCalendars: (growthAgg?.total?.[0]?.total) || 0,
        topGrowthCrops: (growthAgg?.byCrop || []).map(x => ({ name: x._id, value: x.count })),
        growthCalendarTrend: (growthAgg?.byDay || []).map(d => ({ date: d._id, value: d.count })),
      },
      soil: {
        totalRecords: (soilAgg?.total?.[0]?.total) || 0,
        trend: (soilAgg?.byDay || []).map(d => ({ date: d._id, value: d.count })),
      },
      reports: {
        pendingContacts,
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics.' });
  }
};

// GET /api/admin/reports - list pending/new contacts
exports.getReports = async (req, res) => {
  try {
    const { range, start, end } = req.query;
    let startDate;
    let endDate = end ? new Date(end) : new Date();
    if (start) {
      startDate = new Date(start);
    } else if (range === '7d') {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === '30d') {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    const match = { status: 'new', ...(startDate ? { createdAt: { $gte: startDate, $lte: endDate } } : {}) };
    const contacts = await Contact.find(match).sort({ createdAt: -1 });
    res.json({ total: contacts.length, contacts });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ message: 'Failed to fetch reports.' });
  }
};

// Warehouse Management
exports.getWarehouses = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, verified } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (verified !== undefined) query['verification.status'] = verified;

    const warehouses = await Warehouse.find(query)
      .populate('owner', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Warehouse.countDocuments(query);

    res.json({
      success: true,
      data: warehouses,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({ message: 'Failed to fetch warehouses.' });
  }
};

exports.getWarehouseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const warehouse = await Warehouse.findById(id)
      .populate('owner', 'firstName lastName email phone warehouseOwnerProfile')
      .populate('bookings', 'bookingId status bookingDates produce');

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    res.json({
      success: true,
      data: warehouse
    });
  } catch (error) {
    console.error('Error fetching warehouse:', error);
    res.status(500).json({ message: 'Failed to fetch warehouse.' });
  }
};

exports.verifyWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    warehouse.verification.status = status;
    warehouse.verification.verifiedAt = new Date();
    warehouse.verification.verifiedBy = req.user.id;
    warehouse.verification.notes = notes;

    await warehouse.save();

    res.json({
      success: true,
      message: 'Warehouse verification updated successfully',
      data: warehouse
    });
  } catch (error) {
    console.error('Error verifying warehouse:', error);
    res.status(500).json({ message: 'Failed to verify warehouse.' });
  }
};

exports.deleteWarehouse = async (req, res) => {
  try {
    const { id } = req.params;

    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Check for active bookings
    const activeBookings = await Booking.countDocuments({
      warehouse: id,
      status: { $in: ['paid', 'awaiting-approval', 'approved'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete warehouse with active bookings'
      });
    }

    await Warehouse.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Warehouse deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting warehouse:', error);
    res.status(500).json({ message: 'Failed to delete warehouse.' });
  }
};

// Booking Management
exports.getBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, dateFrom, dateTo } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query['bookingDates.startDate'] = {};
      if (dateFrom) query['bookingDates.startDate'].$gte = new Date(dateFrom);
      if (dateTo) query['bookingDates.startDate'].$lte = new Date(dateTo);
    }

    const bookings = await Booking.find(query)
      .populate('farmer', 'firstName lastName email phone')
      .populate('warehouse', 'name location')
      .populate('warehouseOwner', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings.' });
  }
};

exports.getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await Booking.findById(id)
      .populate('farmer', 'firstName lastName email phone farmerProfile')
      .populate('warehouse', 'name location facilities images')
      .populate('warehouseOwner', 'firstName lastName email phone warehouseOwnerProfile');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Failed to fetch booking.' });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    booking.status = status;
    if (notes) {
      booking.communication.push({
        sender: req.user.id,
        message: `Admin update: ${notes}`,
        timestamp: new Date()
      });
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Failed to update booking status.' });
  }
};

// Payment Management
exports.getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, dateFrom, dateTo } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const payments = await Payment.find(query)
      .populate('farmer', 'firstName lastName email phone')
      .populate('warehouseOwner', 'firstName lastName email phone')
      .populate('booking', 'bookingId warehouse produce')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Failed to fetch payments.' });
  }
};

exports.getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const payment = await Payment.findById(id)
      .populate('farmer', 'firstName lastName email phone')
      .populate('warehouseOwner', 'firstName lastName email phone')
      .populate('booking', 'bookingId warehouse produce bookingDates');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ message: 'Failed to fetch payment.' });
  }
};

exports.processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findById(id);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (!payment.razorpay.paymentId) {
      return res.status(400).json({
        success: false,
        message: 'No payment ID found for refund'
      });
    }

    const refundAmount = amount || payment.amount.total;
    const refund = await createRefund(
      payment.razorpay.paymentId,
      refundAmount,
      { reason: reason || 'Admin initiated refund' }
    );

    // Update payment record
    payment.refund.razorpayRefundId = refund.id;
    payment.refund.amount = refundAmount;
    payment.refund.status = 'processed';
    payment.refund.reason = reason;
    payment.refund.processedAt = new Date();
    payment.amount.amountRefunded = refundAmount;
    payment.status = 'refunded';

    await payment.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: { refund, payment }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ message: 'Failed to process refund.' });
  }
};

// Analytics
exports.getWarehouseAnalytics = async (req, res) => {
  try {
    const stats = await Warehouse.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching warehouse analytics:', error);
    res.status(500).json({ message: 'Failed to fetch warehouse analytics.' });
  }
};

exports.getBookingAnalytics = async (req, res) => {
  try {
    const stats = await Booking.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching booking analytics:', error);
    res.status(500).json({ message: 'Failed to fetch booking analytics.' });
  }
};

exports.getPaymentAnalytics = async (req, res) => {
  try {
    const stats = await Payment.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({ message: 'Failed to fetch payment analytics.' });
  }
};
