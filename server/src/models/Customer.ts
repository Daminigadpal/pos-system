import mongoose, { Document, Schema } from 'mongoose';

export interface ICustomer extends Document {
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  storeId: mongoose.Types.ObjectId;
  loyaltyPoints?: number;
  totalPurchases: number;
  lastPurchaseDate?: Date;
  isActive: boolean;
  notes?: string;
  tags: string[];
}

const customerSchema = new Schema<ICustomer>({
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    trim: true,
    sparse: true,
    unique: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  storeId: {
    type: Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPurchases: {
    type: Number,
    default: 0,
    min: 0
  },
  lastPurchaseDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String,
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

customerSchema.index({ storeId: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ phoneNumber: 1 });
customerSchema.index({ isActive: 1 });
customerSchema.index({ firstName: 'text', lastName: 'text', email: 'text', phoneNumber: 'text' });

export const Customer = mongoose.model<ICustomer>('Customer', customerSchema);
