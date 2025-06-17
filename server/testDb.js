const mysql = require('mysql2/promise');

async function main() {
  let connection;
  try {
    console.log('Connecting to database...');
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'arber2000',
      database: 'coffeemaster'
    });
    
    console.log('Connected successfully!');
    
    // Test orders table
    console.log('Testing orders table...');
    const [orders] = await connection.query('SELECT COUNT(*) as count FROM orders');
    console.log(`Orders count: ${orders[0].count}`);
    
    if (orders[0].count > 0) {
      const [orderRows] = await connection.query('SELECT * FROM orders LIMIT 1');
      console.log('Sample order:', JSON.stringify(orderRows[0], null, 2));
      
      // Test order items
      const orderId = orderRows[0].id;
      const [itemRows] = await connection.query('SELECT * FROM order_items WHERE order_id = ?', [orderId]);
      console.log(`Order items for order ${orderId}:`, itemRows.length);
      
      if (itemRows.length > 0) {
        console.log('Sample item:', JSON.stringify(itemRows[0], null, 2));
      }
    }
    
    // Test a simple search query
    console.log('\nTesting search query...');
    const searchQuery = `
      SELECT o.*, IFNULL(u.username, 'Unknown User') as user_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE 1=1
      LIMIT 5
    `;
    
    const [searchResults] = await connection.query(searchQuery);
    console.log(`Search results: ${searchResults.length} orders found`);
    
    if (searchResults.length > 0) {
      console.log('First result:', JSON.stringify({
        id: searchResults[0].id,
        status: searchResults[0].status,
        payment_method: searchResults[0].payment_method
      }, null, 2));
    }
    
  } catch (err) {
    console.error('Database error:', err);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Connection closed');
    }
  }
}

main(); 