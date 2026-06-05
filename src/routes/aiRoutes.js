const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { freeModel, premiumModel, purgeCache } = require('../controllers/aiController');

const router = express.Router();

// All routes below require a valid access token
router.use(protect);

// Any logged-in user (Free_User, Premium_User, Admin)
router.get('/free-model', freeModel);

// Premium subscribers and admins only
router.post('/premium-model', restrictTo('Premium_User', 'Admin'), premiumModel);

// Admins only
router.delete('/purge-cache', restrictTo('Admin'), purgeCache);

module.exports = router;
