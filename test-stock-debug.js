const mysql = require('mysql2/promise');
const config = require('./config/database');

async function testStockDebug() {
  let connection;
  
  try {
    console.log('🔍 Testing stock debug...');
    
    // Connect to database
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to database');
    
    // Get all products and their stock info
    const [products] = await connection.execute(
      'SELECT id, name, stock, color, color_stock FROM products ORDER BY id DESC LIMIT 5'
    );
    
    console.log('\n📦 Current products and stock:');
    products.forEach(product => {
      console.log(`ID: ${product.id}, Name: ${product.name}`);
      console.log(`  General Stock: ${product.stock}`);
      console.log(`  Colors: ${product.color || 'None'}`);
      console.log(`  Color Stock: ${product.color_stock || 'None'}`);
      console.log('---');
    });
    
    // Test updating a product stock
    if (products.length > 0) {
      const testProduct = products[0];
      console.log(`\n🧪 Testing stock update for product ${testProduct.id} (${testProduct.name})`);
      
      // Update stock to 15
      await connection.execute(
        'UPDATE products SET stock = ? WHERE id = ?',
        [15, testProduct.id]
      );
      
      console.log(`✅ Updated stock to 15 for product ${testProduct.id}`);
      
      // Check the result
      const [updatedProduct] = await connection.execute(
        'SELECT id, name, stock FROM products WHERE id = ?',
        [testProduct.id]
      );
      
      console.log(`📊 Updated product stock: ${updatedProduct[0].stock}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

testStockDebug(); 