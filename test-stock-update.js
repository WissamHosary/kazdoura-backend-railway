// Test stock update endpoint using built-in fetch or axios
const axios = require('axios');

async function testStockUpdate() {
  try {
    console.log('🧪 Testing stock update endpoint...');
    
    // Test data - using the product ID from your database
    const testData = {
      productId: 29, // From your database
      quantity: 1,
      color: null // or 'red', 'blue', etc.
    };
    
    console.log('📤 Sending request with data:', testData);
    
    const response = await axios.put(`http://localhost:5001/api/products/${testData.productId}/stock`, {
      quantity: testData.quantity,
      color: testData.color
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('📥 Response status:', response.status);
    console.log('📥 Response data:', response.data);
    
    if (response.status === 200) {
      console.log('✅ Stock update test successful!');
    } else {
      console.log('❌ Stock update test failed!');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.response ? error.response.data : error.message);
  }
}

// Run the test
testStockUpdate(); 