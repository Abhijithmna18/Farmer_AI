# Admin Dashboard - Warehouse Management System

## Overview
A comprehensive, professional admin dashboard for managing warehouses, bookings, payments, and notifications within the Farmer AI Warehouse Management System.

## Features

### 1. **Dashboard Overview**
- **Key Performance Indicators (KPIs)**
  - Total Revenue with growth trends
  - Total Warehouses count
  - Active Bookings
  - Total Users
  - Pending Approvals
  - Completed Bookings

- **Data Visualization**
  - Revenue trend charts (Area Chart)
  - Bookings by status (Pie Chart)
  - Warehouse occupancy (Bar Chart)
  - Monthly bookings trend (Line Chart)

- **Recent Activities**
  - Latest booking requests
  - Real-time updates

- **System Alerts**
  - Pending warehouse approvals
  - Low capacity warnings

### 2. **Warehouse Management**
- View all warehouse listings
- Filter by:
  - Status (Active, Inactive, Draft, Maintenance, Suspended)
  - Verification status (Verified, Pending, Rejected)
- Approve/Reject warehouse submissions
- View detailed warehouse information
- Bulk actions support
- Pagination controls

### 3. **Booking Management**
- View all booking requests
- Filter by status:
  - Pending
  - Awaiting Approval
  - Approved
  - Rejected
  - Cancelled
  - Completed
- Quick actions:
  - Approve bookings
  - Reject bookings
  - Mark as completed
- View booking details
- Real-time updates via WebSocket

### 4. **Payment Management**
- **Summary Cards**
  - Total Revenue
  - Completed Payments
  - Pending Payments
  - Refunded Amount

- **Payment Tracking**
  - View all transactions
  - Filter by status and date range
  - Search by Payment ID or user name
  - Payment details with breakdown

- **Refund Processing**
  - Process full or partial refunds
  - Add refund reasons
  - Track refund history

- **Export Functionality**
  - Export payment reports to Excel
  - Customizable date ranges

### 5. **Notification Center**
- Real-time notifications for:
  - New warehouse submissions
  - New booking requests
  - Payment updates
- Filter notifications by type
- Mark as read/unread
- Delete notifications
- Unread count badge

### 6. **User Management** (Coming Soon)
- View all platform users
- Manage user roles
- User activity tracking

### 7. **Settings Panel**
- Platform configuration
- Email notification preferences
- Fee structure management

## Technical Stack

### Frontend
- **React.js** - UI framework
- **Tailwind CSS** - Styling
- **Heroicons** - Icons
- **Recharts** - Data visualization
- **GSAP** - Animations
- **Axios** - API client
- **Socket.io-client** - Real-time updates
- **XLSX** - Excel export

### Backend
- **Node.js/Express.js** - Server framework
- **MongoDB/Mongoose** - Database
- **Razorpay** - Payment gateway
- **Socket.io** - Real-time communication

## File Structure

```
farmerai-frontend/src/
├── pages/
│   ├── EnhancedAdminDashboard.jsx    # Main dashboard layout
│   └── AdminWarehouseDashboard.jsx   # Warehouse/Booking management
├── components/admin/
│   ├── OverviewDashboard.jsx         # Dashboard overview with charts
│   ├── PaymentManagement.jsx         # Payment tracking & refunds
│   └── NotificationCenter.jsx        # Notification panel
└── services/
    ├── apiClient.js                  # API service
    └── realtimeClient.js             # WebSocket service

FarmerAI-backend/src/
├── controllers/
│   └── admin.controller.js           # Admin API logic
├── routes/
│   └── admin.routes.js               # Admin API routes
└── models/
    ├── Warehouse.js
    ├── Booking.js
    ├── Payment.js
    └── Notification.js               # Notification model
```

## API Endpoints

### Analytics & Stats
```
GET /api/admin/stats                  # Overview statistics
GET /api/admin/analytics              # Chart data
GET /api/admin/analytics/warehouses   # Warehouse analytics
GET /api/admin/analytics/bookings     # Booking analytics
GET /api/admin/analytics/payments     # Payment analytics
```

