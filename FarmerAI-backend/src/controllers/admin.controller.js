const GrowthCalendar = require('../models/GrowthCalendar');
const User = require('../models/User');
const Warehouse = require('../models/Warehouse');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Contact = require('../models/Contact');
const Product = require('../models/Product');
const SoilRecord = require('../models/SoilRecord');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const EmailLog = require('../models/EmailLog');
const Notification = require('../models/Notification');
const SystemConfig = require('../models/SystemConfig');
const ConfigLog = require('../models/ConfigLog');
const mongoose = require('mongoose');

// Overview Statistics - OLD VERSION - REMOVED (duplicate, see getOverviewStats at end of file)

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

// Admin: Create Event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, location, date, time, endDate, endTime, imageUrl, registrationLink, category } = req.body || {};
    if (!title || !description || !location || !date || !time) {
      return res.status(400).json({ success: false, message: 'title, description, location, date and time are required' });
    }
    const startDateTime = new Date(`${date}T${time}`);
    const endDateTime = endDate && endTime ? new Date(`${endDate}T${endTime}`) : undefined;
    // Derive organizer/admin identity for required Event fields
    const organizerId = req.user?._id || req.user?.id;
    const adminFullName = (req.user?.name || `${req.user?.firstName || ''} ${req.user?.lastName || ''}`.trim() || 'Admin').trim();
    const adminEmail = req.user?.email || process.env.SUPERADMIN_EMAIL || 'admin@farmerai.local';
    const payload = {
      title,
      description,
      location,
      dateTime: startDateTime,
      ...(endDateTime ? { endDateTime } : {}),
      images: imageUrl ? [{ url: imageUrl, alt: title }] : [],
      registrationLink,
      category,
      organizer: organizerId,
      farmerName: adminFullName,
      farmerEmail: adminEmail,
      status: 'published',
    };
    const ev = await Event.create(payload);
    res.status(201).json({ success: true, event: ev });
  } catch (error) {
    console.error('createEvent error:', error);
    res.status(500).json({ success: false, message: 'Failed to create event' });
  }
};

// Admin: Update Event
exports.updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { title, description, location, date, time, endDate, endTime, imageUrl, registrationLink, category, status } = req.body || {};
    const update = {};
    if (title !== undefined) update.title = title;
    if (description !== undefined) update.description = description;
    if (location !== undefined) update.location = location;
    if (date && time) update.dateTime = new Date(`${date}T${time}`);
    if (endDate && endTime) update.endDateTime = new Date(`${endDate}T${endTime}`);
    if (imageUrl !== undefined) update.images = imageUrl ? [{ url: imageUrl, alt: title || 'event' }] : [];
    if (registrationLink !== undefined) update.registrationLink = registrationLink;
    if (category !== undefined) update.category = category;
    if (status !== undefined) update.status = status;

    const ev = await Event.findByIdAndUpdate(eventId, update, { new: true });
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event: ev });
  } catch (error) {
    console.error('updateEvent error:', error);
    res.status(500).json({ success: false, message: 'Failed to update event' });
  }
};

// Growth Calendar: distinct filters meta
exports.getGrowthCalendarMeta = async (req, res) => {
  try {
    const crops = await GrowthCalendar.distinct('cropName');
    const seasons = await GrowthCalendar.distinct('season');
    const years = await GrowthCalendar.distinct('year');
    res.json({ success: true, data: { crops: crops.filter(Boolean).sort(), seasons: seasons.filter(Boolean).sort(), years: years.filter(Boolean).sort() } });
  } catch (error) {
    console.error('Error fetching growth calendar meta:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch growth calendar meta.' });
  }
};

