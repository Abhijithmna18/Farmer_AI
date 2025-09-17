# Warehouse Booking System Setup Guide

## 🚀 Quick Start

The warehouse booking system is now ready to use! Here's how to set it up:

## 📋 Prerequisites

1. **Node.js 16+** installed
2. **MongoDB** running locally or MongoDB Atlas connection
3. **Razorpay Account** (for payment features)
4. **Email Service** (Gmail SMTP or other SMTP provider)

## ⚙️ Environment Variables Setup

Create a `.env` file in the `FarmerAI-backend` directory with the following variables:

```env
# Database Configuration
MONGO_URI=mongodb://localhost:27017/farmerai

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here

# Razorpay Configuration (Required for payment features)
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here

# Email Configuration (Required for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Admin Configuration
SUPERADMIN_EMAIL=admin@farmerai.com

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

## 🔧 Razorpay Setup

1. **Create Razorpay Account**: Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. **Get API Keys**: 
   - Go to Settings → API Keys
   - Generate new API keys
   - Copy `Key ID` and `Key Secret`
3. **Set Webhook Secret**:
   - Go to Settings → Webhooks
   - Create webhook with URL: `http://your-domain.com/api/warehouses/payments/webhook`
   - Copy the webhook secret

## 📧 Email Setup (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `SMTP_PASS`

## 🚀 Installation & Running

### Backend Setup
```bash
cd FarmerAI-backend
npm install
npm run dev
```

### Frontend Setup
```bash
cd farmerai-frontend
npm install
npm run dev
```

## 🎯 Testing the System

### 1. **Without Razorpay (Development Mode)**
The system will work without Razorpay credentials, but payment features will be disabled. You'll see a warning:
```
⚠️  Razorpay credentials not found. Payment features will be disabled.
```

### 2. **With Razorpay (Production Mode)**
Once you add Razorpay credentials, all payment features will be enabled.

## 📱 Available Features

### For Farmers:
- Browse and search warehouses
- Book storage facilities
- Manage bookings and payments
- Receive email notifications

### For Warehouse Owners:
- Add and manage warehouse listings
- Approve/reject booking requests
- Track earnings and analytics
- Communicate with farmers

### For Admins:
- Oversee all system activities
- Verify warehouse listings
- Manage payments and refunds
- View comprehensive analytics

## 🔍 API Endpoints

### Warehouse Management
- `GET /api/warehouses` - List warehouses
- `POST /api/warehouses` - Create warehouse (owner only)
- `GET /api/warehouses/:id` - Get warehouse details

### Booking Management
- `POST /api/warehouses/:id/book` - Create booking
- `GET /api/warehouses/bookings/my-bookings` - Get user bookings
- `POST /api/warehouses/bookings/:id/approve` - Approve booking (owner)
- `POST /api/warehouses/bookings/:id/reject` - Reject booking (owner)

### Payment Processing
- `POST /api/warehouses/bookings/:id/verify-payment` - Verify payment
- `POST /api/warehouses/payments/webhook` - Razorpay webhook

### Admin Functions
- `GET /api/admin/warehouses` - All warehouses
- `GET /api/admin/bookings` - All bookings
- `GET /api/admin/payments` - All payments

## 🐛 Troubleshooting

### Common Issues:

1. **Razorpay Error**: Make sure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set
2. **Email Not Working**: Check SMTP credentials and enable app passwords
3. **Database Connection**: Ensure MongoDB is running and `MONGO_URI` is correct
4. **CORS Issues**: Verify `FRONTEND_URL` matches your frontend URL

### Development Mode:
- The system works without Razorpay for testing UI/UX
- Payment features will show appropriate error messages
- All other features (search, booking flow, admin) work normally

## 📊 Database Collections

The system creates these MongoDB collections:
- `warehouses` - Warehouse listings
- `bookings` - Booking records
- `payments` - Payment transactions
- `users` - Updated with warehouse owner profiles
- `emaillogs` - Email notification logs

## 🎨 Frontend Routes

- `/warehouses` - Warehouse listing and search
- `/farmer-dashboard` - Farmer booking management
- `/warehouse-owner-dashboard` - Owner management
- `/admin-warehouse-dashboard` - Admin oversight

## 🔐 Security Notes

- All API endpoints require authentication
- Role-based access control (farmer, warehouse-owner, admin)
- Payment data is handled securely through Razorpay
- Input validation on all forms and APIs

## 📞 Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check MongoDB connection

The system is now ready to use! 🎉










