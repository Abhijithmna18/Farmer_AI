const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');
const communityController = require('../controllers/community.controller');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profile-pictures/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Join request routes (public - no authentication required)
router.post('/join-request', upload.single('profilePhoto'), communityController.submitJoinRequest);

// All other routes require authentication
router.use(authenticateToken);

// Posts routes
router.get('/posts', communityController.getApprovedPosts);
router.get('/posts/pending', requireRole(['admin']), communityController.getPendingPosts);
router.get('/posts/my-posts', communityController.getMyPosts);
router.get('/posts/:id', communityController.getPostById);
router.post('/posts', communityController.createPost);
router.put('/posts/:id', communityController.updatePost);
router.delete('/posts/:id', communityController.deletePost);

// Comments routes
router.get('/posts/:postId/comments', communityController.getPostComments);
router.get('/comments/pending', requireRole(['admin']), communityController.getPendingComments);
router.get('/comments/my-comments', communityController.getMyComments);
router.post('/posts/:postId/comments', communityController.createComment);
router.put('/comments/:id', communityController.updateComment);
router.delete('/comments/:id', communityController.deleteComment);

// Voting routes
router.post('/posts/:id/upvote', communityController.upvotePost);
router.post('/posts/:id/downvote', communityController.downvotePost);
router.post('/comments/:id/upvote', communityController.upvoteComment);
router.post('/comments/:id/downvote', communityController.downvoteComment);

// Events routes
router.get('/events', communityController.getApprovedEvents);
router.get('/events/pending', requireRole(['admin']), communityController.getPendingEvents);
router.get('/events/my-events', communityController.getMyEvents);
router.get('/events/:id', communityController.getEventById);
router.post('/events', communityController.createEvent);
router.put('/events/:id', communityController.updateEvent);
router.delete('/events/:id', communityController.deleteEvent);
router.post('/events/:id/register', communityController.registerForEvent);
router.delete('/events/:id/unregister', communityController.unregisterFromEvent);

// Profiles routes
router.get('/profiles', communityController.getApprovedProfiles);
router.get('/profiles/pending', requireRole(['admin']), communityController.getPendingProfiles);
router.get('/profiles/my-profile', communityController.getMyProfile);
router.get('/profiles/:id', communityController.getProfileById);
router.post('/profiles', communityController.createProfile);
router.put('/profiles/:id', communityController.updateProfile);

// Search routes
router.get('/search', communityController.searchContent);

// Reports routes
router.post('/reports', communityController.createReport);
router.get('/reports', requireRole(['admin']), communityController.getReports);
router.put('/reports/:id', requireRole(['admin']), communityController.updateReport);

// Admin approval routes
router.put('/admin/posts/:id/approve', requireRole(['admin']), communityController.approvePost);
router.put('/admin/posts/:id/reject', requireRole(['admin']), communityController.rejectPost);
router.put('/admin/posts/:id/edit', requireRole(['admin']), communityController.editPost);
router.put('/admin/comments/:id/approve', requireRole(['admin']), communityController.approveComment);
router.put('/admin/comments/:id/reject', requireRole(['admin']), communityController.rejectComment);
router.put('/admin/comments/:id/edit', requireRole(['admin']), communityController.editComment);
router.put('/admin/events/:id/approve', requireRole(['admin']), communityController.approveEvent);
router.put('/admin/events/:id/reject', requireRole(['admin']), communityController.rejectEvent);
router.put('/admin/events/:id/edit', requireRole(['admin']), communityController.editEvent);
router.put('/admin/profiles/:id/approve', requireRole(['admin']), communityController.approveProfile);
router.put('/admin/profiles/:id/reject', requireRole(['admin']), communityController.rejectProfile);
router.put('/admin/profiles/:id/suspend', requireRole(['admin']), communityController.suspendProfile);

// Admin dashboard routes
router.get('/admin/dashboard', requireRole(['admin']), communityController.getAdminDashboard);
router.get('/admin/stats', requireRole(['admin']), communityController.getAdminStats);

// Join request routes (authenticated)
router.get('/user-approval-status', communityController.getUserApprovalStatus);
router.get('/admin/join-requests', requireRole(['admin']), communityController.getPendingJoinRequests);
router.get('/admin/community-requests', requireRole(['admin']), communityController.getAllCommunityRequests);
router.put('/admin/community-requests/:id/approve', requireRole(['admin']), communityController.approveJoinRequest);
router.put('/admin/community-requests/:id/reject', requireRole(['admin']), communityController.rejectJoinRequest);

module.exports = router;
