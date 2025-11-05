const express = require('express');
const {
  createOrder,
  initializePayment,
  verifyPayment,
  getMyOrders,
  getOrder
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', createOrder);
router.post('/:id/pay', initializePayment);
router.get('/verify/:reference', verifyPayment);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrder);

module.exports = router;