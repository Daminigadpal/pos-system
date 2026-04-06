const http = require('http');

function testEndpoint(method, path, data = null, description) {
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: postData ? {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      } : {}
    };

    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📍 ${method} ${path}`);
    if (data) console.log(`📦 Data:`, data);

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        console.log(`✅ Status: ${res.statusCode}`);
        try {
          const jsonBody = JSON.parse(body);
          console.log(`📄 Response:`, jsonBody);
        } catch (e) {
          console.log(`📄 Response: ${body}`);
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`❌ Error: ${e.message}`);
      resolve();
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runOrderTests() {
  console.log('🚀 Testing Order Endpoints...\n');

  // Test GET orders
  await testEndpoint('GET', '/api/orders?page=1&limit=5', null, 'Get Orders List (Pagination)');
  await testEndpoint('GET', '/api/orders?status=pending', null, 'Get Orders by Status (Pending)');
  
  // Test GET order by ID
  await testEndpoint('GET', '/api/orders/1', null, 'Get Order by ID (Valid)');
  await testEndpoint('GET', '/api/orders/999', null, 'Get Order by ID (Invalid - should fail)');
  
  // Test POST create order
  await testEndpoint('POST', '/api/orders', {
    type: 'in_store',
    items: [
      {
        productId: 1,
        productName: "Coca Cola",
        sku: "COLA-001",
        quantity: 3,
        unitPrice: 1.99,
        taxRate: 0.08
      },
      {
        productId: 3,
        productName: "New Product",
        sku: "CHIP-002",
        quantity: 2,
        unitPrice: 29.99,
        taxRate: 0.08
      }
    ],
    customerInfo: {
      name: "John Doe",
      email: "john@example.com"
    },
    notes: "Customer wants receipt"
  }, 'Create Order (Valid)');
  
  await testEndpoint('POST', '/api/orders', {
    type: 'online',
    items: []
  }, 'Create Order (Invalid - empty items, should fail)');
  
  await testEndpoint('POST', '/api/orders', {
    items: [
      {
        productId: 1,
        quantity: 2
        // Missing unitPrice
      }
    ]
  }, 'Create Order (Invalid - missing unitPrice, should fail)');
  
  // Test POST confirm order
  await testEndpoint('POST', '/api/orders/1/confirm', {
    paymentMethod: 'cash',
    paymentAmount: 5.00
  }, 'Confirm Order (Valid - with change)');
  
  await testEndpoint('POST', '/api/orders/2/confirm', {
    paymentMethod: 'credit_card'
  }, 'Confirm Order (Valid - exact amount)');
  
  await testEndpoint('POST', '/api/orders/1/confirm', {
    paymentMethod: 'cash'
  }, 'Confirm Order (Invalid - already confirmed, should fail)');
  
  await testEndpoint('POST', '/api/orders/999/confirm', {
    paymentMethod: 'cash'
  }, 'Confirm Order (Invalid - order not found, should fail)');
  
  await testEndpoint('POST', '/api/orders/2/confirm', {
    paymentAmount: 1.00
  }, 'Confirm Order (Invalid - missing payment method, should fail)');
  
  await testEndpoint('POST', '/api/orders/2/confirm', {
    paymentMethod: 'cash',
    paymentAmount: 1.00
  }, 'Confirm Order (Invalid - insufficient payment, should fail)');
  
  // Test POST cancel order
  await testEndpoint('POST', '/api/orders/2/cancel', {
    reason: 'Customer changed mind'
  }, 'Cancel Order (Valid)');
  
  await testEndpoint('POST', '/api/orders/2/cancel', {
    reason: 'Double cancel'
  }, 'Cancel Order (Invalid - already cancelled, should fail)');
  
  await testEndpoint('POST', '/api/orders/999/cancel', {
    reason: 'Test cancel'
  }, 'Cancel Order (Invalid - order not found, should fail)');
  
  // Get final orders list
  await testEndpoint('GET', '/api/orders', null, 'Get Final Orders List');

  console.log('\n🎉 All order tests completed!');
}

runOrderTests().catch(console.error);