// Growth Calendar: send reminder email to calendar owner (or admin-provided email)
exports.remindGrowthCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ success: false, message: 'Calendar ID is required' });

    const calendar = await GrowthCalendar.findById(id).populate('user', 'email firstName lastName');
    if (!calendar) return res.status(404).json({ success: false, message: 'Growth calendar not found' });

    const toEmail = req.body?.email || calendar.user?.email;
    if (!toEmail) return res.status(400).json({ success: false, message: 'No recipient email available' });

    const { sendRawEmail } = require('../services/email.service');
    const subject = `Reminder: ${calendar.cropName} growth schedule`;
    const planting = calendar.plantingDate ? new Date(calendar.plantingDate).toLocaleDateString() : 'N/A';
    const harvest = calendar.estimatedHarvestDate ? new Date(calendar.estimatedHarvestDate).toLocaleDateString() : 'N/A';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color:#2d5016;">Growth Calendar Reminder</h2>
        <p>Dear ${(calendar.user?.firstName || '') + ' ' + (calendar.user?.lastName || '')},</p>
        <p>This is a reminder for your crop <strong>${calendar.cropName}</strong>.</p>
        <ul>
          <li><strong>Planting Date:</strong> ${planting}</li>
          <li><strong>Estimated Harvest:</strong> ${harvest}</li>
          ${calendar.season ? `<li><strong>Season:</strong> ${calendar.season}</li>` : ''}
        </ul>
        <p>Log in to FarmerAI to view tasks and upcoming events.</p>
        <p>— FarmerAI</p>
      </div>
    `;
    await sendRawEmail(toEmail, subject, html);
    res.json({ success: true, message: 'Reminder sent successfully' });
  } catch (error) {
    console.error('Error sending growth calendar reminder:', error);
    res.status(500).json({ success: false, message: 'Failed to send reminder' });
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
          rolesDist: [
            { $unwind: { path: '$roles', preserveNullAndEmptyArrays: true } },
            { $group: { _id: '$roles', count: { $sum: 1 } } }
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

    // Growth calendar stats and trends (optionally filter by region/season/crops)
    const gcMatch = { ...dateMatch('createdAt') };
    const { region, season, crops } = req.query;
    if (region) {
      // assuming GrowthCalendar has region/state field; adjust as per schema
      gcMatch['region'] = region;
    }
    if (season) {
      gcMatch['season'] = season;
    }
    if (crops) {
      const arr = String(crops).split(',').map(s => s.trim()).filter(Boolean);
      if (arr.length) gcMatch['cropName'] = { $in: arr };
    }
    const growthAggPromise = GrowthCalendar.aggregate([
      { $match: gcMatch },
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
          ],
          byCropMonth: [
            { $group: { _id: { crop: '$cropName', month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } } }, count: { $sum: 1 } } },
            { $sort: { '_id.month': 1 } }
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

// Create warehouse (admin on behalf of owner)
exports.createWarehouse = async (req, res) => {
  try {
    const payload = req.body || {};
    if (!payload.owner) {
      return res.status(400).json({ success: false, message: 'owner is required' });
    }

    const owner = await User.findById(payload.owner);
    if (!owner) {
      return res.status(404).json({ success: false, message: 'Owner not found' });
    }

    const warehouse = new Warehouse({
      ...payload,
      owner: owner._id,
      status: payload.status || 'active',
      verification: payload.verification || { status: 'verified', verifiedAt: new Date(), verifiedBy: req.user._id }
    });
    await warehouse.save();
    await warehouse.populate('owner', 'firstName lastName email phone');

    try { emitWarehouseEvent('created', { warehouse }); } catch (_) {}
    return res.status(201).json({ success: true, data: warehouse });
  } catch (error) {
    logger.error('Admin create warehouse failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to create warehouse', error: error.message });
  }
};

// Update warehouse (admin)
exports.updateWarehouse = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Warehouse.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
      .populate('owner', 'firstName lastName email phone');
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }
    try { emitWarehouseEvent('updated', { warehouse: updated }); } catch (_) {}
    return res.json({ success: true, data: updated });
  } catch (error) {
    logger.error('Admin update warehouse failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to update warehouse', error: error.message });
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

    const warehouse = await Warehouse.findById(id)
      .populate('owner', 'firstName lastName email phone');
    
    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    const previousStatus = warehouse.verification.status;
    warehouse.verification.status = status;
    warehouse.verification.verifiedAt = new Date();
    warehouse.verification.verifiedBy = req.user.id;
    warehouse.verification.notes = notes;

    // Ensure verified warehouses become visible in marketplace
    // Public listing requires status === 'active' and verification.status === 'verified'
    if (status === 'verified' && warehouse.status !== 'active') {
      warehouse.status = 'active';
    }
    // Optionally deactivate on rejection
    if (status === 'rejected' && warehouse.status === 'active') {
      warehouse.status = 'inactive';
    }

    await warehouse.save();

    // Send email notification to warehouse owner
    try {
      const { sendWarehouseApproved, sendWarehouseRejected } = require('../services/email.service');
      
      const warehouseData = {
        ownerName: `${warehouse.owner.firstName} ${warehouse.owner.lastName}`,
        warehouseName: warehouse.name,
        location: `${warehouse.location.city}, ${warehouse.location.state}`,
        storageTypes: warehouse.storageTypes.join(', '),
        capacity: `${warehouse.capacity.total} ${warehouse.capacity.unit}`,
        price: warehouse.pricing.basePrice,
        approvedDate: warehouse.verification.verifiedAt.toLocaleDateString(),
        reviewDate: warehouse.verification.verifiedAt.toLocaleDateString(),
        reason: notes || 'Please review the listing requirements and make necessary updates.'
      };

      if (status === 'verified' && previousStatus !== 'verified') {
        await sendWarehouseApproved(warehouse.owner.email, warehouseData);
      } else if (status === 'rejected' && previousStatus !== 'rejected') {
        await sendWarehouseRejected(warehouse.owner.email, warehouseData);
      }
    } catch (emailError) {
      logger.error('Failed to send warehouse verification email:', emailError);
      // Don't fail the request if email fails
    }

    try { emitWarehouseEvent('verification-updated', { warehouse }); } catch (_) {}
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

    try { emitWarehouseEvent('deleted', { id }); } catch (_) {}
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

    // Ensure payment.amountDue is set for each booking
    const enrichedBookings = bookings.map(booking => {
      if (!booking.payment) booking.payment = {};
      if (typeof booking.payment.amountDue !== 'number') {
        const total = booking.pricing?.totalAmount;
        if (typeof total === 'number') {
          booking.payment.amountDue = (booking.payment.status === 'paid') ? 0 : total;
        }
      }
      return booking;
    });

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: enrichedBookings,
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
      .populate('warehouseOwner', 'firstName lastName email phone warehouseOwnerProfile')
      .lean();

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Ensure payment.amountDue is set
    if (!booking.payment) booking.payment = {};
    if (typeof booking.payment.amountDue !== 'number') {
      const total = booking.pricing?.totalAmount;
      if (typeof total === 'number') {
        booking.payment.amountDue = (booking.payment.status === 'paid') ? 0 : total;
      }
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

// Create booking (admin on behalf of farmer)
exports.createBooking = async (req, res) => {
  try {
    const { farmerId, warehouseId, produceType, quantity, startDate, endDate, markPaid } = req.body || {};
    if (!farmerId || !warehouseId || !produceType || !quantity || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const farmer = await User.findById(farmerId);
    const warehouse = await Warehouse.findById(warehouseId).populate('owner', 'firstName lastName email phone');
    if (!farmer || !warehouse) {
      return res.status(404).json({ success: false, message: 'Farmer or warehouse not found' });
    }

    const duration = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    const basePrice = warehouse.pricing?.basePrice || 0;
    const totalAmount = basePrice * duration * Number(quantity);
    const platformFee = totalAmount * 0.05;
    const ownerAmount = totalAmount - platformFee;

    const booking = new Booking({
      bookingId: Booking.generateBookingId(),
      farmer: farmer._id,
      warehouse: warehouse._id,
      warehouseOwner: warehouse.owner._id || warehouse.owner,
      produce: { type: produceType, quantity: Number(quantity), unit: 'tons' },
      storageRequirements: { storageType: warehouse.storageTypes?.[0] || 'general' },
      bookingDates: { startDate, endDate, duration },
      pricing: { basePrice, totalAmount, currency: 'INR', platformFee, ownerAmount },
      status: markPaid ? 'approved' : 'pending',
      payment: { status: markPaid ? 'paid' : 'pending', paidAt: markPaid ? new Date() : undefined }
    });

    await booking.save();
    await booking.populate([
      { path: 'farmer', select: 'firstName lastName email phone' },
      { path: 'warehouse', select: 'name location' },
      { path: 'warehouseOwner', select: 'firstName lastName email phone' }
    ]);

    return res.status(201).json({ success: true, data: booking });
  } catch (error) {
    logger.error('Admin create booking failed:', error);
    return res.status(500).json({ success: false, message: 'Failed to create booking', error: error.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const booking = await Booking.findById(id)
      .populate('farmer', 'firstName lastName email phone')
      .populate('warehouse', 'name location')
      .populate('warehouseOwner', 'firstName lastName email phone');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Store original pricing data to prevent it from being reset
    const originalPricing = { ...booking.pricing };
    
    booking.status = status;
    if (notes) {
      booking.communication.push({
        sender: req.user.id,
        message: `Admin update: ${notes}`,
        timestamp: new Date()
      });
    }

    // Set approval metadata for admin-only ERP flow
    if (status === 'approved') {
      booking.approval = booking.approval || {};
      booking.approval.status = 'approved';
      booking.approval.approvedAt = new Date();
      booking.approval.approvedBy = req.user.id;
      
      // Ensure pricing data is preserved after approval
      if ((!booking.pricing || booking.pricing.totalAmount === 0) && originalPricing.totalAmount > 0) {
        booking.pricing = originalPricing;
      }
    } else if (status === 'rejected') {
      booking.approval = booking.approval || {};
      booking.approval.status = 'rejected';
      booking.approval.rejectedAt = new Date();
      booking.approval.approvedBy = req.user.id;
      if (notes) booking.approval.rejectionReason = notes;
      
      // Ensure pricing data is preserved after rejection
      if ((!booking.pricing || booking.pricing.totalAmount === 0) && originalPricing.totalAmount > 0) {
        booking.pricing = originalPricing;
      }
    }

    await booking.save();

    // Send email notifications to user on approve/reject
    try {
      const { sendBookingApproved, sendBookingRejected } = require('../services/email.service');
      const farmerEmail = booking.farmer?.email;
      if (farmerEmail) {
        const payload = {
          bookingId: booking.bookingId || String(booking._id),
          farmerName: `${booking.farmer.firstName || ''} ${booking.farmer.lastName || ''}`.trim() || 'Farmer',
          warehouseName: booking.warehouse?.name || 'Warehouse',
          ownerName: `${booking.warehouseOwner?.firstName || ''} ${booking.warehouseOwner?.lastName || ''}`.trim(),
          ownerPhone: booking.warehouseOwner?.phone || '',
          startDate: booking.bookingDates?.startDate ? new Date(booking.bookingDates.startDate).toLocaleDateString() : '',
          endDate: booking.bookingDates?.endDate ? new Date(booking.bookingDates.endDate).toLocaleDateString() : '',
          produceType: booking.produce?.type,
          quantity: booking.produce?.quantity,
          unit: booking.produce?.unit,
          totalAmount: booking.pricing?.totalAmount,
          rejectionReason: booking.approval?.rejectionReason || notes || ''
        };

        if (status === 'approved') {
          await sendBookingApproved(farmerEmail, payload);
        } else if (status === 'rejected') {
          await sendBookingRejected(farmerEmail, payload);
        }
      }
    } catch (emailErr) {
      logger.error('Failed to send booking status email:', emailErr);
      // do not fail request on email error
    }

    try { emitBookingEvent('status-updated', { bookingId: booking._id, status: booking.status }); } catch (_) {}

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
    const { range, start, end, status, verified, city } = req.query;

    // Build filters for Warehouse.getStats
    const filters = {};
    if (status) filters.status = status;
    if (typeof verified !== 'undefined' && verified !== '') {
      // accept 'true'|'false'|'verified'|'pending'|'rejected'
      if (verified === 'true' || verified === true) filters.verified = true;
      else if (verified === 'false' || verified === false) filters.verified = false;
      else if (['verified', 'pending', 'rejected'].includes(String(verified))) {
        // pass as exact status using a small shim below
        filters._verificationStatus = String(verified);
      }
    }
    if (city) filters.city = city;

    // Date window
    const now = new Date();
    let dateFrom;
    let dateTo;
    if (start) dateFrom = new Date(start);
    if (end) dateTo = new Date(end);
    if (!start && !end && range) {
      const ms = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : null;
      if (ms) {
        dateFrom = new Date(now.getTime() - ms * 24 * 60 * 60 * 1000);
        dateTo = now;
      }
    }
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    // If specific verification status string provided, map to filters accordingly
    if (filters._verificationStatus) {
      filters.verified = undefined; // remove boolean
      // We'll emulate by calling getStats without this field, and compute later if needed.
    }

    let stats = await Warehouse.getStats(filters);

    // If a specific verification status string was requested, post-filter counts
    if (filters._verificationStatus) {
      const v = filters._verificationStatus;
      // When a specific status is requested, we can shape the response to focus that bucket
      if (v === 'verified') {
        // no change, stats already includes verifiedWarehouses
      } else if (v === 'pending') {
        // nothing to change; counts are present
      } else if (v === 'rejected') {
        // nothing to change; counts are present
      }
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching warehouse analytics:', error?.message || error);
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
    res.status(500).json({ success: false, message: 'Failed to fetch payment analytics.' });
  }
};

// Comprehensive Analytics for Dashboard Charts
exports.getAnalytics = async (req, res) => {
  try {
    // Get last 6 months of data
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Revenue by month
    const revenueByMonth = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount.total' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }] }
            ]
          },
          revenue: 1
        }
      }
    ]);

    // Bookings by status
    const bookingsByStatus = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          value: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          value: 1,
          _id: 0
        }
      }
    ]);

    // Bookings by month
    const bookingsByMonth = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          bookings: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $project: {
          month: {
            $concat: [
              { $toString: '$_id.year' },
              '-',
              { $cond: [{ $lt: ['$_id.month', 10] }, { $concat: ['0', { $toString: '$_id.month' }] }, { $toString: '$_id.month' }] }
            ]
          },
          bookings: 1
        }
      }
    ]);

    // Warehouse occupancy
    const warehouses = await Warehouse.find({ status: 'active' })
      .select('name capacity')
      .limit(10);

    const warehouseOccupancy = warehouses.map(w => ({
      name: w.name || 'Warehouse',
      occupied: (w.capacity?.total || 0) - (w.capacity?.available || 0),
      available: w.capacity?.available || 0
    }));

    res.json({
      success: true,
      data: {
        revenueByMonth,
        bookingsByStatus,
        bookingsByMonth,
        warehouseOccupancy
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics.' });
  }
};

// Get comprehensive stats for overview dashboard
exports.getOverviewStats = async (req, res) => {
  try {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // Total counts
    const totalUsers = await User.countDocuments();
    const totalWarehouses = await Warehouse.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({ 
      status: { $in: ['approved', 'awaiting-approval', 'pending', 'paid'] } 
    });
    const completedBookings = await Booking.countDocuments({ status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ status: 'cancelled' });
    const rejectedBookings = await Booking.countDocuments({ status: 'rejected' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const paidBookings = await Booking.countDocuments({ status: 'paid' });
    const approvedBookings = await Booking.countDocuments({ status: 'approved' });
    const awaitingApprovalBookings = await Booking.countDocuments({ status: 'awaiting-approval' });
    const pendingApprovals = await Warehouse.countDocuments({ 
      'verification.status': 'pending' 
    });

    // Revenue - Use Payment model for accurate revenue calculation
    const paymentStats = await Payment.getStats();
    const totalRevenue = paymentStats.totalAmount || 0;

    // Growth calculations (vs last month)
    const lastMonthUsers = await User.countDocuments({ createdAt: { $lt: lastMonth } });
    const lastMonthWarehouses = await Warehouse.countDocuments({ createdAt: { $lt: lastMonth } });
    const lastMonthBookings = await Booking.countDocuments({ createdAt: { $lt: lastMonth } });
    
    const userGrowth = lastMonthUsers > 0 ? ((totalUsers - lastMonthUsers) / lastMonthUsers * 100).toFixed(1) : 0;
    const warehouseGrowth = lastMonthWarehouses > 0 ? ((totalWarehouses - lastMonthWarehouses) / lastMonthWarehouses * 100).toFixed(1) : 0;
    const bookingGrowth = lastMonthBookings > 0 ? ((totalBookings - lastMonthBookings) / lastMonthBookings * 100).toFixed(1) : 0;

    // Low stock warehouses
    const lowStockWarehouses = await Warehouse.countDocuments({
      $expr: {
        $lt: [
          { $divide: ['$capacity.available', '$capacity.total'] },
          0.2
        ]
      }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalWarehouses,
        totalBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        rejectedBookings,
        pendingBookings,
        paidBookings,
        approvedBookings,
        awaitingApprovalBookings,
        totalRevenue,
        pendingApprovals,
        lowStockWarehouses,
        userGrowth: parseFloat(userGrowth),
        warehouseGrowth: parseFloat(warehouseGrowth),
        bookingGrowth: parseFloat(bookingGrowth),
        revenueGrowth: 0, // Can be calculated if needed
        completionRate: totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch overview stats.' });
  }
};

// Notification Management
exports.getNotifications = async (req, res) => {
  try {
    const adminUser = req.user;
    const notifications = await Notification.find({ recipient: adminUser._id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    const unreadCount = await Notification.countDocuments({ 
      recipient: adminUser._id, 
      read: false 
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read.' });
  }
};

exports.markAllNotificationsAsRead = async (req, res) => {
  try {
    const adminUser = req.user;
    await Notification.updateMany(
      { recipient: adminUser._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read.' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Failed to delete notification.' });
  }
};

// Admin Settings Management

// Get Admin Preferences
exports.getAdminPreferences = async (req, res) => {
  try {
    const adminUser = req.user;
    
    // Return admin preferences
    const preferences = {
      profile: {
        name: adminUser.name || `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim(),
        email: adminUser.email,
        phone: adminUser.phone || '',
        photoURL: adminUser.photoURL || ''
      },
      interface: {
        theme: adminUser.preferences?.theme || 'light',
        layout: adminUser.preferences?.layout || 'full',
        landingPage: adminUser.preferences?.landingPage || 'overview'
      },
      notifications: {
        email: adminUser.notificationPreferences?.email || true,
        sms: adminUser.notificationPreferences?.sms || false,
        inApp: adminUser.notificationPreferences?.inApp || true,
        categories: adminUser.notificationPreferences?.categories || {
          approvals: true,
          payments: true,
          userActivities: true
        }
      },
      language: adminUser.preferences?.language || 'en',
      timezone: adminUser.preferences?.timezone || 'UTC'
    };
    
    res.json({ success: true, data: preferences });
  } catch (error) {
    console.error('Error fetching admin preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch admin preferences.' });
  }
};

