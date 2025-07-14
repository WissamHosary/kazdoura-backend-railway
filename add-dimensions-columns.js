const { pool } = require('./config/database');

async function addDimensionsColumns() {
  try {
    console.log('🔧 Adding dimensions and size columns to products table...');
    
    // Check if columns exist first
    const [columns] = await pool.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'kazdoura_db' 
      AND TABLE_NAME = 'products'
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    console.log('📋 Existing columns:', existingColumns);
    
    // Add length column if it doesn't exist
    if (!existingColumns.includes('length')) {
      console.log('➕ Adding length column...');
      await pool.execute(`
        ALTER TABLE products 
        ADD COLUMN length DECIMAL(8,2) NULL
      `);
      console.log('✅ Length column added');
    } else {
      console.log('✅ Length column already exists');
    }
    
    // Add height column if it doesn't exist
    if (!existingColumns.includes('height')) {
      console.log('➕ Adding height column...');
      await pool.execute(`
        ALTER TABLE products 
        ADD COLUMN height DECIMAL(8,2) NULL
      `);
      console.log('✅ Height column added');
    } else {
      console.log('✅ Height column already exists');
    }
    
    // Add size column if it doesn't exist
    if (!existingColumns.includes('size')) {
      console.log('➕ Adding size column...');
      await pool.execute(`
        ALTER TABLE products 
        ADD COLUMN size VARCHAR(255) NULL
      `);
      console.log('✅ Size column added');
    } else {
      console.log('✅ Size column already exists');
    }
    
    console.log('🎉 All dimensions columns added successfully!');
    
    // Show final table structure
    const [finalColumns] = await pool.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'kazdoura_db' 
      AND TABLE_NAME = 'products'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Final table structure:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE}, ${col.IS_NULLABLE})`);
    });
    
  } catch (error) {
    console.error('❌ Error adding dimensions columns:', error);
  } finally {
    process.exit(0);
  }
}

addDimensionsColumns(); 