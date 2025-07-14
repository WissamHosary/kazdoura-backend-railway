const { pool } = require('./config/database');

async function addColorColumn() {
  try {
    console.log('🔧 Adding color column to products table...');
    
    // Check if color column exists
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'kazdoura_db' 
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME = 'color'
    `);
    
    if (columns.length === 0) {
      console.log('➕ Adding color column...');
      await pool.execute(`
        ALTER TABLE products 
        ADD COLUMN color VARCHAR(255) NULL
      `);
      console.log('✅ Color column added successfully!');
    } else {
      console.log('✅ Color column already exists');
    }
    
    // Show final table structure
    const [finalColumns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'kazdoura_db' 
      AND TABLE_NAME = 'products'
      AND COLUMN_NAME IN ('length', 'height', 'size', 'color')
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Dimensions and color columns:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${col.IS_NULLABLE})`);
    });
    
  } catch (error) {
    console.error('❌ Error adding color column:', error);
  } finally {
    process.exit(0);
  }
}

addColorColumn(); 