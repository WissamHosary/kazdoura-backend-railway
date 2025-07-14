const mysql = require('mysql2/promise');

class Order {
  constructor(db) {
    this.db = db;
  }

  async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_address TEXT NOT NULL,
        customer_city VARCHAR(100) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        delivery_fee DECIMAL(10,2) DEFAULT 0,
        status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        payment_method VARCHAR(50) DEFAULT 'cash_on_delivery',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `;
    await this.db.execute(query);

    // Create order items table
    const orderItemsQuery = `
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        product_id INT,
        product_name VARCHAR(255) NOT NULL,
        product_price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `;
    await this.db.execute(orderItemsQuery);
  }

  async create(orderData) {
    const {
      userId,
      customerName,
      customerPhone,
      customerAddress,
      customerCity,
      totalAmount,
      deliveryFee,
      items,
      notes
    } = orderData;

    // Start transaction
    const connection = await this.db.getConnection();
    await connection.beginTransaction();

    try {
      // Create order
      const orderQuery = `
        INSERT INTO orders (user_id, customer_name, customer_phone, customer_address, customer_city, total_amount, delivery_fee, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [orderResult] = await connection.execute(orderQuery, [
        userId, customerName, customerPhone, customerAddress, customerCity, totalAmount, deliveryFee, notes
      ]);
      
      const orderId = orderResult.insertId;

      // Create order items
      for (const item of items) {
        const itemQuery = `
          INSERT INTO order_items (order_id, product_id, product_name, product_price, quantity, subtotal)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        await connection.execute(itemQuery, [
          orderId, item.productId, item.name, item.price, item.quantity, item.subtotal
        ]);
      }

      await connection.commit();
      return orderId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async findById(id) {
    const query = `
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `;
    const [rows] = await this.db.execute(query, [id]);
    return rows[0];
  }

  async getOrderWithItems(id) {
    const order = await this.findById(id);
    if (!order) return null;

    const itemsQuery = 'SELECT * FROM order_items WHERE order_id = ?';
    const [items] = await this.db.execute(itemsQuery, [id]);
    
    return { ...order, items };
  }

  async getAll() {
    const query = `
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
    `;
    const [rows] = await this.db.execute(query);
    return rows;
  }

  async getByUserId(userId) {
    const query = `
      SELECT o.*, u.name as user_name, u.email as user_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC
    `;
    const [rows] = await this.db.execute(query, [userId]);
    return rows;
  }

  async updateStatus(id, status) {
    const query = 'UPDATE orders SET status = ? WHERE id = ?';
    await this.db.execute(query, [status, id]);
  }

  async update(id, updateData) {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    
    const query = `UPDATE orders SET ${fields} WHERE id = ?`;
    await this.db.execute(query, [...values, id]);
  }

  async delete(id) {
    const query = 'DELETE FROM orders WHERE id = ?';
    await this.db.execute(query, [id]);
  }

  async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_order_value,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders
      FROM orders
    `;
    const [rows] = await this.db.execute(query);
    return rows[0];
  }
}

module.exports = Order; 