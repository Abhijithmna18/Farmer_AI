const crypto = require('crypto');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const emailService = require('../services/email.service');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const ICS = require('ics');

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

    const ev = await Event.findById(id);
    if (!ev) return res.status(404).json({ success: false, message: 'Event not found' });

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

    // Fire-and-forget: send thank-you email
    try {
      const userEmail = req.user?.email;
      if (userEmail) {
        const subject = `Thank you for enrolling: ${ev.title}`;
        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2d5016;">You're enrolled! ✅</h2>
            <p>Thanks for enrolling in <strong>${ev.title}</strong>.</p>
            <div style="background:#f8f9fa;padding:16px;border-radius:8px;margin:12px 0">
              <p><strong>Date & Time:</strong> ${new Date(ev.dateTime).toLocaleString()}</p>
              <p><strong>Location:</strong> ${ev.locationDetail?.address || ev.location || 'Online/To be announced'}</p>
            </div>
            <p>We look forward to seeing you there!</p>
            <p style="color:#6b7280;font-size:12px;">This is an automated message from FarmerAI.</p>
          </div>
        `;
        // Use raw email to avoid template coupling
        await emailService.sendRawEmail(userEmail, subject, html);
      }
    } catch (e) {
      // log only; do not fail RSVP
      console.error('RSVP thank-you email error:', e?.message || e);
    }

    res.json({ success: true, registration: reg });
  } catch (error) {
    console.error('RSVP error:', error);
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
};