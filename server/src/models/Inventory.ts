import mongoose, { Document, Schema } from 'mongoose';

export interface IInventory extends Document {
  storeId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  variantSku: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastUpdated: Date;
  location?: string;
  batchNumber?: string;
  expiryDate?: Date;
  cost: number;
  averageCost: number;
}

const inventorySchema = new Schema<IInventory>({
  storeId: {
    type: Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variantSku: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  availableQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  reorderPoint: {
    type: Number,
    default: 0,
    min: 0
  },
  reorderQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  location: String,
  batchNumber: String,
  expiryDate: Date,
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  averageCost: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true
});

inventorySchema.index({ storeId: 1, variantSku: 1 }, { unique: true });
inventorySchema.index({ productId: 1 });
inventorySchema.index({ availableQuantity: 1 });
inventorySchema.index({ reorderPoint: 1, availableQuantity: 1 });

inventorySchema.pre('save', function(this: IInventory, next: any) {
  this.availableQuantity = Math.max(0, this.quantity - this.reservedQuantity);
  this.lastUpdated = new Date();
  next();
});

export const Inventory = mongoose.model<IInventory>('Inventory', inventorySchema);
