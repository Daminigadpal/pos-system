import request from 'supertest';
import app from '../index';
import { User, UserRole } from '../models/User';
import { Store } from '../models/Store';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Inventory } from '../models/Inventory';

describe('Inventory Management', () => {
  let authToken: string;
  let storeId: string;
  let productId: string;
  let variantSku: string;

  beforeEach(async () => {
    const store = new Store({
      name: 'Test Store',
      code: 'TEST001',
      address: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'USA'
      },
      phoneNumber: '+1234567890',
      email: 'test@store.com',
      taxSettings: { defaultTaxRate: 8.5 }
    });
    await store.save();
    storeId = store._id.toString();

    const user = new User({
      username: 'manager',
      email: 'manager@example.com',
      password: 'password123',
      role: UserRole.MANAGER,
      storeId: store._id,
      firstName: 'Manager',
      lastName: 'User'
    });
    await user.save();

    const category = new Category({
      name: 'Test Category',
      description: 'Test category description'
    });
    await category.save();

    const product = new Product({
      name: 'Test Product',
      description: 'Test product description',
      category: category._id,
      brand: 'Test Brand',
      variants: [
        {
          sku: 'TEST-SKU-001',
          price: 99.99,
          cost: 75.00
        }
      ]
    });
    await product.save();
    productId = product._id.toString();
    variantSku = 'TEST-SKU-001';

    const inventory = new Inventory({
      storeId: store._id,
      productId: product._id,
      variantSku: 'TEST-SKU-001',
      quantity: 100,
      cost: 75.00,
      averageCost: 75.00,
      reorderPoint: 10,
      reorderQuantity: 50
    });
    await inventory.save();

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'manager@example.com',
        password: 'password123'
      });
    authToken = loginResponse.body.accessToken;
  });

  describe('GET /api/inventory', () => {
    it('should get inventory list', async () => {
      const response = await request(app)
        .get('/api/inventory')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.inventory).toHaveLength(1);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter low stock items', async () => {
      await Inventory.findOneAndUpdate(
        { variantSku: 'TEST-SKU-001' },
        { quantity: 5, reorderPoint: 10 }
      );

      const response = await request(app)
        .get('/api/inventory?lowStock=true')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.inventory).toHaveLength(1);
    });
  });

  describe('PUT /api/inventory/:sku', () => {
    it('should update inventory item', async () => {
      const response = await request(app)
        .put('/api/inventory/TEST-SKU-001')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 150,
          cost: 80.00,
          reorderPoint: 15,
          reorderQuantity: 75
        });

      expect(response.status).toBe(200);
      expect(response.body.quantity).toBe(150);
      expect(response.body.cost).toBe(80.00);
    });

    it('should create inventory item if not exists', async () => {
      const response = await request(app)
        .put('/api/inventory/NEW-SKU-001')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 50,
          cost: 60.00,
          reorderPoint: 5,
          reorderQuantity: 25
        });

      expect(response.status).toBe(200);
      expect(response.body.variantSku).toBe('NEW-SKU-001');
    });
  });

  describe('POST /api/inventory/:sku/adjust', () => {
    it('should adjust inventory quantity', async () => {
      const response = await request(app)
        .post('/api/inventory/TEST-SKU-001/adjust')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          adjustment: -10,
          reason: 'Damaged items',
          cost: 75.00
        });

      expect(response.status).toBe(200);
      expect(response.body.inventory.quantity).toBe(90);
    });

    it('should reject negative inventory when not allowed', async () => {
      const response = await request(app)
        .post('/api/inventory/TEST-SKU-001/adjust')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          adjustment: -200,
          reason: 'Large adjustment'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Insufficient inventory');
    });
  });

  describe('GET /api/inventory/low-stock', () => {
    it('should return low stock items', async () => {
      await Inventory.findOneAndUpdate(
        { variantSku: 'TEST-SKU-001' },
        { quantity: 5, reorderPoint: 10 }
      );

      const response = await request(app)
        .get('/api/inventory/low-stock')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.lowStockItems).toHaveLength(1);
      expect(response.body.count).toBe(1);
    });
  });
});
