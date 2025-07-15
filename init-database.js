const mysql = require('mysql2/promise');
require('dotenv').config({ path: './config.env' });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 200, // Increased to 200 for handling 100+ products
  queueLimit: 0
});

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database tables...');

    // Create users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') DEFAULT 'user',
        phone VARCHAR(20),
        address TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users table created');

    // Create products table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2),
        category VARCHAR(100),
        brand VARCHAR(100),
        stock INT DEFAULT 0,
        sku VARCHAR(100) UNIQUE,
        weight DECIMAL(8,2),
        length DECIMAL(8,2),
        height DECIMAL(8,2),
        size VARCHAR(50),
        color VARCHAR(50),
        color_stock JSON,
        images JSON,
        tags JSON,
        is_active BOOLEAN DEFAULT TRUE,
        is_featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Products table created');

    // Create cart_items table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        product_id INT,
        quantity INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_product (user_id, product_id)
      )
    `);
    console.log('✅ Cart items table created');

    // Create orders table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        order_number VARCHAR(100) UNIQUE,
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        shipping_address TEXT,
        billing_address TEXT,
        payment_method VARCHAR(50),
        payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Orders table created');

    // Create order_items table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT,
        product_id INT,
        product_name VARCHAR(255),
        product_price DECIMAL(10,2),
        quantity INT,
        subtotal DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Order items table created');

    // Add some sample data
    await addSampleData();

    console.log('🎉 Database initialization completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

async function addSampleData() {
  try {
    console.log('📝 Adding sample data...');

    // Add sample admin user
    const hashedPassword = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; // password: password
    await pool.execute(`
      INSERT IGNORE INTO users (name, email, password, role) 
      VALUES ('Admin', 'admin@kazdoura.com', ?, 'admin')
    `, [hashedPassword]);
    console.log('✅ Sample admin user added');

    // Add sample products
    const sampleProducts = [
      {
        name: 'Sample Product 1',
        description: 'This is a sample product for testing',
        price: 29.99,
        category: 'Electronics',
        brand: 'Sample Brand',
        stock: 100,
        sku: 'SAMPLE-001',
        images: JSON.stringify(['https://picsum.photos/400/300']),
        tags: JSON.stringify(['sample', 'test'])
      },
      {
        name: 'Sample Product 2',
        description: 'Another sample product for testing',
        price: 49.99,
        category: 'Clothing',
        brand: 'Sample Brand',
        stock: 50,
        sku: 'SAMPLE-002',
        images: JSON.stringify(['https://picsum.photos/400/300']),
        tags: JSON.stringify(['sample', 'clothing'])
      }
    ];

    for (const product of sampleProducts) {
      await pool.execute(`
        INSERT IGNORE INTO products (name, description, price, category, brand, stock, sku, images, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        product.name,
        product.description,
        product.price,
        product.category,
        product.brand,
        product.stock,
        product.sku,
        product.images,
        product.tags
      ]);
    }
    console.log('✅ Sample products added');

  } catch (error) {
    console.error('⚠️ Error adding sample data:', error);
  }
}

// Run the initialization
initializeDatabase(); 