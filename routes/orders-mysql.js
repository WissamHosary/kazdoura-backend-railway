const express = require('express');
const { pool } = require('../config/database');

const router = express.Router();

// @desc    Get all orders
// @route   GET /api/orders
// @access  Admin (for dashboard)
router.get('/', async (req, res) => {
  try {
    const [orders] = await pool.execute('SELECT * FROM orders ORDER BY created_at DESC');
    // Parse items JSON
    const formattedOrders = orders.map(order => ({
      ...order,
      items: order.items ? JSON.parse(order.items) : []
    }));
    res.status(200).json({ status: 'success', data: formattedOrders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Admin
router.get('/:id', async (req, res) => {
  try {
    const [orders] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (orders.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }
    const order = orders[0];
    order.items = order.items ? JSON.parse(order.items) : [];
    res.status(200).json({ status: 'success', data: order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// @desc    Create guest order (no authentication required)
// @route   POST /api/orders/guest
// @access  Public
router.post('/guest', async (req, res) => {
  try {
    const { customer, items, subtotal, delivery, total, status = 'pending', paymentMethod = 'cash_on_delivery' } = req.body;
    
    // Validate required fields
    if (!customer || !customer.name || !customer.email || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required fields: customer name, email, and items are required' 
      });
    }

    // Debug logging
    console.log('Creating guest order:', {
      customer: customer.name,
      city: customer.city,
      subtotal,
      delivery,
      total
    });

    // Prepare customer data
    const customerName = customer.name;
    const customerEmail = customer.email;
    const customerPhone = customer.phone || '';
    const customerAddress = `${customer.address1 || ''} ${customer.address2 || ''} ${customer.city || ''} ${customer.otherCity || ''}`.trim();
    
    // Prepare items data
    const orderItems = items.map(item => ({
      productId: item.productId || null,
      name: item.name,
      price: parseFloat(item.price),
      quantity: parseInt(item.quantity),
      image: item.image || null
    }));

    // Calculate totals
    const itemsPrice = subtotal || orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingPrice = delivery || 0;
    const totalPrice = total || (itemsPrice + shippingPrice);

    console.log('Creating order with data:', {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      itemsPrice,
      shippingPrice,
      totalPrice,
      status,
      paymentMethod
    });

    // Insert order into database
    const [result] = await pool.execute(
      `INSERT INTO orders (
        customer_name, 
        customer_email, 
        customer_phone, 
        customer_address, 
        items, 
        total_amount, 
        delivery_fee,
        status, 
        payment_method,
        is_guest_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        JSON.stringify(orderItems),
        totalPrice,
        shippingPrice,
        status,
        paymentMethod,
        true // is_guest_order
      ]
    );

    console.log('Order created successfully:', {
      orderId: result.insertId,
      itemsPrice,
      shippingPrice,
      totalPrice,
      isGuestOrder: true
    });

    res.status(201).json({
      status: 'success',
      message: 'Order created successfully',
      data: {
        id: result.insertId,
        customer: customer,
        items: orderItems,
        itemsPrice,
        shippingPrice,
        totalPrice,
        status,
        paymentMethod,
        isGuestOrder: true
      }
    });
  } catch (error) {
    console.error('Create guest order error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Server error during order creation'
    });
  }
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Public (website)
router.post('/', async (req, res) => {
  try {
    const { customer_name, customer_email, customer_phone, customer_address, items, total_amount, notes, delivery_fee } = req.body;
    if (!customer_name || !customer_email || !items || !total_amount) {
      return res.status(400).json({ status: 'error', message: 'Missing required fields' });
    }
    const [result] = await pool.execute(
      `INSERT INTO orders (customer_name, customer_email, customer_phone, customer_address, items, total_amount, notes, delivery_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_name,
        customer_email,
        customer_phone || '',
        customer_address || '',
        JSON.stringify(items),
        parseFloat(total_amount),
        notes || '',
        delivery_fee ? parseFloat(delivery_fee) : 0
      ]
    );
    res.status(201).json({ status: 'success', id: result.insertId });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ status: 'error', message: 'Server error during order creation' });
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Admin
router.put('/:id/status', async (req, res) => {
  try {
    const { status, payment_status } = req.body;
    if (!status && !payment_status) {
      return res.status(400).json({ status: 'error', message: 'No status provided' });
    }

    // Get the current order to check previous status
    const [currentOrder] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (currentOrder.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const order = currentOrder[0];
    const previousStatus = order.status;
    const items = order.items ? JSON.parse(order.items) : [];

    // Update order status
    const updateFields = [];
    const updateValues = [];
    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (payment_status) {
      updateFields.push('payment_status = ?');
      updateValues.push(payment_status);
    }
    updateValues.push(req.params.id);
    
    await pool.execute(`UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);

    // Handle stock updates based on status change
    if (status && status !== previousStatus) {
      if (status === 'completed' || status === 'delivered') {
        // Decrease stock when order is completed
        for (const item of items) {
          if (item.productId) {
            try {
              // Get current product stock
              const [products] = await pool.execute(
                'SELECT stock, color_stock FROM products WHERE id = ?',
                [item.productId]
              );
              
              if (products.length > 0) {
                const product = products[0];
                let newStock = product.stock;
                let newColorStock = product.color_stock;

                // Update regular stock
                if (product.stock !== null && product.stock !== undefined) {
                  newStock = Math.max(0, product.stock - item.quantity);
                }

                // Update color stock if exists
                if (product.color_stock && item.color) {
                  try {
                    const colorStock = JSON.parse(product.color_stock);
                    if (colorStock[item.color]) {
                      colorStock[item.color] = Math.max(0, colorStock[item.color] - item.quantity);
                      newColorStock = JSON.stringify(colorStock);
                    }
                  } catch (error) {
                    console.log('Error parsing color stock:', error);
                  }
                }

                // Update product stock
                await pool.execute(
                  'UPDATE products SET stock = ?, color_stock = ? WHERE id = ?',
                  [newStock, newColorStock, item.productId]
                );

                console.log(`Updated stock for product ${item.productId}: ${product.stock} -> ${newStock}`);
              }
            } catch (error) {
              console.error(`Error updating stock for product ${item.productId}:`, error);
            }
          }
        }
      } else if (status === 'cancelled' && (previousStatus === 'completed' || previousStatus === 'delivered')) {
        // Restore stock when order is cancelled after being completed
        for (const item of items) {
          if (item.productId) {
            try {
              // Get current product stock
              const [products] = await pool.execute(
                'SELECT stock, color_stock FROM products WHERE id = ?',
                [item.productId]
              );
              
              if (products.length > 0) {
                const product = products[0];
                let newStock = product.stock;
                let newColorStock = product.color_stock;

                // Update regular stock
                if (product.stock !== null && product.stock !== undefined) {
                  newStock = product.stock + item.quantity;
                }

                // Update color stock if exists
                if (product.color_stock && item.color) {
                  try {
                    const colorStock = JSON.parse(product.color_stock);
                    if (colorStock[item.color]) {
                      colorStock[item.color] = colorStock[item.color] + item.quantity;
                      newColorStock = JSON.stringify(colorStock);
                    }
                  } catch (error) {
                    console.log('Error parsing color stock:', error);
                  }
                }

                // Update product stock
                await pool.execute(
                  'UPDATE products SET stock = ?, color_stock = ? WHERE id = ?',
                  [newStock, newColorStock, item.productId]
                );

                console.log(`Restored stock for product ${item.productId}: ${product.stock} -> ${newStock}`);
              }
            } catch (error) {
              console.error(`Error restoring stock for product ${item.productId}:`, error);
            }
          }
        }
      }
    }

    res.status(200).json({ 
      status: 'success', 
      message: 'Order status updated successfully',
      stockUpdated: status === 'completed' || status === 'delivered' || status === 'cancelled'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ status: 'error', message: 'Server error during order update' });
  }
});

// @desc    Update order status (Dashboard)
// @route   PUT /api/orders/:id/status/dashboard
// @access  Admin
router.put('/:id/status/dashboard', async (req, res) => {
  try {
    const { status, payment_status } = req.body;
    if (!status && !payment_status) {
      return res.status(400).json({ status: 'error', message: 'No status provided' });
    }

    // Get the current order to check previous status
    const [currentOrder] = await pool.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (currentOrder.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const order = currentOrder[0];
    const previousStatus = order.status;
    const items = order.items ? JSON.parse(order.items) : [];

    // Update order status
    const updateFields = [];
    const updateValues = [];
    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (payment_status) {
      updateFields.push('payment_status = ?');
      updateValues.push(payment_status);
    }
    updateValues.push(req.params.id);
    
    await pool.execute(`UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);

    // Handle stock updates based on status change
    const updatedProducts = [];
    if (status && status !== previousStatus) {
      if (status === 'completed' || status === 'delivered') {
        // Decrease stock when order is completed
        for (const item of items) {
          if (item.productId) {
            try {
              // Get current product stock
              const [products] = await pool.execute(
                'SELECT stock, color_stock FROM products WHERE id = ?',
                [item.productId]
              );
              
              if (products.length > 0) {
                const product = products[0];
                let newStock = product.stock;
                let newColorStock = product.color_stock;

                // Update regular stock
                if (product.stock !== null && product.stock !== undefined) {
                  newStock = Math.max(0, product.stock - item.quantity);
                }

                // Update color stock if exists
                if (product.color_stock && item.color) {
                  try {
                    const colorStock = JSON.parse(product.color_stock);
                    if (colorStock[item.color]) {
                      colorStock[item.color] = Math.max(0, colorStock[item.color] - item.quantity);
                      newColorStock = JSON.stringify(colorStock);
                    }
                  } catch (error) {
                    console.log('Error parsing color stock:', error);
                  }
                }

                // Update product stock
                await pool.execute(
                  'UPDATE products SET stock = ?, color_stock = ? WHERE id = ?',
                  [newStock, newColorStock, item.productId]
                );

                updatedProducts.push({
                  id: item.productId,
                  name: item.name,
                  oldStock: product.stock,
                  newStock: newStock,
                  quantity: item.quantity
                });

                console.log(`Updated stock for product ${item.productId}: ${product.stock} -> ${newStock}`);
              }
            } catch (error) {
              console.error(`Error updating stock for product ${item.productId}:`, error);
            }
          }
        }
      } else if (status === 'cancelled' && (previousStatus === 'completed' || previousStatus === 'delivered')) {
        // Restore stock when order is cancelled after being completed
        for (const item of items) {
          if (item.productId) {
            try {
              // Get current product stock
              const [products] = await pool.execute(
                'SELECT stock, color_stock FROM products WHERE id = ?',
                [item.productId]
              );
              
              if (products.length > 0) {
                const product = products[0];
                let newStock = product.stock;
                let newColorStock = product.color_stock;

                // Update regular stock
                if (product.stock !== null && product.stock !== undefined) {
                  newStock = product.stock + item.quantity;
                }

                // Update color stock if exists
                if (product.color_stock && item.color) {
                  try {
                    const colorStock = JSON.parse(product.color_stock);
                    if (colorStock[item.color]) {
                      colorStock[item.color] = colorStock[item.color] + item.quantity;
                      newColorStock = JSON.stringify(colorStock);
                    }
                  } catch (error) {
                    console.log('Error parsing color stock:', error);
                  }
                }

                // Update product stock
                await pool.execute(
                  'UPDATE products SET stock = ?, color_stock = ? WHERE id = ?',
                  [newStock, newColorStock, item.productId]
                );

                updatedProducts.push({
                  id: item.productId,
                  name: item.name,
                  oldStock: product.stock,
                  newStock: newStock,
                  quantity: item.quantity
                });

                console.log(`Restored stock for product ${item.productId}: ${product.stock} -> ${newStock}`);
              }
            } catch (error) {
              console.error(`Error restoring stock for product ${item.productId}:`, error);
            }
          }
        }
      }
    }

    // Get updated analytics for dashboard
    const [totalOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders');
    const [pendingOrders] = await pool.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
    const [completedOrders] = await pool.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'");
    const [totalRevenue] = await pool.execute("SELECT SUM(total_amount) as total FROM orders WHERE status = 'completed'");

    res.status(200).json({ 
      status: 'success', 
      message: 'Order status updated successfully',
      stockUpdated: status === 'completed' || status === 'delivered' || status === 'cancelled',
      updatedProducts,
      analytics: {
        totalOrders: totalOrders[0].count,
        pendingOrders: pendingOrders[0].count,
        completedOrders: completedOrders[0].count,
        totalRevenue: totalRevenue[0].total || 0
      }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ status: 'error', message: 'Server error during order update' });
  }
});

// @desc    Get all orders (Dashboard)
// @route   GET /api/orders/dashboard
// @access  Admin
router.get('/dashboard', async (req, res) => {
  try {
    const [orders] = await pool.execute('SELECT * FROM orders ORDER BY created_at DESC');
    
    // Parse items JSON
    const formattedOrders = orders.map(order => ({
      ...order,
      items: order.items ? JSON.parse(order.items) : []
    }));

    // Get analytics
    const [totalOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders');
    const [pendingOrders] = await pool.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
    const [completedOrders] = await pool.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'");
    const [totalRevenue] = await pool.execute("SELECT SUM(total_amount) as total FROM orders WHERE status = 'completed'");

    res.status(200).json({ 
      status: 'success', 
      data: formattedOrders,
      analytics: {
        totalOrders: totalOrders[0].count,
        pendingOrders: pendingOrders[0].count,
        completedOrders: completedOrders[0].count,
        totalRevenue: totalRevenue[0].total || 0
      }
    });
  } catch (error) {
    console.error('Get dashboard orders error:', error);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Admin
router.delete('/:id', async (req, res) => {
  try {
    await pool.execute('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.status(200).json({ status: 'success', message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ status: 'error', message: 'Server error during order deletion' });
  }
});

// @desc    Delete all orders
// @route   DELETE /api/orders
// @access  Admin
router.delete('/', async (req, res) => {
  try {
    await pool.execute('DELETE FROM orders');
    res.status(200).json({ status: 'success', message: 'All orders deleted successfully' });
  } catch (error) {
    console.error('Delete all orders error:', error);
    res.status(500).json({ status: 'error', message: 'Server error during bulk order deletion' });
  }
});

// @desc    Delete order (Dashboard)
// @route   DELETE /api/orders/:id/dashboard
// @access  Admin
router.delete('/:id/dashboard', async (req, res) => {
  try {
    await pool.execute('DELETE FROM orders WHERE id = ?', [req.params.id]);
    
    // Get updated analytics
    const [totalOrders] = await pool.execute('SELECT COUNT(*) as count FROM orders');
    const [pendingOrders] = await pool.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'");
    const [completedOrders] = await pool.execute("SELECT COUNT(*) as count FROM orders WHERE status = 'completed'");
    const [totalRevenue] = await pool.execute("SELECT SUM(total_amount) as total FROM orders WHERE status = 'completed'");

    res.status(200).json({ 
      status: 'success', 
      message: 'Order deleted successfully',
      analytics: {
        totalOrders: totalOrders[0].count,
        pendingOrders: pendingOrders[0].count,
        completedOrders: completedOrders[0].count,
        totalRevenue: totalRevenue[0].total || 0
      }
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ status: 'error', message: 'Server error during order deletion' });
  }
});

// @desc    Delete all orders (Dashboard)
// @route   DELETE /api/orders/dashboard/all
// @access  Admin
router.delete('/dashboard/all', async (req, res) => {
  try {
    await pool.execute('DELETE FROM orders');
    
    res.status(200).json({ 
      status: 'success', 
      message: 'All orders deleted successfully',
      analytics: {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0
      }
    });
  } catch (error) {
    console.error('Delete all orders error:', error);
    res.status(500).json({ status: 'error', message: 'Server error during bulk order deletion' });
  }
});

module.exports = router; 