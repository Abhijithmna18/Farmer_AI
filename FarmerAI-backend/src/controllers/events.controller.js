const emailService = require('../services/email.service');

// In a real application, you would save the registration to a database.
// For this example, we'll just simulate it.
const fakeEventDatabase = {
  'evt001': { title: 'Sustainable Farming Workshop' },
  'evt002': { title: 'AI in Agriculture Conference' },
};

const registerForEvent = async (req, res) => {
  const { name, email, phone, eventId } = req.body;

  if (!name || !email || !phone || !eventId) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const event = fakeEventDatabase[eventId];
  if (!event) {
    return res.status(404).json({ message: 'Event not found.' });
  }

  try {
    // 1. Simulate saving registration to DB
    console.log(`Registration received for ${event.title}:`, { name, email, phone });

    // 2. Send confirmation email
    const subject = `Event Registration Confirmation: ${event.title}`;
    const html = `Hi ${name},<br><br>Thank you for registering for <strong>${event.title}</strong>. We're excited to have you join us!<br><br>Stay tuned for more updates.<br><br>Best regards,<br>The FarmerAI Team`;
    
    await emailService.sendEmail(email, subject, html);

    res.status(201).json({ success: true, message: 'Registration successful and confirmation email sent.' });
  } catch (error) {
    console.error('Event registration failed:', error);
    // Even if email fails, we can still return a success to the user if the registration was saved.
    res.status(500).json({ success: false, message: 'Registration saved, but confirmation email failed to send.' });
  }
};

module.exports = {
  registerForEvent,
};