// Update Admin Preferences
exports.updateAdminPreferences = async (req, res) => {
  try {
    const adminUser = req.user;
    const { profile, interface: interfacePrefs, notifications, language, timezone } = req.body;
    
    // Update user document with new preferences
    const updateData = {};
    
    if (profile) {
      if (profile.name) updateData.name = profile.name;
      if (profile.email) updateData.email = profile.email;
      if (profile.phone) updateData.phone = profile.phone;
    }
    
    if (interfacePrefs) {
      updateData['preferences.theme'] = interfacePrefs.theme || 'light';
      updateData['preferences.layout'] = interfacePrefs.layout || 'full';
      updateData['preferences.landingPage'] = interfacePrefs.landingPage || 'overview';
    }
    
    if (notifications) {
      updateData['notificationPreferences.email'] = notifications.email;
      updateData['notificationPreferences.sms'] = notifications.sms;
      updateData['notificationPreferences.inApp'] = notifications.inApp;
      updateData['notificationPreferences.categories'] = notifications.categories;
    }
    
    if (language) updateData['preferences.language'] = language;
    if (timezone) updateData['preferences.timezone'] = timezone;
    
    const updatedUser = await User.findByIdAndUpdate(
      adminUser._id,
      { $set: updateData },
      { new: true, select: 'name email phone photoURL preferences notificationPreferences' }
    );
    // If no user document was found/updated, return a clear 404 instead of causing a 500 later
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Admin user not found for updating preferences.' });
    }
    
    res.json({ 
      success: true, 
      message: 'Admin preferences updated successfully.',
      data: {
        profile: {
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          photoURL: updatedUser.photoURL
        },
        interface: updatedUser.preferences,
        notifications: updatedUser.notificationPreferences,
        language: updatedUser.preferences?.language,
        timezone: updatedUser.preferences?.timezone
      }
    });
  } catch (error) {
    console.error('Error updating admin preferences:', error);
    res.status(500).json({ success: false, message: 'Failed to update admin preferences.' });
  }
};

