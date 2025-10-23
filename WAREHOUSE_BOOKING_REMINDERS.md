# Warehouse Booking Reminder System

## Overview
The warehouse booking reminder system automatically sends email notifications to both farmers and warehouse owners when a booking is approaching its end date. This helps ensure timely communication and prevents issues related to expired bookings.

## How It Works

### Reminder Schedule
The system sends reminders at two intervals:
1. **7 days before** the booking end date
2. **3 days before** the booking end date
3. **Urgent reminders** for bookings ending in 2, 1, or 0 days

### Email Templates
The system uses two different email templates:
1. **Farmer Reminder** - Sent to the farmer who booked the warehouse
2. **Owner Reminder** - Sent to the warehouse owner

### Tracking
The system tracks which reminders have been sent using the [remindersSent](file:///d:/New%20folder/intern/Farmer_AI/FarmerAI-backend/src/models/Booking.js#L267-L267) field in the Booking model to prevent duplicate emails.

## Implementation Details

### Backend Services
1. **Reminder Service** (`src/services/reminder.service.js`)
   - Contains the logic for checking upcoming bookings
   - Implements cron jobs for scheduled reminders
   - Sends emails through the email service

2. **Email Service** (`src/services/email.service.js`)
   - Contains email templates for warehouse booking reminders
   - Handles email sending with proper error handling
   - Logs all email activity

### Cron Jobs
The reminder system runs on two schedules:
- **Daily at 8:00 AM** - Checks for standard reminders (7 and 3 days)
- **Every 6 hours** - Checks for urgent reminders (2, 1, and 0 days)

### Data Model
The Booking model has been enhanced with tracking fields:
- [remindersSent](file:///d:/New%20folder/intern/Farmer_AI/FarmerAI-backend/src/models/Booking.js#L267-L267) - Array of reminder identifiers that have been sent
- [reminderMetadata](file:///d:/New%20folder/intern/Farmer_AI/FarmerAI-backend/src/models/Booking.js#L268-L268) - Additional metadata for reminders

## Testing
To manually trigger a reminder check:
```
// In the backend, you can trigger a manual check:
const reminderService = require('./src/services/reminder.service');
await reminderService.triggerManualCheck();
```

## Configuration
The system uses standard email configuration from the .env file:
- EMAIL_USER
- EMAIL_PASS
- EMAIL_HOST
- EMAIL_PORT
- SMTP_SECURE

## Troubleshooting
If reminders are not being sent:
1. Check that the cron jobs are running
2. Verify email configuration in .env
3. Check the logs for error messages
4. Ensure bookings have the correct status ('approved')
5. Verify that farmer and owner email addresses are valid
