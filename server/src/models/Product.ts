import mongoose, { Document, Schema } from 'mongoose';

export interface IProductVariant extends Document {
  sku: string;
  barcode?: string;
  size?: string;
  color?: string;
  price: number;
  cost: number;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  isActive: boolean;
}

export interface IProduct extends Document {
  name: string;
  description?: string;
  category: mongoose.Types.ObjectId;
  subcategory?: mongoose.Types.ObjectId;
  brand?: string;
  tags: string[];
  variants: IProductVariant[];
  images: string[];
  isActive: boolean;
  isTaxable: boolean;
  trackInventory: boolean;
  reorderPoint: number;
  reorderQuantity: number;
  supplier?: string;
  metadata?: Record<string, any>;
  searchVector?: string;
}

const productVariantSchema = new Schema<IProductVariant>({
  sku: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  barcode: String,
  size: String,
  color: String,
  price: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: false });

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    maxlength: 1000
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category'
  },
  brand: {
    type: String,
    trim: true,
    maxlength: 100
  },
  tags: [{
    type: String,
    trim: true
  }],
  variants: [productVariantSchema],
  images: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  isTaxable: {
    type: Boolean,
    default: true
  },
  trackInventory: {
    type: Boolean,
    default: true
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
  supplier: {
    type: String,
    trim: true
  },
  metadata: Schema.Types.Mixed,
  searchVector: String
}, {
  timestamps: true
});

productSchema.index({ name: 'text', description: 'text', 'variants.sku': 'text', tags: 'text' });
productSchema.index({ 'variants.sku': 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ brand: 1 });

productSchema.pre('save', function(next) {
  if (this.isModified('name') || this.isModified('description') || this.isModified('tags')) {
    this.searchVector = `${this.name} ${this.description || ''} ${this.tags.join(' ')} ${this.brand || ''}`.toLowerCase();
  }
  next();
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