### Warehouse Management
```
GET    /api/admin/warehouses          # List warehouses
GET    /api/admin/warehouses/:id      # Get warehouse details
PATCH  /api/admin/warehouses/:id/verify  # Approve/Reject warehouse
DELETE /api/admin/warehouses/:id      # Delete warehouse
```

### Booking Management
```
GET   /api/admin/bookings             # List bookings
GET   /api/admin/bookings/:id         # Get booking details
PATCH /api/admin/bookings/:id/status  # Update booking status
```

### Payment Management
```
GET  /api/admin/payments              # List payments
GET  /api/admin/payments/:id          # Get payment details
POST /api/admin/payments/:id/refund   # Process refund
```

### Notifications
```
GET    /api/admin/notifications       # Get notifications
PATCH  /api/admin/notifications/:id/read  # Mark as read
PATCH  /api/admin/notifications/read-all  # Mark all as read
DELETE /api/admin/notifications/:id   # Delete notification
```

## Installation & Setup

### 1. Install Dependencies
```bash
# Frontend
cd farmerai-frontend
npm install xlsx

# Backend (if not already installed)
cd FarmerAI-backend
npm install
```

### 2. Environment Variables

**Backend (.env)**
```env
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_uri
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key
```

### 3. Run the Application

**Backend**
```bash
cd FarmerAI-backend
node server.js
```

**Frontend**
```bash
cd farmerai-frontend
npm run dev
```

### 4. Access Admin Dashboard
```
URL: http://localhost:5173/admin
Login: abhijithmna ir2002@gmail.com / Admin@123
```

## Usage Guide

### Accessing the Dashboard
1. Login with admin credentials
2. Navigate to `/admin` or click "Admin Console" in the navigation

### Managing Warehouses
1. Click "Warehouses" in the sidebar
2. Use filters to find specific warehouses
3. Click "View Details" to see full information
4. Use "Approve" or "Reject" buttons for pending warehouses

### Managing Bookings
1. Click "Bookings" in the sidebar
2. Filter by status to find specific bookings
3. Use quick action buttons:
   - **Approve** - Confirm the booking
   - **Reject** - Decline with reason
   - **Mark Completed** - Close the booking

### Managing Payments
1. Click "Payments" in the sidebar
2. View payment summary cards
3. Use filters to search transactions
4. Click "Refund" on completed payments to process refunds
5. Click "Export Report" to download Excel file

### Viewing Notifications
1. Click the bell icon in the header
2. Filter by type (All, Warehouse, Booking, Payment)
3. Click "Mark as read" or "Mark all as read"
4. Delete unwanted notifications

## Real-time Features

The dashboard includes real-time updates via WebSocket:
- New warehouse submissions trigger notifications
- New booking requests appear instantly
- Payment status updates reflect immediately
- Charts and stats refresh automatically

## Security

- **Authentication Required**: All admin routes require valid JWT token
- **Role-Based Access**: Only users with 'admin' role can access
- **Secure Payment Processing**: Razorpay integration with signature verification
- **Input Validation**: All inputs are validated on both client and server

## Performance Optimizations

- **Pagination**: Large datasets are paginated
- **Lazy Loading**: Charts load only when needed
- **Debounced Search**: Search inputs are debounced
- **Optimized Queries**: Database queries use indexes
- **Caching**: Frequently accessed data is cached

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Charts not displaying
- Ensure `recharts` is installed: `npm install recharts`
- Check browser console for errors

### Real-time updates not working
- Verify WebSocket connection in browser DevTools
- Check backend Socket.io configuration

### Excel export failing
- Install xlsx: `npm install xlsx`
- Check browser permissions for downloads

### 500 errors on admin routes
- Verify admin role is set correctly
- Check MongoDB connection
- Review backend logs

## Future Enhancements

- [ ] User management interface
- [ ] Advanced analytics with custom date ranges
- [ ] Bulk operations for warehouses and bookings
- [ ] Email template customization
- [ ] Audit log for admin actions
- [ ] Role-based permissions (super admin, moderator)
- [ ] Dark mode support
- [ ] Mobile responsive improvements

## Support

For issues or questions:
- Check the logs in browser console and backend terminal
- Review API responses in Network tab
- Contact development team

## License

Proprietary - Farmer AI Platform

---

**Last Updated**: January 2025
**Version**: 1.0.0
