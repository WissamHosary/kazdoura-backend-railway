const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

class User {
  constructor(db) {
    this.db = db;
  }

  async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        phone VARCHAR(20),
        address TEXT,
        city VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    await this.db.execute(query);
  }

  async create(userData) {
    const { name, email, password, phone, address, city } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (name, email, password, phone, address, city)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await this.db.execute(query, [name, email, hashedPassword, phone, address, city]);
    return result.insertId;
  }

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    const [rows] = await this.db.execute(query, [email]);
    return rows[0];
  }

  async findById(id) {
    const query = 'SELECT * FROM users WHERE id = ?';
    const [rows] = await this.db.execute(query, [id]);
    return rows[0];
  }

  async update(id, updateData) {
    const fields = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updateData);
    
    const query = `UPDATE users SET ${fields} WHERE id = ?`;
    await this.db.execute(query, [...values, id]);
  }

  async delete(id) {
    const query = 'DELETE FROM users WHERE id = ?';
    await this.db.execute(query, [id]);
  }

  async getAll() {
    const query = 'SELECT id, name, email, role, phone, address, city, created_at FROM users ORDER BY created_at DESC';
    const [rows] = await this.db.execute(query);
    return rows;
  }

  async comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
  }
}

module.exports = User; 