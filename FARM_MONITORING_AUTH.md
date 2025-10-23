# Farm Monitoring Authentication Guide

## Issue
The farm monitoring endpoint (`/api/farm-monitoring/latest`) requires authentication and returns a 401 error when accessed without a valid token.

## Root Cause
The farm monitoring API endpoints are protected and require a valid authentication token. When users try to access these endpoints without being logged in or with an invalid/expired token, they receive authentication errors.

## Solution

### 1. Ensure User is Logged In
Users must be logged in through the application's authentication system before accessing farm monitoring features.

### 2. Token Storage
The application automatically stores the authentication token in localStorage after successful login.

### 3. Token Validation
The API client automatically includes the token in the Authorization header for all requests:
```
Authorization: Bearer <token>
```

## Troubleshooting Steps

### If you're seeing 401 errors:

1. **Verify Login Status**
   - Make sure you're logged into the application
   - Check if your session is still active

2. **Check Token in localStorage**
   - Open browser developer tools
   - Go to Application/Storage tab
   - Look for a "token" entry in localStorage

3. **Token Expiration**
   - If the token is expired, log out and log back in
   - Firebase tokens typically expire after 1 hour

4. **Network Issues**
   - Ensure the backend server is running
   - Check that you can access other authenticated endpoints

### Manual Token Testing
You can test the endpoint manually using curl:

```bash
# Get your token from localStorage in the browser
# Then use it in the Authorization header:

curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:5000/api/farm-monitoring/latest
```

## Common Error Responses

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required",
  "error": "Missing Authorization header. Please log in to access this resource."
}
```

### Invalid Token
```json
{
  "success": false,
  "message": "Authentication failed",
  "error": "Token verification failed. Please log in again."
}
```

## For Developers

### Authentication Flow
1. User logs in through Firebase or backend authentication
2. Token is stored in localStorage
3. API client automatically includes token in requests
4. Backend validates token using Firebase Admin SDK or JWT verification
5. If valid, request proceeds; if invalid, 401 error is returned

### Required Headers
All requests to protected endpoints must include:
```
Authorization: Bearer <valid_token>
```

### Debugging Authentication
Enable detailed logging in the auth middleware by checking the server console output for authentication debug messages.