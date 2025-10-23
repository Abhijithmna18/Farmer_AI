# Warehouse & Cold Storage Booking System

A comprehensive warehouse and cold storage booking system built for FarmerAI, enabling farmers to book storage facilities, warehouse owners to manage bookings, and admins to oversee the entire system.

## 🚀 Features

### 🌱 Farmer Features
- **Warehouse Search & Discovery**: Advanced search with filters for location, storage types, pricing, and availability
- **Booking Management**: Complete booking flow with produce details, storage requirements, and date selection
- **Payment Integration**: Secure Razorpay payment processing with order creation and verification
- **Dashboard**: View booking history, track status, and manage cancellations
- **Email Notifications**: Real-time updates for booking confirmations, payments, and status changes

### 🏪 Warehouse Owner Features
- **Warehouse Management**: Add, edit, and manage warehouse listings with detailed information
- **Booking Approval**: Approve or reject farmer booking requests with reasons
- **Revenue Tracking**: Monitor earnings and booking statistics
- **Communication**: Direct messaging with farmers through the platform
- **Dashboard**: Comprehensive overview of all bookings and warehouse performance

### 🛠️ Admin Features
- **System Oversight**: View all bookings, warehouses, and payments across the platform
- **Warehouse Verification**: Verify and approve warehouse listings
- **Analytics**: Detailed statistics and reporting on system usage
- **Payment Management**: Process refunds and manage payment disputes
- **User Management**: Oversee farmers and warehouse owners

## 🏗️ Technical Architecture

### Backend (Node.js + Express + MongoDB)
- **Models**: Warehouse, Booking, Payment, User (with warehouse owner profile)
- **APIs**: Complete CRUD operations for warehouses, bookings, and payments
- **Payment Integration**: Razorpay order creation, verification, and webhook handling
- **Email System**: Nodemailer-based notification system
- **Authentication**: JWT-based authentication with role-based access control

### Frontend (React + Vite + Tailwind + GSAP)
- **Components**: Reusable, animated components for warehouse cards, booking modals, and dashboards
- **Pages**: Dedicated dashboards for farmers, warehouse owners, and admins
- **Animations**: Smooth GSAP animations for enhanced user experience
- **Responsive Design**: Mobile-first design with Tailwind CSS

## 📁 File Structure

### Backend Files
```
FarmerAI-backend/
├── src/
│   ├── models/
│   │   ├── Warehouse.js          # Warehouse data model
│   │   ├── Booking.js            # Booking data model
│   │   ├── Payment.js            # Payment data model
│   │   └── User.js               # Updated with warehouse owner profile
│   ├── controllers/
│   │   ├── warehouse.controller.js    # Warehouse CRUD operations
│   │   ├── booking.controller.js      # Booking management
│   │   ├── payment.controller.js      # Payment processing
│   │   └── admin.controller.js        # Admin functions
│   ├── routes/
│   │   ├── warehouse.routes.js        # Warehouse API routes
│   │   └── admin.routes.js            # Updated admin routes
│   ├── config/
│   │   └── razorpay.js               # Razorpay configuration
│   └── services/
│       └── email.service.js          # Email notification service
```

### Frontend Files
```
farmerai-frontend/src/
├── components/
│   ├── WarehouseSearch.jsx           # Advanced search component
│   ├── WarehouseCard.jsx             # Warehouse display card
│   ├── BookingModal.jsx              # Booking form modal
│   └── WarehouseDetailsModal.jsx     # Detailed warehouse view
├── pages/
│   ├── WarehouseListing.jsx          # Main warehouse listing page
│   ├── FarmerDashboard.jsx           # Farmer booking dashboard
│   ├── WarehouseOwnerDashboard.jsx   # Owner management dashboard
│   └── AdminWarehouseDashboard.jsx   # Admin oversight dashboard
```

## 🔧 API Endpoints

### Warehouse Management
- `GET /api/warehouses` - List warehouses with filters
- `GET /api/warehouses/:id` - Get warehouse details
- `POST /api/warehouses` - Create warehouse (owner only)
- `PUT /api/warehouses/:id` - Update warehouse (owner only)
- `DELETE /api/warehouses/:id` - Delete warehouse (owner only)
- `GET /api/warehouses/:id/availability` - Check availability

