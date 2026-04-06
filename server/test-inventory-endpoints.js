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

async function runInventoryTests() {
  console.log('🚀 Testing Inventory Endpoints...\n');

  // Test GET inventory list
  await testEndpoint('GET', '/api/inventory?page=1&limit=5', null, 'Get Inventory List (Pagination)');
  
  // Test GET low stock items
  await testEndpoint('GET', '/api/inventory/low-stock', null, 'Get Low Stock Items');
  
  // Test GET inventory item by SKU
  await testEndpoint('GET', '/api/inventory/COLA-001', null, 'Get Inventory Item by SKU (Valid)');
  await testEndpoint('GET', '/api/inventory/NONEXISTENT', null, 'Get Inventory Item by SKU (Invalid - should fail)');
  
  // Test PUT update inventory
  await testEndpoint('PUT', '/api/inventory/COLA-001', {
    quantity: 200,
    reorderPoint: 25,
    reorderQuantity: 150
  }, 'Update Inventory (Valid)');
  
  await testEndpoint('PUT', '/api/inventory/NONEXISTENT', {
    quantity: 100
  }, 'Update Inventory (Invalid - SKU not found, should fail)');
  
  // Test POST adjust inventory
  await testEndpoint('POST', '/api/inventory/CHIP-002/adjust', {
    adjustment: 10,
    reason: "New stock received"
  }, 'Adjust Inventory (Valid - Add stock)');
  
  await testEndpoint('POST', '/api/inventory/COLA-001/adjust', {
    adjustment: -50,
    reason: "Sale transaction"
  }, 'Adjust Inventory (Valid - Remove stock)');
  
  await testEndpoint('POST', '/api/inventory/LOW-003/adjust', {
    adjustment: -10,
    reason: "Sale transaction"
  }, 'Adjust Inventory (Invalid - Insufficient stock, should fail)');
  
  await testEndpoint('POST', '/api/inventory/NONEXISTENT/adjust', {
    adjustment: 5,
    reason: "Test adjustment"
  }, 'Adjust Inventory (Invalid - SKU not found, should fail)');
  
  await testEndpoint('POST', '/api/inventory/COLA-001/adjust', {
    adjustment: 10
  }, 'Adjust Inventory (Invalid - Missing reason, should fail)');
  
  // Verify low stock after adjustments
  await testEndpoint('GET', '/api/inventory/low-stock', null, 'Get Low Stock Items (After Adjustments)');
  
  // Get final inventory list
  await testEndpoint('GET', '/api/inventory', null, 'Get Final Inventory List');

  console.log('\n🎉 All inventory tests completed!');
}

runInventoryTests().catch(console.error);
