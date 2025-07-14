const mysql = require('mysql2/promise');

class Product {
  constructor(db) {
    this.db = db;
  }

  async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        image VARCHAR(500),
        category VARCHAR(100),
        stock INT DEFAULT 0,
        featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await this.db.execute(query);
  }

  async create(productData) {
    const { name, description, price, image, category, stock, featured } = productData;
    
    const query = `
      INSERT INTO products (name, description, price, image, category, stock, featured)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await this.db.execute(query, [name, description, price, image, category, stock, featured]);
    return result.insertId;
  }

  async findById(id) {
    const query = 'SELECT * FROM products WHERE id = ?';
    const [rows] = await this.db.execute(query, [id]);
    return rows[0];
  }

  async getAll() {
    const query = 'SELECT * FROM products ORDER BY created_at DESC';
    const [rows] = await this.db.execute(query);
    return rows;
  }

  async getFeatured() {
    const query = 'SELECT * FROM products WHERE featured = TRUE ORDER BY created_at DESC';
    const [rows] = await this.db.execute(query);
    return rows;
  }

  async getByCategory(category) {
    const query = 'SELECT * FROM products WHERE category = ? ORDER BY created_at DESC';
    const [rows] = await this.db.execute(query, [category]);
    return rows;
  }

  async update(id, updateData) {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    
    const query = `UPDATE products SET ${fields} WHERE id = ?`;
    await this.db.execute(query, [...values, id]);
  }

  async delete(id) {
    const query = 'DELETE FROM products WHERE id = ?';
    await this.db.execute(query, [id]);
  }

  async search(searchTerm) {
    const query = `
      SELECT * FROM products 
      WHERE name LIKE ? OR description LIKE ? OR category LIKE ?
      ORDER BY created_at DESC
    `;
    const searchPattern = `%${searchTerm}%`;
    const [rows] = await this.db.execute(query, [searchPattern, searchPattern, searchPattern]);
    return rows;
  }

  async updateStock(id, quantity) {
    const query = 'UPDATE products SET stock = stock + ? WHERE id = ?';
    await this.db.execute(query, [quantity, id]);
  }
}

module.exports = Product; 