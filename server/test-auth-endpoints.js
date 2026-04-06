const http = require('http');

let authToken = '';

function testEndpoint(method, path, data = null, headers = {}, description) {
  return new Promise((resolve) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        ...headers,
        ...(postData ? {
          'Content-Type': 'application/json',
          'Content-Length': postData.length
        } : {})
      }
    };

    console.log(`\n🧪 Testing: ${description}`);
    console.log(`📍 ${method} ${path}`);
    if (data) console.log(`📦 Data:`, data);
    if (headers.authorization) console.log(`🔐 Auth: ${headers.authorization}`);

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
          // Extract token for later use
          if (jsonBody.token) {
            authToken = jsonBody.token;
            console.log(`🔑 Token saved for next tests`);
          }
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

async function runAuthTests() {
  console.log('🚀 Testing Authentication Endpoints...\n');

  // First register and login to get token
  await testEndpoint('POST', '/api/auth/register', {
    name: "Auth Test User",
    email: "authtest@example.com", 
    password: "password123"
  }, {}, 'Register User for Auth Tests');
  
  await testEndpoint('POST', '/api/auth/login', {
    email: "authtest@example.com", 
    password: "password123"
  }, {}, 'Login to Get Token');

  // Test auth endpoints with token
  await testEndpoint('POST', '/api/auth/refresh', {
    token: authToken
  }, {}, 'Refresh Token');
  
  await testEndpoint('GET', '/api/auth/profile', null, {
    authorization: `Bearer ${authToken}`
  }, 'Get User Profile');
  
  await testEndpoint('POST', '/api/auth/logout', null, {
    authorization: `Bearer ${authToken}`
  }, 'Logout');

  // Test without token (should fail)
  await testEndpoint('GET', '/api/auth/profile', null, {}, 'Get Profile Without Token (should fail)');
  
  await testEndpoint('POST', '/api/auth/refresh', {
    token: 'invalid-token'
  }, {}, 'Refresh With Invalid Token (should fail)');

  console.log('\n🎉 All auth tests completed!');
}

runAuthTests().catch(console.error);
