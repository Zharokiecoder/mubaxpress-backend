const User = require('../models/User');
const Product = require('../models/Product');

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isActive, search } = req.query;
    
    let query = {};

    if (role) {
      query.role = role;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query).select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Public
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If it's a vendor, get their products
    let products = [];
    if (user.role === 'vendor') {
      products = await Product.find({ vendor: user._id, isActive: true })
        .select('title price images category rating')
        .limit(10);
    }

    res.status(200).json({
      success: true,
      user,
      products
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// @desc    Deactivate user (Admin only)
// @route   PUT /api/users/:id/deactivate
// @access  Private/Admin
exports.deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error deactivating user',
      error: error.message
    });
  }
};

// @desc    Activate user (Admin only)
// @route   PUT /api/users/:id/activate
// @access  Private/Admin
exports.activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'User activated successfully',
      user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error activating user',
      error: error.message
    });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If vendor, also delete their products
    if (user.role === 'vendor') {
      await Product.deleteMany({ vendor: user._id });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// @desc    Get dashboard statistics (Admin only)
// @route   GET /api/users/admin/statistics
// @access  Private/Admin
exports.getStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalVendors = await User.countDocuments({ role: 'vendor' });
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });

    res.status(200).json({
      success: true,
      statistics: {
        totalUsers,
        totalStudents,
        totalVendors,
        totalProducts,
        activeProducts
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
};