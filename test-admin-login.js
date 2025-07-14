const fetch = require('node-fetch');

async function testAdminLogin() {
  const loginData = {
    email: 'admin@kazdoura.com',
    password: 'Awsedrft123'
  };

  try {
    console.log('🔍 Testing admin login...');
    console.log('📧 Email:', loginData.email);
    console.log('🔑 Password:', loginData.password);
    
    const response = await fetch('https://kazdoura-backend-railway-production.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData),
    });

    const data = await response.json();
    
    console.log('📊 Response Status:', response.status);
    console.log('📄 Response Data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('🎫 Token:', data.data.token);
    } else {
      console.log('❌ Login failed!');
      console.log('💬 Error:', data.message);
    }
    
  } catch (error) {
    console.error('🚨 Test failed:', error.message);
  }
}

// Test health endpoint first
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
  console.log('🚀 Starting Railway backend tests...\n');
  
  await testHealth();
  console.log('\n' + '='.repeat(50) + '\n');
  await testAdminLogin();
  
  console.log('\n✅ Tests completed!');
}

runTests(); 