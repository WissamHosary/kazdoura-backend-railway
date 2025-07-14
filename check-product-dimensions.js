const { pool } = require('./config/database');

async function checkProductDimensions() {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, length, height, size FROM products ORDER BY id DESC LIMIT 5'
    );
    console.log('Latest 5 products (id, name, length, height, size):');
    rows.forEach(row => {
      console.log(row);
    });
  } catch (error) {
    console.error('❌ Error fetching products:', error);
  } finally {
    process.exit(0);
  }
}

checkProductDimensions(); 