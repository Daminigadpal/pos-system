const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Mock user storage
const users = [];

// JWT Secret
const JWT_SECRET = 'your-secret-key';

// Refresh token endpoint
app.post('/api/auth/refresh', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(401).json({ error: 'Refresh token required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Generate new token
    const newToken = jwt.sign({ userId: decoded.userId, email: decoded.email }, JWT_SECRET, { expiresIn: '1h' });
    
    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  try {
    // In a real app, you'd invalidate the token here
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mock product storage
const products = [
  {
    id: 1,
    name: "Coca Cola",
    description: "Classic cola drink",
    category: "Beverages",
    price: 1.99,
    stock: 100,
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Potato Chips",
    description: "Salty snack chips",
    category: "Snacks",
    price: 2.49,
    stock: 50,
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

let productIdCounter = 3;

// Mock inventory storage
const inventory = [
  {
    sku: "COLA-001",
    productId: 1,
    productName: "Coca Cola",
    quantity: 150,
    reorderPoint: 20,
    reorderQuantity: 100,
    lastUpdated: new Date().toISOString()
  },
  {
    sku: "CHIP-002", 
    productId: 3,
    productName: "New Product",
    quantity: 15,
    reorderPoint: 25,
    reorderQuantity: 50,
    lastUpdated: new Date().toISOString()
  },
  {
    sku: "LOW-003",
    productId: 999,
    productName: "Low Stock Item",
    quantity: 5,
    reorderPoint: 20,
    reorderQuantity: 50,
    lastUpdated: new Date().toISOString()
  }
];

// Mock order storage
const orders = [
  {
    id: 1,
    type: "in_store",
    status: "pending",
    customerId: null,
    items: [
      {
        productId: 1,
        productName: "Coca Cola",
        sku: "COLA-001",
        quantity: 2,
        unitPrice: 1.99,
        totalPrice: 3.98,
        discount: 0,
        tax: 0.32,
        taxRate: 0.08
      }
    ],
    subtotal: 3.98,
    tax: 0.32,
    discount: 0,
    total: 4.30,
    customerInfo: null,
    notes: "Customer at counter",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let orderIdCounter = 2;

// Order endpoints
app.get('/api/orders', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;
    
    let filteredOrders = orders;
    
    if (status) {
      filteredOrders = orders.filter(order => order.status === status);
    }
    
    const paginatedOrders = filteredOrders.slice(skip, skip + limit);
    
    res.json({
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total: filteredOrders.length,
        pages: Math.ceil(filteredOrders.length / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/orders/:id', (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = orders.find(o => o.id === orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const { type, items, customerInfo, notes } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }
    
    // Validate each item
    for (const item of items) {
      if (!item.productId || !item.quantity || !item.unitPrice) {
        return res.status(400).json({ error: 'Each item must have productId, quantity, and unitPrice' });
      }
    }
    
    // Calculate totals
    let subtotal = 0;
    let tax = 0;
    
    const processedItems = items.map(item => {
      const totalPrice = item.quantity * item.unitPrice;
      const itemTax = totalPrice * (item.taxRate || 0.08);
      const itemTotal = totalPrice + itemTax - (item.discount || 0);
      
      subtotal += totalPrice;
      tax += itemTax;
      
      return {
        productId: item.productId,
        productName: item.productName || `Product ${item.productId}`,
        sku: item.sku || `SKU-${item.productId}`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: totalPrice,
        discount: item.discount || 0,
        tax: itemTax,
        taxRate: item.taxRate || 0.08
      };
    });
    
    const total = subtotal + tax - (req.body.discount || 0);
    
    const newOrder = {
      id: orderIdCounter++,
      type: type || 'in_store',
      status: 'pending',
      customerId: req.body.customerId || null,
      items: processedItems,
      subtotal,
      tax,
      discount: req.body.discount || 0,
      total,
      customerInfo: customerInfo || null,
      notes: notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    orders.push(newOrder);
    
    res.status(201).json({
      message: 'Order created successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/orders/:id/confirm', (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orders[orderIndex];
    
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order can only be confirmed when pending' });
    }
    
    const { paymentMethod, paymentAmount } = req.body;
    
    if (!paymentMethod) {
      return res.status(400).json({ error: 'Payment method is required' });
    }
    
    if (paymentAmount && paymentAmount < order.total) {
      return res.status(400).json({ error: 'Payment amount is insufficient' });
    }
    
    // Update order status
    order.status = 'confirmed';
    order.paymentMethod = paymentMethod;
    order.paymentAmount = paymentAmount || order.total;
    order.paymentChange = paymentAmount ? paymentAmount - order.total : 0;
    order.confirmedAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    
    res.json({
      message: 'Order confirmed successfully',
      order
    });
  } catch (error) {
    console.error('Confirm order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/orders/:id/cancel', (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const orderIndex = orders.findIndex(o => o.id === orderId);
    
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = orders[orderIndex];
    
    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Order is already cancelled' });
    }
    
    if (order.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel completed order' });
    }
    
    const { reason } = req.body;
    
    // Update order status
    order.status = 'cancelled';
    order.cancelReason = reason || 'Cancelled by manager';
    order.cancelledAt = new Date().toISOString();
    order.updatedAt = new Date().toISOString();
    
    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Inventory endpoints
app.get('/api/inventory', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const paginatedInventory = inventory.slice(skip, skip + limit);
    
    res.json({
      inventory: paginatedInventory,
      pagination: {
        page,
        limit,
        total: inventory.length,
        pages: Math.ceil(inventory.length / limit)
      }
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/inventory/low-stock', (req, res) => {
  try {
    const lowStockItems = inventory.filter(item => item.quantity <= item.reorderPoint);
    
    res.json({
      lowStockItems,
      count: lowStockItems.length
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/inventory/:sku', (req, res) => {
  try {
    const sku = req.params.sku;
    const inventoryItem = inventory.find(item => item.sku === sku);
    
    if (!inventoryItem) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    res.json(inventoryItem);
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/inventory/:sku', (req, res) => {
  try {
    const sku = req.params.sku;
    const itemIndex = inventory.findIndex(item => item.sku === sku);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const { quantity, reorderPoint, reorderQuantity } = req.body;
    
    const updatedItem = {
      ...inventory[itemIndex],
      quantity: quantity !== undefined ? parseInt(quantity) : inventory[itemIndex].quantity,
      reorderPoint: reorderPoint !== undefined ? parseInt(reorderPoint) : inventory[itemIndex].reorderPoint,
      reorderQuantity: reorderQuantity !== undefined ? parseInt(reorderQuantity) : inventory[itemIndex].reorderQuantity,
      lastUpdated: new Date().toISOString()
    };
    
    inventory[itemIndex] = updatedItem;
    
    res.json({
      message: 'Inventory updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/inventory/:sku/adjust', (req, res) => {
  try {
    const sku = req.params.sku;
    const itemIndex = inventory.findIndex(item => item.sku === sku);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const { adjustment, reason } = req.body;
    
    if (adjustment === undefined || !reason) {
      return res.status(400).json({ error: 'Adjustment amount and reason are required' });
    }
    
    const adjustmentAmount = parseInt(adjustment);
    const currentQuantity = inventory[itemIndex].quantity;
    const newQuantity = currentQuantity + adjustmentAmount;
    
    if (newQuantity < 0) {
      return res.status(400).json({ error: 'Insufficient inventory for this adjustment' });
    }
    
    const adjustedItem = {
      ...inventory[itemIndex],
      quantity: newQuantity,
      lastUpdated: new Date().toISOString(),
      lastAdjustment: {
        amount: adjustmentAmount,
        reason,
        timestamp: new Date().toISOString(),
        previousQuantity: currentQuantity
      }
    };
    
    inventory[itemIndex] = adjustedItem;
    
    res.json({
      message: 'Inventory adjusted successfully',
      item: adjustedItem,
      adjustment: {
        amount: adjustmentAmount,
        reason,
        previousQuantity: currentQuantity,
        newQuantity
      }
    });
  } catch (error) {
    console.error('Adjust inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Product endpoints
app.get('/api/products', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const activeProducts = products.filter(p => p.isActive);
    const paginatedProducts = activeProducts.slice(skip, skip + limit);
    
    res.json({
      products: paginatedProducts,
      pagination: {
        page,
        limit,
        total: activeProducts.length,
        pages: Math.ceil(activeProducts.length / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products/search', (req, res) => {
  try {
    const { q, category } = req.query;
    let filteredProducts = products.filter(p => p.isActive);
    
    if (q) {
      filteredProducts = filteredProducts.filter(p => 
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.description.toLowerCase().includes(q.toLowerCase())
      );
    }
    
    if (category) {
      filteredProducts = filteredProducts.filter(p => 
        p.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    res.json({
      products: filteredProducts,
      count: filteredProducts.length
    });
  } catch (error) {
    console.error('Search products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = products.find(p => p.id === productId && p.isActive);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const { name, description, category, price, stock } = req.body;
    
    if (!name || !category || !price) {
      return res.status(400).json({ error: 'Name, category, and price are required' });
    }
    
    const newProduct = {
      id: productIdCounter++,
      name,
      description: description || '',
      category,
      price: parseFloat(price),
      stock: parseInt(stock) || 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    
    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === productId && p.isActive);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const { name, description, category, price, stock } = req.body;
    
    const updatedProduct = {
      ...products[productIndex],
      name: name || products[productIndex].name,
      description: description !== undefined ? description : products[productIndex].description,
      category: category || products[productIndex].category,
      price: price !== undefined ? parseFloat(price) : products[productIndex].price,
      stock: stock !== undefined ? parseInt(stock) : products[productIndex].stock
    };
    
    products[productIndex] = updatedProduct;
    
    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const productIndex = products.findIndex(p => p.id === productId && p.isActive);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Deactivate instead of delete
    products[productIndex].isActive = false;
    
    res.json({
      message: 'Product deactivated successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Profile endpoint
app.get('/api/auth/profile', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = {
      id: users.length + 1,
      name,
      email,
      password: hashedPassword,
      role: 'cashier',
      createdAt: new Date().toISOString()
    };
    
    users.push(user);
    
    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
    
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Quick server is working!' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Quick server running on port ${PORT}`);
  console.log(`🌐 Test: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/test`);
  console.log(`📝 Register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`🔐 Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`🔄 Refresh: POST http://localhost:${PORT}/api/auth/refresh`);
  console.log(`🚪 Logout: POST http://localhost:${PORT}/api/auth/logout`);
  console.log(`👤 Profile: GET http://localhost:${PORT}/api/auth/profile`);
  console.log(`📦 Products: GET http://localhost:${PORT}/api/products`);
  console.log(`🔍 Search: GET http://localhost:${PORT}/api/products/search`);
  console.log(`📄 Product: GET http://localhost:${PORT}/api/products/:id`);
  console.log(`➕ Create: POST http://localhost:${PORT}/api/products`);
  console.log(`✏️ Update: PUT http://localhost:${PORT}/api/products/:id`);
  console.log(`🗑️ Delete: DELETE http://localhost:${PORT}/api/products/:id`);
  console.log(`📊 Inventory: GET http://localhost:${PORT}/api/inventory`);
  console.log(`⚠️ Low Stock: GET http://localhost:${PORT}/api/inventory/low-stock`);
  console.log(`📦 Item: GET http://localhost:${PORT}/api/inventory/:sku`);
  console.log(`✏️ Update Inv: PUT http://localhost:${PORT}/api/inventory/:sku`);
  console.log(`🔄 Adjust: POST http://localhost:${PORT}/api/inventory/:sku/adjust`);
  console.log(`📋 Orders: GET http://localhost:${PORT}/api/orders`);
  console.log(`📄 Order: GET http://localhost:${PORT}/api/orders/:id`);
  console.log(`➕ Create Order: POST http://localhost:${PORT}/api/orders`);
  console.log(`✅ Confirm: POST http://localhost:${PORT}/api/orders/:id/confirm`);
  console.log(`❌ Cancel: POST http://localhost:${PORT}/api/orders/:id/cancel`);
});
