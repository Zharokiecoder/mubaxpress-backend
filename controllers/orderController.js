const Order = require('../models/Order');
const Product = require('../models/Product');
const axios = require('axios');


// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const { items, deliveryAddress, notes } = req.body;

    // Validate products and calculate total
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product ${item.product} not found`
        });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.title}`
        });
      }

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });

      totalAmount += product.price * item.quantity;
    }

    // Create order
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      deliveryAddress,
      notes
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'fullName email phoneNumber')
      .populate('items.product', 'title images vendor');

    res.status(201).json({
      success: true,
      order: populatedOrder
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error creating order',
      error: error.message
    });
  }
};

// @desc    Initialize Paystack payment
// @route   POST /api/orders/:id/pay
// @access  Private
exports.initializePayment = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Initialize Paystack payment
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email: order.user.email,
        amount: order.totalAmount * 100, // Convert to kobo
        reference: `ORDER-${order._id}-${Date.now()}`,
        callback_url: `${process.env.CLIENT_URL}/order-success`,
        metadata: {
          order_id: order._id,
          user_id: order.user._id
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Update order with payment reference
    order.paymentReference = response.data.data.reference;
    await order.save();

    res.status(200).json({
      success: true,
      data: response.data.data
    });
  } catch (error) {
    console.error('Paystack error:', error.response?.data || error.message);
    res.status(400).json({
      success: false,
      message: 'Error initializing payment',
      error: error.message
    });
  }
};

// @desc    Verify payment
// @route   GET /api/orders/verify/:reference
// @access  Private
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    // Verify payment with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    if (response.data.data.status === 'success') {
      // Update order
      const order = await Order.findOne({ paymentReference: reference });
      
      if (order) {
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        await order.save();

        // Update product stock
        for (const item of order.items) {
          await Product.findByIdAndUpdate(item.product, {
            $inc: { stockQuantity: -item.quantity }
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        order
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment verification failed'
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
};

// @desc    Get user orders
// @route   GET /api/orders/my-orders
// @access  Private
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('items.product', 'title images price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching orders',
      error: error.message
    });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'fullName email phoneNumber')
      .populate('items.product', 'title images price vendor');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check authorization
    if (order.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error fetching order',
      error: error.message
    });
  }
};