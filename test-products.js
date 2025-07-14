const fetch = require('node-fetch');

async function testProducts() {
  try {
    console.log('🛍️ Testing products endpoint...');
    
    const response = await fetch('https://kazdoura-backend-railway-production.up.railway.app/api/products');
    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📄 Products Count:', data.data ? data.data.length : 'No data');
    console.log('📄 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Products endpoint working!');
      if (data.data && data.data.length > 0) {
        console.log(`📦 Found ${data.data.length} products`);
      } else {
        console.log('⚠️ No products found in database');
      }
    } else {
      console.log('❌ Products endpoint failed!');
      console.log('💬 Error:', data.message);
    }
    
  } catch (error) {
    console.error('🚨 Test failed:', error.message);
  }
}

async function testHealth() {
  try {
    console.log('🏥 Testing health endpoint...');
    const response = await fetch('https://kazdoura-backend-railway-production.up.railway.app/api/health');
    const data = await response.json();
    console.log('📊 Health Status:', response.status);
    console.log('📄 Health Data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('🚨 Health check failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Railway products test...\n');
  
  await testHealth();
  console.log('\n' + '='.repeat(50) + '\n');
  await testProducts();
  
  console.log('\n✅ Tests completed!');
}

runTests(); 