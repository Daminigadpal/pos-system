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

async function runAllTests() {
  console.log('🚀 Testing all endpoints...\n');

  // Test endpoints
  await testEndpoint('GET', '/api/health', null, 'Health Check');
  await testEndpoint('GET', '/test', null, 'Test Endpoint');
  
  // Register new user
  await testEndpoint('POST', '/api/auth/register', {
    name: "Test User",
    email: "test@example.com", 
    password: "password123"
  }, 'Register New User');
  
  // Register duplicate user (should fail)
  await testEndpoint('POST', '/api/auth/register', {
    name: "Test User",
    email: "test@example.com", 
    password: "password123"
  }, 'Register Duplicate User (should fail)');
  
  // Login with valid credentials
  await testEndpoint('POST', '/api/auth/login', {
    email: "test@example.com", 
    password: "password123"
  }, 'Login Valid Credentials');
  
  // Login with invalid credentials (should fail)
  await testEndpoint('POST', '/api/auth/login', {
    email: "test@example.com", 
    password: "wrongpassword"
  }, 'Login Invalid Credentials (should fail)');
  
  // Login with non-existent user (should fail)
  await testEndpoint('POST', '/api/auth/login', {
    email: "nonexistent@example.com", 
    password: "password123"
  }, 'Login Non-existent User (should fail)');

  console.log('\n🎉 All tests completed!');
}

runAllTests().catch(console.error);
