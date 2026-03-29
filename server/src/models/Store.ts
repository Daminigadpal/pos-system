import mongoose, { Document, Schema } from 'mongoose';

export interface IStore extends Document {
  name: string;
  code: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phoneNumber: string;
  email: string;
  managerId: mongoose.Types.ObjectId;
  isActive: boolean;
  timezone: string;
  currency: string;
  taxSettings: {
    defaultTaxRate: number;
    taxId?: string;
  };
  settings: {
    allowNegativeInventory: boolean;
    autoPrintReceipts: boolean;
    requireCustomerInfo: boolean;
  };
}

const storeSchema = new Schema<IStore>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 10
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  phoneNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  managerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },
  taxSettings: {
    defaultTaxRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0
    },
    taxId: String
  },
  settings: {
    allowNegativeInventory: {
      type: Boolean,
      default: false
    },
    autoPrintReceipts: {
      type: Boolean,
      default: true
    },
    requireCustomerInfo: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

storeSchema.index({ code: 1 });
storeSchema.index({ isActive: 1 });

export const Store = mongoose.model<IStore>('Store', storeSchema);
