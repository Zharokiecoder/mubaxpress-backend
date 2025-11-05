const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  productReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  attachments: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;