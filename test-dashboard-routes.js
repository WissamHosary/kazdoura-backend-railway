const fetch = require('node-fetch');

const API_BASE_URL = 'https://kazdoura-backend-railway-production.up.railway.app/api';

async function testDashboardRoutes() {
  console.log('🧪 Testing Dashboard Routes...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('');

    // Test orders endpoint
    console.log('2. Testing orders endpoint...');
    const ordersResponse = await fetch(`${API_BASE_URL}/orders`);
    const ordersData = await ordersResponse.json();
    console.log('✅ Orders endpoint:', ordersData.status);
    console.log('📊 Orders count:', ordersData.data ? ordersData.data.length : 'No data');
    console.log('');

    // Test dashboard orders endpoint
    console.log('3. Testing dashboard orders endpoint...');
    const dashboardResponse = await fetch(`${API_BASE_URL}/orders/dashboard`);
    const dashboardData = await dashboardResponse.json();
    console.log('✅ Dashboard orders endpoint:', dashboardData.status);
    console.log('📊 Dashboard orders count:', dashboardData.data ? dashboardData.data.length : 'No data');
    console.log('📈 Analytics:', dashboardData.analytics ? 'Present' : 'Missing');
    console.log('');

    // Test products endpoint
    console.log('4. Testing products endpoint...');
    const productsResponse = await fetch(`${API_BASE_URL}/products`);
    const productsData = await productsResponse.json();
    console.log('✅ Products endpoint:', productsData.status);
    console.log('📦 Products count:', productsData.data ? productsData.data.length : 'No data');
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testDashboardRoutes(); 