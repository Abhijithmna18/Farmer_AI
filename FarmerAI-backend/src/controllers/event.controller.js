const crypto = require('crypto');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const User = require('../models/User');
const Notification = require('../models/Notification');
const emailService = require('../services/email.service');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const ICS = require('ics');
const logger = require('../utils/logger');

const hostEvent = async (req, res) => {
  try {
    const { title, dateTime, location, description, farmerName, farmerEmail } = req.body;

    if (!title || !dateTime || !location || !description || !farmerName || !farmerEmail) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const verificationToken = crypto.randomBytes(20).toString('hex');

    const event = new Event({
      title,
      dateTime,
      location,
      description,
      farmerName,
      farmerEmail,
      verificationToken,
    });

    await event.save();

    const verificationLink = `http://localhost:5000/api/events/verify/${verificationToken}`;
    const subject = 'Verify Your Event Submission';
    const message = `Hi ${farmerName},<br><br>Please verify your event "${title}" by clicking this link: <a href="${verificationLink}">${verificationLink}</a><br><br>Best regards,<br>The FarmerAI Team`;

    await emailService.sendRawEmail(farmerEmail, subject, message);

    res.status(200).json({ success: true, message: 'Verification email sent.' });
  } catch (error) {
    console.error('Error hosting event:', error);
    res.status(500).json({ success: false, message: 'Failed to host event.' });
  }
};

const verifyEvent = async (req, res) => {
  try {
    const { token } = req.params;

    const event = await Event.findOne({ verificationToken: token });

    if (!event) {
      return res.status(404).send('Invalid verification token.');
    }

    event.status = 'verified';
    event.verificationToken = undefined;
    await event.save();

    res.status(200).send('✅ Your event has been verified and is now live!');
  } catch (error) {
    console.error('Error verifying event:', error);
    res.status(500).send('Failed to verify event.');
  }
};

const getEvents = async (req, res) => {
  try {
    const { from, to, category, q, status = 'published', page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (q) filter.$or = [{ title: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } }];
    if (from || to) {
      filter.dateTime = {};
      if (from) filter.dateTime.$gte = new Date(from);
      if (to) filter.dateTime.$lte = new Date(to);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [events, total] = await Promise.all([
      Event.find(filter).sort({ dateTime: 'asc' }).skip(skip).limit(parseInt(limit)),
      Event.countDocuments(filter)
    ]);

    res.status(200).json({ success: true, events, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), total } });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events.' });
  }
};