### Booking Management
- `POST /api/warehouses/:id/book` - Create booking
- `GET /api/warehouses/bookings/my-bookings` - Get user bookings
- `GET /api/warehouses/bookings/:id` - Get booking details
- `POST /api/warehouses/bookings/:id/verify-payment` - Verify payment
- `POST /api/warehouses/bookings/:id/approve` - Approve booking (owner)
- `POST /api/warehouses/bookings/:id/reject` - Reject booking (owner)
- `POST /api/warehouses/bookings/:id/cancel` - Cancel booking

### Payment Processing
- `GET /api/warehouses/payments/history` - Payment history
- `GET /api/warehouses/payments/:id` - Payment details
- `POST /api/warehouses/payments/webhook` - Razorpay webhook

### Admin Functions
- `GET /api/admin/warehouses` - All warehouses
- `PATCH /api/admin/warehouses/:id/verify` - Verify warehouse
- `GET /api/admin/bookings` - All bookings
- `GET /api/admin/payments` - All payments
- `POST /api/admin/payments/:id/refund` - Process refund

## 💳 Payment Flow

1. **Order Creation**: Farmer initiates booking → Razorpay order created
2. **Payment Processing**: Farmer completes payment via Razorpay checkout
3. **Payment Verification**: Backend verifies payment signature
4. **Booking Status Update**: Booking status changes to "awaiting-approval"
5. **Owner Notification**: Warehouse owner receives email notification
6. **Approval Process**: Owner approves/rejects booking
7. **Payout Processing**: Approved bookings trigger payout to warehouse owner

## 📧 Email Notifications

- **Booking Confirmation**: Sent to farmer when booking is created
- **Payment Confirmation**: Sent to farmer when payment is successful
- **Booking Approved**: Sent to farmer when owner approves booking
- **Booking Rejected**: Sent to farmer when owner rejects booking
- **Refund Processed**: Sent to farmer when refund is processed
- **New Booking Notification**: Sent to warehouse owner for new requests

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Smooth Animations**: GSAP-powered animations for enhanced experience
- **Interactive Components**: Hover effects, loading states, and transitions
- **Status Indicators**: Color-coded status badges and progress indicators
- **Search & Filters**: Advanced filtering with real-time search
- **Modal Dialogs**: Smooth modal transitions for forms and details

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Different access levels for farmers, owners, and admins
- **Payment Security**: Razorpay's secure payment processing
- **Input Validation**: Server-side validation for all inputs
- **CORS Protection**: Configured CORS for secure API access

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB
- Razorpay account
- SMTP email service

### Environment Variables
```env
# Database
MONGO_URI=mongodb://localhost:27017/farmerai

# Razorpay
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# JWT
JWT_SECRET=your_jwt_secret
```

### Installation
1. Install backend dependencies:
   ```bash
   cd FarmerAI-backend
   npm install
   ```

2. Install frontend dependencies:
   ```bash
   cd farmerai-frontend
   npm install
   ```

3. Start the backend server:
   ```bash
   cd FarmerAI-backend
   npm run dev
   ```

4. Start the frontend development server:
   ```bash
   cd farmerai-frontend
   npm run dev
   ```

## 📊 Database Schema

### Warehouse Model
- Basic info (name, description, location)
- Storage types and capacity
- Pricing and availability
- Owner information
- Verification status
- Facilities and documents

### Booking Model
- Farmer and warehouse references
- Produce details and storage requirements
- Booking dates and pricing
- Payment information
- Approval status and communication
- AI recommendations

### Payment Model
- Razorpay integration details
- Amount breakdown (base, platform fee, owner amount)
- Refund information
- Payout status
- Webhook data

## 🔮 Future Enhancements

- **AI Recommendations**: Smart suggestions for optimal storage conditions
- **Geospatial Analysis**: Advanced location-based search and recommendations
- **Predictive Analytics**: Demand forecasting and pricing optimization
- **Mobile App**: Native mobile applications for iOS and Android
- **Real-time Chat**: In-app messaging between farmers and warehouse owners
- **Advanced Analytics**: Detailed reporting and insights dashboard

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is part of the FarmerAI platform and is proprietary software.

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for the agricultural community**

























