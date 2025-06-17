const axios = require('axios');

// Set a timeout for requests
axios.defaults.timeout = 10000;

async function testLogin() {
  try {
    console.log('Logging in...');
    const response = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('Login successful, got token');
    return response.data.token;
  } catch (error) {
    console.error('Login error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function testGetAllOrders(token) {
  try {
    console.log('\nTesting get all orders...');
    const response = await axios.get('http://localhost:3001/api/orders?limit=5', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Total orders:', response.data.pagination?.total);
    console.log('First 2 orders:', response.data.orders.slice(0, 2).map(o => ({
      id: o.id,
      status: o.status,
      total: o.total_amount
    })));
    
    return response.data;
  } catch (error) {
    console.error('Get all orders error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function testOrdersSearch(token) {
  try {
    console.log('\nTesting orders search...');
    const response = await axios.get('http://localhost:3001/api/orders/search?limit=5', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Total orders:', response.data.total);
    console.log('First 2 orders:', response.data.orders.slice(0, 2).map(o => ({
      id: o.id,
      status: o.status,
      total: o.total_amount
    })));
    
    return response.data;
  } catch (error) {
    console.error('Orders search error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function testOrdersSearchWithCriteria(token) {
  try {
    console.log('\nTesting orders search with criteria...');
    const response = await axios.get('http://localhost:3001/api/orders/search?status=completed&limit=5', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Total orders:', response.data.total);
    console.log('First 2 orders:', response.data.orders.slice(0, 2).map(o => ({
      id: o.id,
      status: o.status,
      total: o.total_amount
    })));
    
    return response.data;
  } catch (error) {
    console.error('Orders search with criteria error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function main() {
  try {
    // Login
    const token = await testLogin();
    
    // Test get all orders
    await testGetAllOrders(token);
    
    // Test orders search
    await testOrdersSearch(token);
    
    // Test orders search with criteria
    await testOrdersSearchWithCriteria(token);
    
    console.log('\nAll tests completed successfully');
  } catch (error) {
    console.error('\nTest failed:', error.message);
  }
}

main(); 