const rsvp = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { id } = req.params; // event id
    const { status = 'going' } = req.body;

    const ev = await Event.findById(id).populate('organizer', 'name email');
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found' });

    // Get user details for notifications
    const user = await User.findById(userId).select('name email phone');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Check if user is already registered
    const existingReg = await EventRegistration.findOne({ event: id, user: userId });
    const isNewRegistration = !existingReg;

    // capacity & waitlist
    let newStatus = status;
    if (status === 'going' && ev.capacity > 0) {
      const goingCount = await EventRegistration.countDocuments({ event: id, status: 'going' });
      if (goingCount >= ev.capacity) newStatus = 'waitlisted';
    }

    const reg = await EventRegistration.findOneAndUpdate(
      { event: id, user: userId },
      { status: newStatus },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Update event registration count
    if (isNewRegistration && newStatus === 'going') {
      await Event.findByIdAndUpdate(id, { $inc: { registrations: 1 } });
    }

    // Send confirmation email to user
    try {
      const subject = `Event Enrollment Confirmation: ${ev.title}`;
      const statusText = newStatus === 'waitlisted' ? 'waitlisted' : 'confirmed';
      const statusColor = newStatus === 'waitlisted' ? '#f59e0b' : '#10b981';
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #10B981, #059669); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Enrollment ${statusText === 'confirmed' ? 'Confirmed' : 'Received'}!</h1>
          </div>
          
          <div style="padding: 30px; background: #f9fafb;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Hello <strong>${user.name}</strong>,
            </p>
            
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              Your enrollment for <strong>"${ev.title}"</strong> has been ${statusText}!
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${statusColor};">
              <h3 style="color: #1f2937; margin-top: 0;">Event Details</h3>
              <p style="margin: 8px 0;"><strong>📅 Date & Time:</strong> ${new Date(ev.dateTime).toLocaleString()}</p>
              <p style="margin: 8px 0;"><strong>📍 Location:</strong> ${ev.locationDetail?.address || ev.location || 'To be announced'}</p>
              <p style="margin: 8px 0;"><strong>👤 Organizer:</strong> ${ev.organizer?.name || ev.farmerName}</p>
              <p style="margin: 8px 0;"><strong>📧 Contact:</strong> ${ev.organizer?.email || ev.farmerEmail}</p>
              ${ev.price > 0 ? `<p style="margin: 8px 0;"><strong>💰 Price:</strong> ₹${ev.price}</p>` : ''}
            </div>

            ${newStatus === 'waitlisted' ? `
              <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;"><strong>⏳ Waitlist Status:</strong> You're on the waitlist. We'll notify you if a spot becomes available!</p>
              </div>
            ` : ''}

            <div style="background: #e5f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                💡 <strong>Important:</strong> Please save this email for your records. You'll receive reminder emails closer to the event date.
              </p>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/events" 
                 style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                View All Events
              </a>
            </div>
          </div>
          
          <div style="padding: 20px; text-align: center; background: #f3f4f6; border-radius: 0 0 8px 8px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated message from FarmerAI.<br>
              If you have any questions, please contact the event organizer.
            </p>
          </div>
        </div>
      `;
      
      await emailService.sendRawEmail(user.email, subject, html);
      logger.info(`Enrollment confirmation email sent to ${user.email} for event: ${ev.title}`);
    } catch (e) {
      logger.error('RSVP confirmation email error:', e?.message || e);
    }

    // Send notification to admin/organizer
    try {
      // Get all admin users
      const admins = await User.find({ 
        $or: [
          { role: 'admin' },
          { userType: 'admin' }
        ]
      }).select('email name');

      // Send email to admins
      for (const admin of admins) {
        const adminSubject = `New Event Enrollment: ${ev.title}`;
        const adminHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 20px; text-align: center;">
              <h1 style="color: white; margin: 0;">📊 New Event Enrollment</h1>
            </div>
            
            <div style="padding: 20px; background: #f9fafb;">
              <p style="font-size: 16px; color: #374151;">
                <strong>${user.name}</strong> has enrolled in the event <strong>"${ev.title}"</strong>
              </p>
              
              <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <h3 style="color: #1f2937; margin-top: 0;">Enrollment Details</h3>
                <p style="margin: 5px 0;"><strong>User:</strong> ${user.name} (${user.email})</p>
                <p style="margin: 5px 0;"><strong>Event:</strong> ${ev.title}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(ev.dateTime).toLocaleString()}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${newStatus === 'waitlisted' ? '#f59e0b' : '#10b981'}; font-weight: bold;">${newStatus}</span></p>
                <p style="margin: 5px 0;"><strong>Enrollment Time:</strong> ${new Date().toLocaleString()}</p>
              </div>

              <div style="background: #e5f3ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0; color: #1e40af; font-size: 14px;">
                  💡 <strong>Admin Action:</strong> You can view and manage all event enrollments in the admin dashboard.
                </p>
              </div>
            </div>
          </div>
        `;
        
        await emailService.sendRawEmail(admin.email, adminSubject, adminHtml);
      }

      // Create in-app notification for admins
      for (const admin of admins) {
        await Notification.create({
          type: 'system',
          title: 'New Event Enrollment',
          message: `${user.name} enrolled in "${ev.title}"`,
          recipient: admin._id,
          data: {
            eventId: ev._id,
            userId: user._id,
            eventTitle: ev.title,
            userName: user.name,
            status: newStatus
          }
        });
      }

      logger.info(`Admin notifications sent for new enrollment: ${user.name} in ${ev.title}`);
    } catch (e) {
      logger.error('Admin notification error:', e?.message || e);
    }

    res.json({ 
      success: true, 
      registration: reg,
      message: newStatus === 'waitlisted' ? 'You have been added to the waitlist' : 'Enrollment confirmed'
    });
  } catch (error) {
    logger.error('RSVP error:', error);
    res.status(500).json({ success: false, message: 'Failed to RSVP' });
  }
};

const changeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['draft','pending','verified','published','cancelled','rejected','archived'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });
    const ev = await Event.findByIdAndUpdate(id, { status }, { new: true });
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event: ev });
  } catch (error) {
    console.error('Change status error:', error);
    res.status(500).json({ success: false, message: 'Failed to change status' });
  }
};

const getAttendees = async (req, res) => {
  try {
    const { id } = req.params;
    const regs = await EventRegistration.find({ event: id, status: { $in: ['going','checked_in','waitlisted'] } }).populate('user','name email');
    res.json({ success: true, attendees: regs });
  } catch (error) {
    console.error('Get attendees error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attendees' });
  }
};

// Exports
const exportCSV = async (req, res) => {
  try {
    const { id } = req.params;
    const regs = await EventRegistration.find({ event: id }).populate('user','name email');
    const rows = regs.map(r => ({ name: r.user?.name, email: r.user?.email, status: r.status, createdAt: r.createdAt }));
    const parser = new Parser();
    const csv = parser.parse(rows);
    res.header('Content-Type','text/csv');
    res.attachment('attendees.csv');
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
};

const exportICS = async (req, res) => {
  try {
    const { id } = req.params;
    const ev = await Event.findById(id);
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found' });
    const start = new Date(ev.dateTime);
    const end = new Date(ev.endDateTime || ev.dateTime);
    const eventObj = {
      title: ev.title,
      description: ev.description,
      location: ev.locationDetail?.address || ev.location,
      start: [start.getFullYear(), start.getMonth()+1, start.getDate(), start.getHours(), start.getMinutes()],
      end: [end.getFullYear(), end.getMonth()+1, end.getDate(), end.getHours(), end.getMinutes()],
    };
    const { error, value } = ICS.createEvent(eventObj);
    if (error) throw error;
    res.header('Content-Type','text/calendar');
    res.attachment('event.ics');
    res.send(value);
  } catch (error) {
    console.error('ICS export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export ICS' });
  }
};

const exportPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const ev = await Event.findById(id);
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found' });
    const doc = new PDFDocument();
    res.setHeader('Content-Type','application/pdf');
    res.setHeader('Content-Disposition','attachment; filename=event.pdf');
    doc.pipe(res);
    doc.fontSize(18).text(ev.title, { underline: true });
    doc.moveDown().fontSize(12).text(`Date: ${new Date(ev.dateTime).toLocaleString()}`);
    if (ev.endDateTime) doc.text(`Ends: ${new Date(ev.endDateTime).toLocaleString()}`);
    doc.text(`Location: ${ev.locationDetail?.address || ev.location}`);
    doc.moveDown().text(ev.description || '');
    doc.end();
  } catch (error) {
    console.error('PDF export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export PDF' });
  }
};