// Get System Configuration
exports.getSystemConfiguration = async (req, res) => {
  try {
    // Fetch configuration from database
    const configDoc = await SystemConfig.getConfig();
    
    const config = {
      general: configDoc.general,
      warehouse: configDoc.warehouse,
      payment: configDoc.payment,
      communication: configDoc.communication
    };
    
    res.json({ success: true, data: config });
  } catch (error) {
    console.error('Error fetching system configuration:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch system configuration.' });
  }
};

// Update System Configuration
exports.updateSystemConfiguration = async (req, res) => {
  try {
    const { general, warehouse, payment, communication } = req.body;
    const adminUser = req.user;
    
    // Prepare update data
    const updateData = {};
    if (general) updateData.general = general;
    if (warehouse) updateData.warehouse = warehouse;
    if (payment) updateData.payment = payment;
    if (communication) updateData.communication = communication;
    
    // Update configuration in database
    const updatedConfig = await SystemConfig.updateConfig(
      updateData,
      adminUser._id,
      adminUser.email
    );
    
    // Log the configuration change
    await ConfigLog.create({
      action: 'UPDATE_SYSTEM_CONFIG',
      category: 'system_configuration',
      user: {
        userId: adminUser._id,
        email: adminUser.email
      },
      changes: updateData,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ 
      success: true, 
      message: 'System configuration updated successfully.',
      data: {
        general: updatedConfig.general,
        warehouse: updatedConfig.warehouse,
        payment: updatedConfig.payment,
        communication: updatedConfig.communication
      }
    });
  } catch (error) {
    console.error('Error updating system configuration:', error);
    res.status(500).json({ success: false, message: 'Failed to update system configuration.' });
  }
};

