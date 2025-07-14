const { pool } = require('./config/database');

async function testDatabaseProducts() {
  try {
    console.log('🔍 Checking database products...');
    
    // Get all products
    const [products] = await pool.execute('SELECT id, name, stock, color_stock FROM products');
    
    console.log(`📦 Found ${products.length} products in database:`);
    
    products.forEach(product => {
      console.log(`  - ID: ${product.id}, Name: ${product.name}, Stock: ${product.stock}`);
      if (product.color_stock) {
        try {
          const colorStock = JSON.parse(product.color_stock);
          console.log(`    Color stock:`, colorStock);
        } catch (error) {
          console.log(`    Color stock: Invalid JSON`);
        }
      }
    });
    
    if (products.length === 0) {
      console.log('⚠️ No products found in database. Please add some products first.');
    } else {
      console.log('✅ Database products check completed');
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testDatabaseProducts(); 