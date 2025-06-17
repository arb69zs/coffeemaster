const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token = null;

// Test login to get a token
async function testLogin() {
  try {
    console.log('Testing login...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: 'newadmin',
      password: 'password123'
    }, { timeout: 10000 });
    
    token = response.data.token;
    console.log('Login successful!');
    return token;
  } catch (error) {
    console.error('Login failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

// Test getting all orders
async function testGetAllOrders(token) {
  try {
    console.log('\nTesting get all orders...');
    const response = await axios.get(`${API_URL}/orders`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      timeout: 10000
    });
    
    console.log('Get all orders successful!');
    console.log(`Total orders: ${response.data.pagination.total}`);
    if (response.data.orders && response.data.orders.length > 0) {
      console.log('First few orders:', response.data.orders.slice(0, 2));
    } else {
      console.log('No orders found.');
    }
    return response.data;
  } catch (error) {
    console.error('Get all orders failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return null;
  }
}

// Test orders search API with no criteria (should return all orders)
async function testOrdersSearchNoCriteria(token) {
  try {
    console.log('\nTesting orders search with no criteria...');
    const response = await axios.get(`${API_URL}/orders/search`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      timeout: 10000
    });
    
    console.log('Orders search successful!');
    console.log(`Total orders: ${response.data.total}`);
    if (response.data.orders && response.data.orders.length > 0) {
      console.log('First few orders:', response.data.orders.slice(0, 2));
      console.log('Response structure:', Object.keys(response.data));
      console.log('Pagination:', response.data.pagination);
    } else {
      console.log('No orders found.');
    }
    return response.data;
  } catch (error) {
    console.error('Orders search failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error details:', error);
    }
    return null;
  }
}

// Test orders search API with specific criteria
async function testOrdersSearchWithCriteria(token) {
  try {
    console.log('\nTesting orders search with specific criteria...');
    const response = await axios.get(`${API_URL}/orders/search?status=completed&paymentMethod=cash`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      timeout: 10000
    });
    
    console.log('Orders search with criteria successful!');
    console.log(`Total orders: ${response.data.total}`);
    if (response.data.orders && response.data.orders.length > 0) {
      console.log('First few orders:', response.data.orders.slice(0, 2));
      console.log('Response structure:', Object.keys(response.data));
    } else {
      console.log('No orders found.');
    }
    return response.data;
  } catch (error) {
    console.error('Orders search with criteria failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error details:', error);
    }
    return null;
  }
}

// Run all tests
async function runTests() {
  try {
    // First login to get a token
    const token = await testLogin();
    if (!token) {
      console.error('Cannot proceed with tests: Login failed');
      return;
    }
    
    // Test getting all orders
    const ordersResult = await testGetAllOrders(token);
    if (!ordersResult) {
      console.error('Get all orders test failed');
    }
    
    // Test orders search with no criteria
    const searchNoResult = await testOrdersSearchNoCriteria(token);
    if (!searchNoResult) {
      console.error('Orders search with no criteria test failed');
    }
    
    // Test orders search with specific criteria
    const searchWithResult = await testOrdersSearchWithCriteria(token);
    if (!searchWithResult) {
      console.error('Orders search with criteria test failed');
    }
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runTests(); 