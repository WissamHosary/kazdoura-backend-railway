const { pool } = require('./config/database');

async function testColorStock() {
  try {
    console.log('🧪 Testing Color Stock System...');
    
    // Test 1: Check if color_stock column exists
    console.log('\n1. Checking color_stock column...');
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'kazdoura_db' 
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'color_stock'
    `);
    
    if (columns.length > 0) {
      console.log('✅ color_stock column exists');
    } else {
      console.log('❌ color_stock column missing - run add-color-stock-column.js first');
      return;
    }
    
    // Test 2: Check existing products
    console.log('\n2. Checking existing products...');
    const [products] = await pool.execute('SELECT id, name, color, color_stock FROM products LIMIT 5');
    
    console.log(`Found ${products.length} products:`);
    products.forEach(product => {
      console.log(`  - ID: ${product.id}, Name: ${product.name}`);
      console.log(`    Color: ${product.color || 'None'}`);
      console.log(`    Color Stock: ${product.color_stock || 'None'}`);
    });
    
    // Test 3: Create a test product with color stock
    console.log('\n3. Creating test product with color stock...');
    const testColorStock = JSON.stringify({
      'red': 10,
      'blue': 5,
      'green': 0
    });
    
    const [result] = await pool.execute(
      `INSERT INTO products (name, description, price, category, color, color_stock, images, tags) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Test Product with Color Stock',
        'A test product to verify color stock functionality',
        29.99,
        'Electronics',
        'red,blue,green',
        testColorStock,
        JSON.stringify([]),
        JSON.stringify(['test', 'color-stock'])
      ]
    );
    
    console.log(`✅ Test product created with ID: ${result.insertId}`);
    
    // Test 4: Retrieve and verify the test product
    console.log('\n4. Retrieving test product...');
    const [testProducts] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [result.insertId]
    );
    
    if (testProducts.length > 0) {
      const testProduct = testProducts[0];
      console.log('✅ Test product retrieved successfully');
      console.log(`  Name: ${testProduct.name}`);
      console.log(`  Color: ${testProduct.color}`);
      console.log(`  Color Stock: ${testProduct.color_stock}`);
      
      // Parse color stock
      try {
        const parsedColorStock = JSON.parse(testProduct.color_stock);
        console.log('✅ Color stock parsed successfully:');
        Object.entries(parsedColorStock).forEach(([color, stock]) => {
          console.log(`    ${color}: ${stock} units`);
        });
      } catch (error) {
        console.log('❌ Failed to parse color stock:', error.message);
      }
    } else {
      console.log('❌ Test product not found');
    }
    
    console.log('\n🎉 Color Stock System Test Complete!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testColorStock(); 