// Get Environment Configuration (Read-only for security)
exports.getEnvironmentConfiguration = async (req, res) => {
  try {
    const configService = require('../services/config.service');
    
    // Read environment variables from .env file
    const envVars = configService.readEnvFile();
    
    // Mask sensitive values for security
    const maskedVars = configService.maskSensitiveValues(envVars);
    
    const envConfig = {
      database: {
        MONGO_URI: maskedVars.MONGO_URI || ''
      },
      api: {
        PORT: maskedVars.PORT || '5000',
        JWT_SECRET: maskedVars.JWT_SECRET || '',
        CORS_ORIGIN: maskedVars.CORS_ORIGIN || 'http://localhost:5173'
      },
      services: {
        GEMINI_API_KEY: maskedVars.GEMINI_API_KEY || '',
        EMAIL_USER: maskedVars.EMAIL_USER || '',
        EMAIL_PASS: maskedVars.EMAIL_PASS || '',
        RAZORPAY_KEY_ID: maskedVars.RAZORPAY_KEY_ID || '',
        RAZORPAY_KEY_SECRET: maskedVars.RAZORPAY_KEY_SECRET || ''
      }
    };
    
    res.json({ success: true, data: envConfig });
  } catch (error) {
    console.error('Error fetching environment configuration:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch environment configuration.' });
  }
};

