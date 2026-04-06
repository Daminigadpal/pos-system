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

async function runProductTests() {
  console.log('🚀 Testing Product Endpoints...\n');

  // Test GET products (with pagination)
  await testEndpoint('GET', '/api/products?page=1&limit=5', null, 'Get Products (Pagination)');
  
  // Test GET products search
  await testEndpoint('GET', '/api/products/search?q=cola', null, 'Search Products by Name');
  await testEndpoint('GET', '/api/products/search?category=Beverages', null, 'Search Products by Category');
  await testEndpoint('GET', '/api/products/search?q=chips&category=Snacks', null, 'Search Products by Name & Category');
  
  // Test GET product by ID
  await testEndpoint('GET', '/api/products/1', null, 'Get Product by ID (Valid)');
  await testEndpoint('GET', '/api/products/999', null, 'Get Product by ID (Invalid - should fail)');
  
  // Test POST create product
  await testEndpoint('POST', '/api/products', {
    name: "New Product",
    description: "A brand new product",
    category: "Electronics",
    price: 29.99,
    stock: 25
  }, 'Create Product (Valid)');
  
  await testEndpoint('POST', '/api/products', {
    name: "",
    category: "Electronics",
    price: 29.99
  }, 'Create Product (Invalid - missing name, should fail)');
  
  // Test PUT update product
  await testEndpoint('PUT', '/api/products/1', {
    name: "Updated Coca Cola",
    description: "Updated classic cola drink",
    price: 2.49,
    stock: 150
  }, 'Update Product (Valid)');
  
  await testEndpoint('PUT', '/api/products/999', {
    name: "Updated Product",
    price: 99.99
  }, 'Update Product (Invalid - product not found, should fail)');
  
  // Test DELETE product (deactivate)
  await testEndpoint('DELETE', '/api/products/2', null, 'Delete/Deactivate Product (Valid)');
  
  await testEndpoint('DELETE', '/api/products/999', null, 'Delete Product (Invalid - product not found, should fail)');
  
  // Verify product was deactivated
  await testEndpoint('GET', '/api/products/2', null, 'Get Deactivated Product (should fail)');
  
  // Get final products list
  await testEndpoint('GET', '/api/products', null, 'Get Final Products List');

  console.log('\n🎉 All product tests completed!');
}

runProductTests().catch(console.error);
