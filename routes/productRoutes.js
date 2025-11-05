const express = require('express');
const {
  getAllProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  addReview
} = require('../controllers/productController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getAllProducts);
router.get('/vendor/my-products', protect, restrictTo('vendor'), getMyProducts);
router.get('/:id', getProduct);

router.post('/', protect, restrictTo('vendor', 'admin'), createProduct);
router.put('/:id', protect, restrictTo('vendor', 'admin'), updateProduct);
router.delete('/:id', protect, restrictTo('vendor', 'admin'), deleteProduct);

router.post('/:id/reviews', protect, addReview);

module.exports = router;