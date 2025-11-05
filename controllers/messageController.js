const Message = require('../models/Message');
const User = require('../models/User');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, content, productReference } = req.body;

    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient not found'
      });
    }

    // Can't send message to yourself
    if (recipientId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    const message = await Message.create({
      sender: req.user.id,
      recipient: recipientId,
      content,
      productReference
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'fullName profileImage')
      .populate('recipient', 'fullName profileImage')
      .populate('productReference', 'title price images');

    res.status(201).json({
      success: true,
      message: populatedMessage
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error sending message',
      error: error.message
    });
  }
};

// @desc    Get conversation between two users
// @route   GET /api/messages/conversation/:userId
// @access  Private
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: req.user.id, recipient: userId },
        { sender: userId, recipient: req.user.id }
      ]
    })
      .populate('sender', 'fullName profileImage')
      .populate('recipient', 'fullName profileImage')
      .populate('productReference', 'title price images')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { sender: userId, recipient: req.user.id, isRead: false },
      { isRead: true, readAt: Date.now() }
    );

    res.status(200).json({
      success: true,
      count: messages.length,
      messages
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching conversation',
      error: error.message
    });
  }
};

// @desc    Get all conversations for current user
// @route   GET /api/messages/conversations
// @access  Private
exports.getAllConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all unique users the current user has communicated with
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }]
    })
      .populate('sender', 'fullName profileImage')
      .populate('recipient', 'fullName profileImage')
      .sort({ createdAt: -1 });

    // Group by conversation partner
    const conversationsMap = new Map();

    messages.forEach(message => {
      const partnerId = message.sender._id.toString() === userId 
        ? message.recipient._id.toString() 
        : message.sender._id.toString();

      if (!conversationsMap.has(partnerId)) {
        const partner = message.sender._id.toString() === userId 
          ? message.recipient 
          : message.sender;

        conversationsMap.set(partnerId, {
          partner,
          lastMessage: message,
          unreadCount: 0
        });
      }

      // Count unread messages
      if (message.recipient._id.toString() === userId && !message.isRead) {
        conversationsMap.get(partnerId).unreadCount++;
      }
    });

    const conversations = Array.from(conversationsMap.values());

    res.status(200).json({
      success: true,
      count: conversations.length,
      conversations
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching conversations',
      error: error.message
    });
  }
};

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      count
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message
    });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only recipient can mark as read
    if (message.recipient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    message.isRead = true;
    message.readAt = Date.now();
    await message.save();

    res.status(200).json({
      success: true,
      message
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error marking message as read',
      error: error.message
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete their message
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this message'
      });
    }

    await message.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error deleting message',
      error: error.message
    });
  }
};