// Update Environment Configuration (Super Admin only)
exports.updateEnvironmentConfiguration = async (req, res) => {
  try {
    const { database, api, services } = req.body;
    const adminUser = req.user;
    
    // Prepare updates for .env file
    const updates = {};
    
    if (database) {
      if (database.MONGO_URI) updates.MONGO_URI = database.MONGO_URI;
    }
    
    if (api) {
      if (api.PORT) updates.PORT = api.PORT;
      if (api.JWT_SECRET) updates.JWT_SECRET = api.JWT_SECRET;
      if (api.CORS_ORIGIN) updates.CORS_ORIGIN = api.CORS_ORIGIN;
    }
    
    if (services) {
      if (services.GEMINI_API_KEY) updates.GEMINI_API_KEY = services.GEMINI_API_KEY;
      if (services.EMAIL_USER) updates.EMAIL_USER = services.EMAIL_USER;
      if (services.EMAIL_PASS) updates.EMAIL_PASS = services.EMAIL_PASS;
      if (services.RAZORPAY_KEY_ID) updates.RAZORPAY_KEY_ID = services.RAZORPAY_KEY_ID;
      if (services.RAZORPAY_KEY_SECRET) updates.RAZORPAY_KEY_SECRET = services.RAZORPAY_KEY_SECRET;
    }
    
    // Update .env file using config service
    const configService = require('../services/config.service');
    const success = configService.updateEnvFile(updates);
    
    if (!success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update environment configuration file.' 
      });
    }
    
    // Log the configuration change
    await ConfigLog.create({
      action: 'UPDATE_ENVIRONMENT_CONFIG',
      category: 'environment_configuration',
      user: {
        userId: adminUser._id,
        email: adminUser.email
      },
      changes: { database, api, services },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ 
      success: true, 
      message: 'Environment configuration updated successfully. Server restart required for changes to take effect.'
    });
  } catch (error) {
    console.error('Error updating environment configuration:', error);
    res.status(500).json({ success: false, message: 'Failed to update environment configuration.' });
  }
};

