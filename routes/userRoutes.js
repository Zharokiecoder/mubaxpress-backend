const express = require('express');
const {
  getAllUsers,
  getUser,
  updateUser,
  deactivateUser,
  activateUser,
  deleteUser,
  getStatistics
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/:id', getUser);

// Admin only routes
router.use(protect, restrictTo('admin'));

router.get('/', getAllUsers);
router.get('/admin/statistics', getStatistics);
router.put('/:id', updateUser);
router.put('/:id/deactivate', deactivateUser);
router.put('/:id/activate', activateUser);
router.delete('/:id', deleteUser);

module.exports = router;