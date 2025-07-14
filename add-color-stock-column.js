const { pool } = require('./config/database');

async function addColorStockColumn() {
  try {
    console.log('🔧 Adding color_stock column to products table...');
    
    // Check if color_stock column exists
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'kazdoura_db' 
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'color_stock'
    `);
    
    if (columns.length === 0) {
      console.log('➕ Adding color_stock column...');
      await pool.execute(`
        ALTER TABLE products 
        ADD COLUMN color_stock JSON NULL
      `);
      console.log('✅ Color stock column added successfully!');
    } else {
      console.log('✅ Color stock column already exists');
    }
    
    // Show final table structure
    const [finalColumns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'kazdoura_db' 
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME IN ('color', 'color_stock')
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Color-related columns:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${col.IS_NULLABLE})`);
    });
    
  } catch (error) {
    console.error('❌ Error adding color_stock column:', error);
  } finally {
    process.exit(0);
  }
}

addColorStockColumn(); 