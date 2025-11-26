const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const { uuidValidation } = require('../middleware/validation');
const { body } = require('express-validator');
const { validate } = require('../middleware/validation');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management endpoints
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create order from cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Cart is empty or insufficient stock
 *   get:
 *     summary: Get user's orders or all orders (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of orders
 */
router.post('/', authenticate, orderController.createOrder);
router.get('/', authenticate, (req, res, next) => {
  if (req.user.role === 'admin') {
    return orderController.getAllOrders(req, res, next);
  }
  return orderController.getUserOrders(req, res, next);
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Order details
 *       404:
 *         description: Order not found
 *   put:
 *     summary: Update order status (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, completed, cancelled]
 *     responses:
 *       200:
 *         description: Order status updated
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Order not found
 */
router.get('/:id', authenticate, uuidValidation, orderController.getOrderById);
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  uuidValidation,
  [body('status').isIn(['pending', 'processing', 'completed', 'cancelled']).withMessage('Invalid status'), validate],
  orderController.updateOrderStatus
);

module.exports = router;
