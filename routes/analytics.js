const express = require('express');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');

const router = express.Router();

// @desc    Get dashboard analytics
// @route   GET /api/analytics/dashboard
// @access  Public
router.get('/dashboard', async (req, res) => {
  try {
    // Simple working queries - like before
    const orders = await Order.find().limit(20);
    const products = await Product.find().limit(20);
    
    // Calculate analytics
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => order.status === 'pending').length;
    const processingOrders = orders.filter(order => order.status === 'processing').length;
    const shippedOrders = orders.filter(order => order.status === 'shipped').length;
    const deliveredOrders = orders.filter(order => order.status === 'delivered').length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
    
    // Calculate revenue from delivered orders only
    const deliveredOrdersList = orders.filter(order => order.status === 'delivered');
    const totalRevenue = deliveredOrdersList.reduce((sum, order) => {
      return sum + (order.totalPrice || 0);
    }, 0);
    
    // Calculate average order value from delivered orders
    const averageOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;
    
    // Get recent activity (last 10 orders, excluding cancelled)
    const recentOrders = orders
      .filter(order => order.status !== 'cancelled')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 10);
    
    const recentActivity = recentOrders.map(order => ({
      type: 'order',
      message: `Order #${order._id.toString().slice(-6)} - ${order.status}`,
      amount: order.totalPrice || 0,
      date: order.createdAt,
      status: order.status
    }));

    res.status(200).json({
      status: 'success',
      data: {
        totalOrders,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue,
        averageOrderValue,
        totalProducts: products.length,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @desc    Get order statistics
// @route   GET /api/analytics/orders
// @access  Public
router.get('/orders', async (req, res) => {
  try {
    const orders = await Order.find().limit(20);
    
    const stats = {
      total: orders.length,
      pending: orders.filter(order => order.status === 'pending').length,
      processing: orders.filter(order => order.status === 'processing').length,
      shipped: orders.filter(order => order.status === 'shipped').length,
      delivered: orders.filter(order => order.status === 'delivered').length,
      cancelled: orders.filter(order => order.status === 'cancelled').length
    };

    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

// @desc    Get revenue statistics
// @route   GET /api/analytics/revenue
// @access  Public
router.get('/revenue', async (req, res) => {
  try {
    const deliveredOrders = await Order.find({ status: 'delivered' }).limit(20);
    
    const totalRevenue = deliveredOrders.reduce((sum, order) => {
      return sum + (order.totalPrice || 0);
    }, 0);
    
    const averageOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;

    res.status(200).json({
      status: 'success',
      data: {
        totalRevenue,
        averageOrderValue,
        deliveredOrders: deliveredOrders.length
      }
    });
  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error'
    });
  }
});

module.exports = router; 