// Get Configuration Change Logs
exports.getConfigurationLogs = async (req, res) => {
  try {
    // Fetch logs from database
    const logs = await ConfigLog.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .select('action category user changes createdAt');
    
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching configuration logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch configuration logs.' });
  }
};

// Restore Default Configuration
exports.restoreDefaultConfiguration = async (req, res) => {
  try {
    const adminUser = req.user;
    
    // Reset system configuration to defaults
    const defaultConfig = new SystemConfig();
    await defaultConfig.save();
    
    // Log the configuration change
    await ConfigLog.create({
      action: 'RESTORE_DEFAULTS',
      category: 'system_configuration',
      user: {
        userId: adminUser._id,
        email: adminUser.email
      },
      changes: { message: 'System configuration restored to defaults' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.json({ 
      success: true, 
      message: 'Default configuration restored successfully.'
    });
  } catch (error) {
    console.error('Error restoring default configuration:', error);
    res.status(500).json({ success: false, message: 'Failed to restore default configuration.' });
  }
};

// Growth Calendar Management
exports.getGrowthCalendars = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, season, year, isActive, crop } = req.query;
    
    // Build filter object
    const filter = {};
    
    if (search) {
      filter.$or = [
        { cropName: { $regex: search, $options: 'i' } },
        { variety: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (season) {
      filter.season = season;
    }
    
    if (year) {
      filter.year = Number(year);
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    if (crop) {
      filter.cropName = crop;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get calendars with user info
    const calendars = await GrowthCalendar.find(filter)
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(skip);
      
    // Get total count for pagination
    const total = await GrowthCalendar.countDocuments(filter);
    
    res.json({
      success: true,
      data: calendars,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    console.error('Error fetching growth calendars:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch growth calendars.' });
  }
};

exports.createGrowthCalendar = async (req, res) => {
  try {
    const payload = req.body || {};
    
    // Validate required fields
    if (!payload.cropName || !payload.plantingDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'cropName and plantingDate are required' 
      });
    }
    
    // Create the growth calendar
    const calendar = new GrowthCalendar(payload);
    await calendar.save();
    
    // Populate user info
    await calendar.populate('user', 'firstName lastName email');
    
    res.status(201).json({
      success: true,
      message: 'Growth calendar created successfully',
      data: calendar
    });
  } catch (error) {
    console.error('Error creating growth calendar:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create growth calendar.',
      error: error.message
    });
  }
};

exports.getGrowthCalendarById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Calendar ID is required' 
      });
    }
    
    const calendar = await GrowthCalendar.findById(id)
      .populate('user', 'firstName lastName email');
      
    if (!calendar) {
      return res.status(404).json({ 
        success: false, 
        message: 'Growth calendar not found' 
      });
    }
    
    res.json({
      success: true,
      data: calendar
    });
  } catch (error) {
    console.error('Error fetching growth calendar:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch growth calendar.',
      error: error.message
    });
  }
};

exports.updateGrowthCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Calendar ID is required' 
      });
    }
    
    const calendar = await GrowthCalendar.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('user', 'firstName lastName email');
    
    if (!calendar) {
      return res.status(404).json({ 
        success: false, 
        message: 'Growth calendar not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Growth calendar updated successfully',
      data: calendar
    });
  } catch (error) {
    console.error('Error updating growth calendar:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update growth calendar.',
      error: error.message
    });
  }
};

exports.deleteGrowthCalendar = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Calendar ID is required' 
      });
    }
    
    const calendar = await GrowthCalendar.findByIdAndDelete(id);
    
    if (!calendar) {
      return res.status(404).json({ 
        success: false, 
        message: 'Growth calendar not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Growth calendar deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting growth calendar:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete growth calendar.',
      error: error.message
    });
  }
};
