
// Debug script to check user role and authentication status
// Run this in the browser console when on the admin blogs page

console.log('=== USER ROLE DEBUG ===');

// Check localStorage for user data
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');
const email = localStorage.getItem('email');
const userId = localStorage.getItem('userId');

console.log('Token exists:', !!token);
console.log('Token length:', token ? token.length : 0);
console.log('Role:', role);
console.log('Email:', email);
console.log('User ID:', userId);

// Check if we can make an authenticated request
if (token) {
  fetch('/api/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('Auth check response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('User data from backend:', data);
    console.log('User role from backend:', data.user?.role);
    console.log('User roles array:', data.user?.roles);
    console.log('Is admin?', data.user?.role === 'admin' || data.user?.roles?.includes('admin'));
  })
  .catch(error => {
    console.error('Auth check failed:', error);
  });
} else {
  console.log('No token found - user not authenticated');
}

// Test blog creation endpoint
if (token) {
  const testFormData = new FormData();
  testFormData.append('title', 'Test Blog Post');
  testFormData.append('content', 'This is a test blog post');
  testFormData.append('excerpt', 'Test excerpt');
  testFormData.append('category', 'general');
  testFormData.append('isPublished', 'false');
  
  fetch('/api/blogs', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: testFormData
  })
  .then(response => {
    console.log('Blog creation test response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Blog creation test response:', data);
  })
  .catch(error => {
    console.error('Blog creation test failed:', error);
  });
}
