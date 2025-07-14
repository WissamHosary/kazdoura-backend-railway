const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { pool } = require('../config/database');
const Cart = require('../models/Cart');

// Initialize cart model
let cartModel;

// Initialize cart model with database connection
const initializeCartModel = async () => {
  try {
    cartModel = new Cart(pool);
    await cartModel.createTable();
  } catch (error) {
    console.error('Failed to initialize cart model:', error);
  }
};

// Initialize on startup
initializeCartModel();

// Get user's cart
router.get('/', protect, async (req, res) => {
  try {
    if (!cartModel) {
      return res.status(500).json({
        status: 'error',
        message: 'Cart model not initialized'
      });
    }
    const cart = await cartModel.getCart(req.user.id);
    res.json({
      status: 'success',
      data: cart
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get cart'
    });
  }
});

// Add item to cart
router.post('/', protect, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({
        status: 'error',
        message: 'Product ID is required'
      });
    }

    await cartModel.addItem(req.user.id, productId, quantity);
    
    // Get updated cart
    const cart = await cartModel.getCart(req.user.id);
    
    res.json({
      status: 'success',
      message: 'Item added to cart',
      data: cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to add item to cart'
    });
  }
});

// Update cart item quantity
router.put('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (quantity < 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Quantity must be positive'
      });
    }

    await cartModel.updateQuantity(req.user.id, productId, quantity);
    
    // Get updated cart
    const cart = await cartModel.getCart(req.user.id);
    
    res.json({
      status: 'success',
      message: 'Cart updated',
      data: cart
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update cart'
    });
  }
});

// Remove item from cart
router.delete('/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    await cartModel.removeItem(req.user.id, productId);
    
    // Get updated cart
    const cart = await cartModel.getCart(req.user.id);
    
    res.json({
      status: 'success',
      message: 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to remove item from cart'
    });
  }
});

// Clear entire cart
router.delete('/', protect, async (req, res) => {
  try {
    await cartModel.clearCart(req.user.id);
    
    res.json({
      status: 'success',
      message: 'Cart cleared',
      data: []
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to clear cart'
    });
  }
});

// Get cart count (number of items)
router.get('/count', protect, async (req, res) => {
  try {
    const count = await cartModel.getCartCount(req.user.id);
    
    res.json({
      status: 'success',
      data: { count }
    });
  } catch (error) {
    console.error('Get cart count error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get cart count'
    });
  }
});

// Get cart total (total price)
router.get('/total', protect, async (req, res) => {
  try {
    const total = await cartModel.getCartTotal(req.user.id);
    
    res.json({
      status: 'success',
      data: { total }
    });
  } catch (error) {
    console.error('Get cart total error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get cart total'
    });
  }
});

module.exports = router; 