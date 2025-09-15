const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// ===== COMMUNITY POSTS =====
router.get('/posts', communityController.getPosts);
router.get('/posts/:id', communityController.getPost);
router.post('/posts', authenticateToken, communityController.createPost);
router.put('/posts/:id', authenticateToken, communityController.updatePost);
router.delete('/posts/:id', authenticateToken, communityController.deletePost);
router.post('/posts/:id/like', authenticateToken, communityController.toggleLike);
router.post('/posts/:id/comments', authenticateToken, communityController.addComment);

// ===== COMMUNITY GROUPS =====
router.get('/groups', communityController.getGroups);
router.get('/groups/:id', communityController.getGroup);
router.post('/groups', authenticateToken, communityController.createGroup);
router.post('/groups/:id/join', authenticateToken, communityController.joinGroup);
router.post('/groups/:id/leave', authenticateToken, communityController.leaveGroup);

// ===== COMMUNITY POLLS =====
router.get('/polls', communityController.getPolls);
router.get('/polls/:id', communityController.getPoll);
router.post('/polls', authenticateToken, communityController.createPoll);
router.post('/polls/:id/vote', authenticateToken, communityController.votePoll);

// ===== KNOWLEDGE BASE =====
router.get('/articles', communityController.getArticles);
router.get('/articles/:id', communityController.getArticle);
router.get('/articles/slug/:slug', communityController.getArticleBySlug);
router.post('/articles/:id/like', authenticateToken, communityController.toggleArticleLike);
router.post('/articles/:id/bookmark', authenticateToken, communityController.toggleArticleBookmark);
router.post('/articles/:id/rate', authenticateToken, communityController.rateArticle);

// ===== DASHBOARD =====
router.get('/dashboard', communityController.getDashboardStats);

module.exports = router;
