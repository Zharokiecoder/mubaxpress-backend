const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
exports.getAllProducts = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, condition, search, university, sort } = req.query;
    
    let query = { isActive: true };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Filter by condition
    if (condition) {
      query.condition = condition;
    }

    // Filter by university
    if (university) {
      query['location.university'] = university;
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === 'price-low') sortOption = { price: 1 };
    if (sort === 'price-high') sortOption = { price: -1 };
    if (sort === 'popular') sortOption = { views: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };

    const products = await Product.find(query)
      .populate('vendor', 'fullName profileImage university rating')
      .sort(sortOption);

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('vendor', 'fullName email phoneNumber profileImage university rating')
      .populate('reviews.user', 'fullName profileImage');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment views
    product.views += 1;
    await product.save();

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// @desc    Create product
// @route   POST /api/products
// @access  Private (Vendor only)
exports.createProduct = async (req, res) => {
  try {
    // Add vendor to request body
    req.body.vendor = req.user.id;

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private (Vendor - owner only)
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    if (product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this product'
      });
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private (Vendor - owner only or Admin)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check ownership
    if (product.vendor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this product'
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// @desc    Get vendor's products
// @route   GET /api/products/vendor/my-products
// @access  Private (Vendor only)
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ vendor: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

// @desc    Add review to product
// @route   POST /api/products/:id/reviews
// @access  Private
exports.addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(
      review => review.user.toString() === req.user.id
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    const review = {
      user: req.user.id,
      rating: Number(rating),
      comment
    };

    product.reviews.push(review);
    product.calculateAverageRating();

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error adding review',
      error: error.message
    });
  }
};