// Return distinct categories from Event collection
const getCategories = async (req, res) => {
  try {
    const categories = await Event.distinct('category', { category: { $ne: null } });
    res.status(200).json({ success: true, categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

// Enhanced Event Analytics
const getEventAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id).populate('organizer', 'name email');
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Get registration statistics
    const registrations = await EventRegistration.find({ event: id });
    const attendanceRate = event.registrations > 0 ? (event.attendance / event.registrations) * 100 : 0;
    
    // Get demographic data
    const demographics = await EventRegistration.aggregate([
      { $match: { event: mongoose.Types.ObjectId(id) } },
      { $lookup: { from: 'users', localField: 'user', foreignField: '_id', as: 'userData' } },
      { $unwind: '$userData' },
      {
        $group: {
          _id: null,
          totalRegistrations: { $sum: 1 },
          ageGroups: {
            $push: {
              $switch: {
                branches: [
                  { case: { $lt: [{ $subtract: [new Date(), '$userData.dateOfBirth'] }, 25 * 365 * 24 * 60 * 60 * 1000] }, then: '18-24' },
                  { case: { $lt: [{ $subtract: [new Date(), '$userData.dateOfBirth'] }, 35 * 365 * 24 * 60 * 60 * 1000] }, then: '25-34' },
                  { case: { $lt: [{ $subtract: [new Date(), '$userData.dateOfBirth'] }, 45 * 365 * 24 * 60 * 60 * 1000] }, then: '35-44' },
                  { case: { $lt: [{ $subtract: [new Date(), '$userData.dateOfBirth'] }, 55 * 365 * 24 * 60 * 60 * 1000] }, then: '45-54' },
                  { case: { $lt: [{ $subtract: [new Date(), '$userData.dateOfBirth'] }, 65 * 365 * 24 * 60 * 60 * 1000] }, then: '55-64' }
                ],
                default: '65+'
              }
            }
          }
        }
      }
    ]);

    const analytics = {
      event: {
        id: event._id,
        title: event.title,
        dateTime: event.dateTime,
        category: event.category,
        difficulty: event.difficulty
      },
      metrics: {
        views: event.views,
        registrations: event.registrations,
        attendance: event.attendance,
        attendanceRate: Math.round(attendanceRate * 100) / 100,
        rating: event.rating,
        shares: event.shares,
        likes: event.likes.length
      },
      demographics: demographics[0] || { totalRegistrations: 0, ageGroups: [] },
      timeline: {
        createdAt: event.createdAt,
        publishedAt: event.updatedAt,
        eventDate: event.dateTime
      }
    };

    res.json({ success: true, analytics });
  } catch (error) {
    logger.error('Error getting event analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to get analytics' });
  }
};

// Event Search with Advanced Filtering
const searchEvents = async (req, res) => {
  try {
    const {
      q, // search query
      category,
      difficulty,
      location,
      dateFrom,
      dateTo,
      priceMin,
      priceMax,
      featured,
      status = 'published',
      sortBy = 'dateTime',
      sortOrder = 'asc',
      page = 1,
      limit = 10
    } = req.query;

    const filter = { status };
    
    // Text search
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Difficulty filter
    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }

    // Location filter
    if (location) {
      filter.$or = [
        { location: { $regex: location, $options: 'i' } },
        { 'locationDetail.city': { $regex: location, $options: 'i' } },
        { 'locationDetail.state': { $regex: location, $options: 'i' } }
      ];
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filter.dateTime = {};
      if (dateFrom) filter.dateTime.$gte = new Date(dateFrom);
      if (dateTo) filter.dateTime.$lte = new Date(dateTo);
    }

    // Price range filter
    if (priceMin || priceMax) {
      filter.price = {};
      if (priceMin) filter.price.$gte = parseFloat(priceMin);
      if (priceMax) filter.price.$lte = parseFloat(priceMax);
    }

    // Featured filter
    if (featured === 'true') {
      filter.featured = true;
    }

    // Sort options
    const sortOptions = {};
    if (sortBy === 'rating') {
      sortOptions['rating.average'] = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'views') {
      sortOptions.views = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'registrations') {
      sortOptions.registrations = sortOrder === 'desc' ? -1 : 1;
    } else {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const events = await Event.find(filter)
      .populate('organizer', 'name email photoURL')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Event.countDocuments(filter);

    res.json({
      success: true,
      events,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    logger.error('Error searching events:', error);
    res.status(500).json({ success: false, message: 'Failed to search events' });
  }
};

// Like/Unlike Event
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const isLiked = event.likes.includes(userId);
    
    if (isLiked) {
      event.likes.pull(userId);
    } else {
      event.likes.push(userId);
    }

    await event.save();

    res.json({ 
      success: true, 
      liked: !isLiked,
      likesCount: event.likes.length 
    });
  } catch (error) {
    logger.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle like' });
  }
};

