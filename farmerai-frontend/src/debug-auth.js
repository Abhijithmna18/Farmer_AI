// Debug script to check authentication status
import { auth } from './firebase';

console.log('=== Authentication Debug Info ===');
console.log('Firebase Auth Current User:', auth.currentUser);
console.log('LocalStorage Token:', localStorage.getItem('token'));
console.log('SessionStorage Token:', sessionStorage.getItem('token'));
console.log('User Email:', localStorage.getItem('email'));
console.log('User Role:', localStorage.getItem('role'));

// Test token validity
const token = localStorage.getItem('token');
if (token) {
  try {
    // Basic token structure check
    const parts = token.split('.');
    if (parts.length === 3) {
      console.log('✅ Token appears to be valid JWT format');
      const payload = JSON.parse(atob(parts[1]));
      console.log('Token payload:', payload);
      if (payload.exp) {
        const isExpired = Date.now() >= payload.exp * 1000;
        console.log('Token expired:', isExpired);
        if (isExpired) {
          console.log('❌ Token is expired');
        } else {
          console.log('✅ Token is not expired');
        }
      }
    } else {
      console.log('✅ Token appears to be Firebase ID token');
    }
  } catch (error) {
    console.error('❌ Error parsing token:', error);
  }
} else {
  console.log('❌ No token found');
}

// Test Firebase auth state
auth.onAuthStateChanged((user) => {
  console.log('Firebase Auth State Changed:', user ? 'User logged in' : 'User logged out');
  if (user) {
    console.log('User UID:', user.uid);
    console.log('User Email:', user.email);
  }
});
