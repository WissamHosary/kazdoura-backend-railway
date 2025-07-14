const mysql = require('mysql2/promise');

class Cart {
  constructor(pool) {
    this.pool = pool;
  }

  async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        product_id INT,
        quantity INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_product (user_id, product_id)
      )
    `;
    await this.pool.execute(query);
  }

  async addItem(userId, productId, quantity = 1) {
    const query = `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE quantity = quantity + ?
    `;
    
    await this.pool.execute(query, [userId, productId, quantity, quantity]);
  }

  async getCart(userId) {
    const query = `
      SELECT ci.*, p.name, p.price, p.image, p.description
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `;
    
    const [rows] = await this.pool.execute(query, [userId]);
    return rows;
  }

  async updateQuantity(userId, productId, quantity) {
    if (quantity <= 0) {
      return this.removeItem(userId, productId);
    }
    
    const query = 'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?';
    await this.pool.execute(query, [quantity, userId, productId]);
  }

  async removeItem(userId, productId) {
    const query = 'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?';
    await this.pool.execute(query, [userId, productId]);
  }

  async clearCart(userId) {
    const query = 'DELETE FROM cart_items WHERE user_id = ?';
    await this.pool.execute(query, [userId]);
  }

  async getCartCount(userId) {
    const query = 'SELECT SUM(quantity) as total FROM cart_items WHERE user_id = ?';
    const [rows] = await this.pool.execute(query, [userId]);
    return rows[0].total || 0;
  }

  async getCartTotal(userId) {
    const query = `
      SELECT SUM(ci.quantity * p.price) as total
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ?
    `;
    
    const [rows] = await this.pool.execute(query, [userId]);
    return rows[0].total || 0;
  }
}

module.exports = Cart; 