// Add Comment to Event
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user.id;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const comment = {
      user: userId,
      text: text.trim(),
      createdAt: new Date()
    };

    event.comments.push(comment);
    await event.save();

    await event.populate('comments.user', 'name photoURL');

    res.json({ 
      success: true, 
      comment: event.comments[event.comments.length - 1] 
    });
  } catch (error) {
    logger.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment' });
  }
};

// Rate Event
const rateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Check if user has registered for the event
    const registration = await EventRegistration.findOne({ 
      event: id, 
      user: userId,
      status: { $in: ['going', 'checked_in'] }
    });

    if (!registration) {
      return res.status(400).json({ 
        success: false, 
        message: 'You must be registered for this event to rate it' 
      });
    }

    // Update rating
    const totalRating = event.rating.average * event.rating.count + rating;
    event.rating.count += 1;
    event.rating.average = totalRating / event.rating.count;

    await event.save();

    res.json({ 
      success: true, 
      rating: event.rating 
    });
  } catch (error) {
    logger.error('Error rating event:', error);
    res.status(500).json({ success: false, message: 'Failed to rate event' });
  }
};

// Get Event Recommendations
const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 5 } = req.query;

    // Get user's past event registrations and preferences
    const userRegistrations = await EventRegistration.find({ 
      user: userId,
      status: { $in: ['going', 'checked_in'] }
    }).populate('event');

    const userCategories = [...new Set(userRegistrations.map(r => r.event.category))];
    const userTags = [...new Set(userRegistrations.flatMap(r => r.event.tags))];

    // Find similar events
    const recommendations = await Event.find({
      status: 'published',
      dateTime: { $gte: new Date() },
      _id: { $nin: userRegistrations.map(r => r.event._id) },
      $or: [
        { category: { $in: userCategories } },
        { tags: { $in: userTags } }
      ]
    })
    .populate('organizer', 'name photoURL')
    .sort({ 'rating.average': -1, views: -1 })
    .limit(parseInt(limit));

    res.json({ 
      success: true, 
      recommendations 
    });
  } catch (error) {
    logger.error('Error getting recommendations:', error);
    res.status(500).json({ success: false, message: 'Failed to get recommendations' });
  }
};

// Track Event View
const trackView = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Event.findByIdAndUpdate(id, { $inc: { views: 1 } });
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Error tracking view:', error);
    res.status(500).json({ success: false, message: 'Failed to track view' });
  }
};

// Get Admin Notifications for Event Enrollments
const getAdminNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user is admin
    const user = await User.findById(userId);
    if (!user || (user.role !== 'admin' && user.userType !== 'admin')) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const notifications = await Notification.find({
      recipient: userId,
      type: 'system',
      $or: [
        { title: { $regex: 'Event Enrollment', $options: 'i' } },
        { message: { $regex: 'enrolled in', $options: 'i' } }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('data.userId', 'name email')
    .populate('data.eventId', 'title dateTime');

    res.json({ success: true, notifications });
  } catch (error) {
    logger.error('Error getting admin notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to get notifications' });
  }
};

module.exports = {
  hostEvent,
  verifyEvent,
  getEvents,
  rsvp,
  changeStatus,
  getAttendees,
  exportCSV,
  exportICS,
  exportPDF,
  getCategories,
  getEventAnalytics,
  searchEvents,
  toggleLike,
  addComment,
  rateEvent,
  getRecommendations,
  trackView,
  getAdminNotifications,
};