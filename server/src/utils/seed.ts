import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../models/User';
import { Store } from '../models/Store';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Inventory } from '../models/Inventory';
import { connectDatabase } from '../config/database';
import { logger } from './logger';

const seedData = async () => {
  try {
    await connectDatabase();
    
    await User.deleteMany({});
    await Store.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Inventory.deleteMany({});

    logger.info('Cleared existing data');

    // Create users first
    const adminUser = new User({
      username: 'admin',
      email: 'admin@store.com',
      password: 'admin123',
      role: UserRole.ADMINISTRATOR,
      storeId: new mongoose.Types.ObjectId(), // Temporary ID, will be updated
      firstName: 'Admin',
      lastName: 'User'
    });
    await adminUser.save();

    const managerUser = new User({
      username: 'manager',
      email: 'manager@store.com',
      password: 'manager123',
      role: UserRole.MANAGER,
      storeId: new mongoose.Types.ObjectId(), // Temporary ID, will be updated
      firstName: 'Store',
      lastName: 'Manager'
    });
    await managerUser.save();

    const cashierUser = new User({
      username: 'cashier',
      email: 'cashier@store.com',
      password: 'cashier123',
      role: UserRole.CASHIER,
      storeId: new mongoose.Types.ObjectId(), // Temporary ID, will be updated
      firstName: 'Cashier',
      lastName: 'User'
    });
    await cashierUser.save();

    // Now create the store with the manager ID
    const store = new Store({
      name: 'Main Store',
      code: 'STORE001',
      address: {
        street: '123 Main Street',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA'
      },
      phoneNumber: '+1-555-0123',
      email: 'main@store.com',
      managerId: managerUser._id,
      taxSettings: {
        defaultTaxRate: 8.5
      },
      settings: {
        allowNegativeInventory: false,
        autoPrintReceipts: true,
        requireCustomerInfo: false
      }
    });
    await store.save();

    // Update all users with the correct store ID
    await User.updateMany(
      { _id: { $in: [adminUser._id, managerUser._id, cashierUser._id] } },
      { storeId: store._id }
    );

    const electronicsCategory = new Category({
      name: 'Electronics',
      description: 'Electronic devices and accessories',
      path: 'Electronics'
    });
    await electronicsCategory.save();

    const phonesCategory = new Category({
      name: 'Smartphones',
      description: 'Mobile phones and accessories',
      parent: electronicsCategory._id,
      path: 'Electronics / Smartphones'
    });
    await phonesCategory.save();

    const laptopsCategory = new Category({
      name: 'Laptops',
      description: 'Laptop computers',
      parent: electronicsCategory._id,
      path: 'Electronics / Laptops'
    });
    await laptopsCategory.save();

    const products = [
      {
        name: 'iPhone 15 Pro',
        description: 'Latest Apple smartphone with advanced features',
        category: phonesCategory._id,
        brand: 'Apple',
        tags: ['smartphone', 'apple', 'premium'],
        variants: [
          {
            sku: 'IP15P-128-BLK',
            barcode: '1234567890123',
            size: '128GB',
            color: 'Black',
            price: 999.99,
            cost: 750.00
          },
          {
            sku: 'IP15P-256-BLU',
            barcode: '1234567890124',
            size: '256GB',
            color: 'Blue',
            price: 1099.99,
            cost: 825.00
          }
        ],
        trackInventory: true,
        reorderPoint: 5,
        reorderQuantity: 20,
        supplier: 'Apple Inc.'
      },
      {
        name: 'MacBook Air M2',
        description: 'Lightweight laptop with M2 chip',
        category: laptopsCategory._id,
        brand: 'Apple',
        tags: ['laptop', 'apple', 'ultrabook'],
        variants: [
          {
            sku: 'MBA-M2-8-256',
            barcode: '1234567890125',
            size: '8GB/256GB',
            price: 1299.99,
            cost: 975.00
          },
          {
            sku: 'MBA-M2-16-512',
            barcode: '1234567890126',
            size: '16GB/512GB',
            price: 1699.99,
            cost: 1275.00
          }
        ],
        trackInventory: true,
        reorderPoint: 3,
        reorderQuantity: 10,
        supplier: 'Apple Inc.'
      },
      {
        name: 'Samsung Galaxy S24',
        description: 'Latest Android smartphone',
        category: phonesCategory._id,
        brand: 'Samsung',
        tags: ['smartphone', 'android', 'samsung'],
        variants: [
          {
            sku: 'SGS24-128-BLK',
            barcode: '1234567890127',
            size: '128GB',
            color: 'Black',
            price: 899.99,
            cost: 675.00
          }
        ],
        trackInventory: true,
        reorderPoint: 8,
        reorderQuantity: 25,
        supplier: 'Samsung Electronics'
      }
    ];

    const createdProducts = await Product.insertMany(products);

    for (const product of createdProducts) {
      for (const variant of product.variants) {
        const inventory = new Inventory({
          storeId: store._id,
          productId: product._id,
          variantSku: variant.sku,
          quantity: Math.floor(Math.random() * 50) + 10,
          cost: variant.cost,
          averageCost: variant.cost,
          reorderPoint: product.reorderPoint,
          reorderQuantity: product.reorderQuantity
        });
        await inventory.save();
      }
    }

    logger.info('Seed data created successfully');
    logger.info(`Created ${createdProducts.length} products`);
    logger.info('Default users:');
    logger.info('  Admin: admin@store.com / admin123');
    logger.info('  Manager: manager@store.com / manager123');
    logger.info('  Cashier: cashier@store.com / cashier123');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
