const express = require('express');
const {
  sendMessage,
  getConversation,
  getAllConversations,
  getUnreadCount,
  markAsRead,
  deleteMessage
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

router.post('/', sendMessage);
router.get('/conversations', getAllConversations);
router.get('/unread-count', getUnreadCount);
router.get('/conversation/:userId', getConversation);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteMessage);

module.exports = router;