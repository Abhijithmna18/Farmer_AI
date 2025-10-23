# Growth Calendar Admin Feature

## Overview
This document describes the implementation of the Growth Calendar management feature in the FarmerAI Admin Console. The feature allows administrators to manage all farmer growth calendars through a comprehensive CRUD interface with calendar visualization.

## Features Implemented

### Backend
1. **REST API Endpoints** (`/api/admin/growth-calendar`):
   - `GET /` - Fetch all growth calendars with pagination and filtering
   - `POST /` - Create a new growth calendar entry
   - `GET /:id` - Get a specific growth calendar by ID
   - `PUT /:id` - Update an existing growth calendar
   - `DELETE /:id` - Delete a growth calendar

2. **Data Model**:
   - Extended existing `GrowthCalendar` model with admin management capabilities
   - Support for all required fields: cropName, variety, plantingDate, estimatedHarvestDate, season, year, isActive, notes

3. **Controller Functions**:
   - Added `getGrowthCalendars`, `createGrowthCalendar`, `getGrowthCalendarById`, `updateGrowthCalendar`, `deleteGrowthCalendar` to admin controller
   - Proper error handling and validation
   - Pagination and search functionality

### Frontend
1. **Admin Growth Calendar Page** (`/admin/dashboard/calendar`):
   - Responsive table view showing all growth calendars
   - Calendar visualization using React Big Calendar
   - Search and filter capabilities
   - Create, view, edit, and delete modals
   - Pagination controls

2. **UI Components**:
   - Stat cards for quick overview
   - Filter sidebar with collapsible sections
   - Modal forms with validation
   - Responsive design for all screen sizes
   - Dark mode support

3. **Navigation**:
   - Added "Growth Calendar" link to admin sidebar when on admin routes

## Technical Details

### Backend Implementation
- **File**: `src/controllers/admin.controller.js`
- **Routes**: `src/routes/admin.routes.js`
- **Model**: `src/models/GrowthCalendar.js` (existing, extended)

### Frontend Implementation
- **Page Component**: `src/pages/Admin/sections/CalendarPage.jsx`
- **Navigation**: `src/components/TabNav.jsx`
- **Styling**: Tailwind CSS with Framer Motion animations

### API Endpoints

#### Get All Growth Calendars
```
GET /api/admin/growth-calendar
Query Parameters:
- page (default: 1)
- limit (default: 10)
- search (optional)
- season (optional)
- year (optional)
- isActive (optional)
```

#### Create Growth Calendar
```
POST /api/admin/growth-calendar
Body:
{
  "cropName": "string*",
  "variety": "string",
  "plantingDate": "date*",
  "estimatedHarvestDate": "date",
  "season": "string",
  "year": "number",
  "isActive": "boolean",
  "notes": "string"
}
```

#### Get Growth Calendar by ID
```
GET /api/admin/growth-calendar/:id
```

#### Update Growth Calendar
```
PUT /api/admin/growth-calendar/:id
Body: (same as create, all fields optional)
```

#### Delete Growth Calendar
```
DELETE /api/admin/growth-calendar/:id
```

## Testing

### Postman Collection
A Postman collection is provided at `FarmerAI-backend/postman/Growth_Calendar_Admin_API_Collection.json` for testing all endpoints.

### Manual Testing
1. Start both backend and frontend servers
2. Navigate to `/admin/dashboard/calendar` as an admin user
3. Test all CRUD operations through the UI
4. Verify calendar visualization works correctly

## Dependencies
- React Big Calendar for calendar visualization
- Framer Motion for animations
- Lucide React for icons
- Tailwind CSS for styling

## Future Enhancements
1. Export to Excel/PDF functionality
2. Email reminder system for upcoming events
3. Advanced filtering and sorting options
4. Bulk operations for multiple calendars
5. Integration with weather APIs for planting recommendations

## Troubleshooting
1. **Port Conflicts**: Ensure backend runs on port 5002 (updated from 5000)
2. **Authentication**: Make sure admin token is valid for all requests
3. **CORS Issues**: Verify CORS origin is set to frontend URL

## Files Modified
- `FarmerAI-backend/src/controllers/admin.controller.js`
- `FarmerAI-backend/src/routes/admin.routes.js`
- `farmerai-frontend/src/pages/Admin/sections/CalendarPage.jsx`
- `farmerai-frontend/src/components/TabNav.jsx`
- `FarmerAI-backend/.env`
- `farmerai-frontend/.env`