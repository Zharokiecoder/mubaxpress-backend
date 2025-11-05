const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'wishlist',
        populate: {
          path: 'vendor',
          select: 'fullName university profileImage rating'
        }
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      wishlist: user.wishlist
    });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wishlist',
      error: error.message
    });
  }
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
router.post('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already in wishlist
    if (user.wishlist.includes(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Product already in wishlist'
      });
    }

    // Add to wishlist
    user.wishlist.push(productId);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Product added to wishlist',
      wishlist: user.wishlist
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to wishlist',
      error: error.message
    });
  }
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
router.delete('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Remove from wishlist
    user.wishlist = user.wishlist.filter(
      id => id.toString() !== productId
    );
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Product removed from wishlist',
      wishlist: user.wishlist
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from wishlist',
      error: error.message
    });
  }
});

// @desc    Check if product is in wishlist
// @route   GET /api/wishlist/check/:productId
// @access  Private
router.get('/check/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const inWishlist = user.wishlist.includes(productId);

    res.status(200).json({
      success: true,
      inWishlist
    });
  } catch (error) {
    console.error('Check wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check wishlist',
      error: error.message
    });
  }
});

module.exports = router;