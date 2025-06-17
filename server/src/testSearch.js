const axios = require('axios');
const { mysqlPool } = require('./config/database');

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    const [rows] = await mysqlPool.query('SELECT COUNT(*) as count FROM orders');
    console.log('Orders count:', rows[0].count);
    
    // Get a sample order to verify structure
    if (rows[0].count > 0) {
      const [orderRows] = await mysqlPool.query('SELECT * FROM orders LIMIT 1');
      console.log('Sample order:', JSON.stringify(orderRows[0], null, 2));
    }
    
    return true;
  } catch (err) {
    console.error('Database error:', err);
    return false;
  }
}

async function testSimpleSearch() {
  try {
    console.log('\nTesting simple search with minimal criteria...');
    // Login first to get token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    
    // Make a simple search request with minimal criteria
    const searchResponse = await axios.get('http://localhost:3001/api/orders/search?limit=5', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Search response status:', searchResponse.status);
    console.log('Total orders found:', searchResponse.data.total);
    if (searchResponse.data.orders && searchResponse.data.orders.length > 0) {
      console.log('First order ID:', searchResponse.data.orders[0].id);
    } else {
      console.log('No orders found in search results');
    }
    
    return true;
  } catch (err) {
    console.error('API error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    return false;
  }
}

async function testSearchWithCriteria() {
  try {
    console.log('\nTesting search with specific criteria...');
    // Login first to get token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    
    // Make a search request with specific criteria
    const searchResponse = await axios.get('http://localhost:3001/api/orders/search?status=completed&limit=5', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Search response status:', searchResponse.status);
    console.log('Total orders found:', searchResponse.data.total);
    if (searchResponse.data.orders && searchResponse.data.orders.length > 0) {
      console.log('First order ID:', searchResponse.data.orders[0].id);
    } else {
      console.log('No orders found in search results');
    }
    
    return true;
  } catch (err) {
    console.error('API error:', err.message);
    if (err.response) {
      console.error('Response status:', err.response.status);
      console.error('Response data:', err.response.data);
    }
    return false;
  }
}

async function testRawSQL() {
  try {
    console.log('\nTesting raw SQL query...');
    
    // Test a simple query that mimics what the search would do
    const query = `
      SELECT o.*, IFNULL(u.username, 'Unknown User') as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.status = 'completed'
      LIMIT 5
    `;
    
    const [rows] = await mysqlPool.query(query);
    console.log(`Found ${rows.length} orders with raw SQL`);
    
    if (rows.length > 0) {
      console.log('First order ID:', rows[0].id);
    }
    
    return true;
  } catch (err) {
    console.error('Raw SQL error:', err);
    return false;
  }
}

async function main() {
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    if (!dbConnected) {
      console.error('Database connection failed, stopping tests');
      return;
    }
    
    // Test raw SQL first to verify database is working correctly
    await testRawSQL();
    
    // Test simple search
    await testSimpleSearch();
    
    // Test search with criteria
    await testSearchWithCriteria();
    
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    // Close the database connection
    await mysqlPool.end();
    console.log('Tests completed');
  }
}

main(); 