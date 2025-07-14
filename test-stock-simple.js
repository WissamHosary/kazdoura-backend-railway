const { pool } = require('./config/database');

async function testStockUpdate() {
  try {
    console.log('🧪 Testing stock update directly in database...');
    
    // Get current product
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [29] // Your product ID
    );

    if (products.length === 0) {
      console.log('❌ Product not found');
      return;
    }

    const product = products[0];
    console.log('📦 Current product:', {
      id: product.id,
      name: product.name,
      stock: product.stock,
      color_stock: product.color_stock
    });

    // Test updating general stock
    const currentStock = product.stock || 0;
    const newStock = Math.max(0, currentStock - 1);
    
    console.log(`📦 Updating general stock: ${currentStock} → ${newStock}`);
    
    await pool.execute(
      'UPDATE products SET stock = ? WHERE id = ?',
      [newStock, 29]
    );
    
    console.log(`✅ Updated general stock: ${currentStock} → ${newStock} (Product: ${product.name})`);
    
    // Verify the update
    const [updatedProducts] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [29]
    );
    
    const updatedProduct = updatedProducts[0];
    console.log('✅ Verification - Updated product:', {
      id: updatedProduct.id,
      name: updatedProduct.name,
      stock: updatedProduct.stock
    });
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the test
testStockUpdate(); 