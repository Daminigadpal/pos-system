import mongoose, { Document, Schema } from 'mongoose';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum OrderType {
  IN_STORE = 'in_store',
  ONLINE = 'online',
  PHONE = 'phone'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PARTIALLY_PAID = 'partially_paid',
  REFUNDED = 'refunded',
  FAILED = 'failed'
}

export interface IOrderItem extends Document {
  productId: mongoose.Types.ObjectId;
  variantSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;
  tax: number;
  taxRate: number;
  returnedQuantity: number;
}

export interface IPayment {
  method: string;
  amount: number;
  status: PaymentStatus;
  transactionId?: string;
  processedAt?: Date;
  metadata?: Record<string, any>;
}

export interface IOrder extends Document {
  orderNumber: string;
  storeId: mongoose.Types.ObjectId;
  customerId?: mongoose.Types.ObjectId;
  cashierId: mongoose.Types.ObjectId;
  type: OrderType;
  status: OrderStatus;
  items: IOrderItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  payments: IPayment[];
  customerInfo: {
    name?: string;
    email?: string;
    phone?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const orderItemSchema = new Schema<IOrderItem>({
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
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  tax: {
    type: Number,
    default: 0,
    min: 0
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0
  },
  returnedQuantity: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

const paymentSchema = new Schema<IPayment>({
  method: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING
  },
  transactionId: String,
  processedAt: Date,
  metadata: Schema.Types.Mixed
}, { _id: false });

const orderSchema = new Schema<IOrder>({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  storeId: {
    type: Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  customerId: {
    type: Schema.Types.ObjectId,
    ref: 'Customer'
  },
  cashierId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: Object.values(OrderType),
    default: OrderType.IN_STORE,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    required: true
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  balanceAmount: {
    type: Number,
    required: true
  },
  payments: [paymentSchema],
  customerInfo: {
    name: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  notes: String,
  completedAt: Date
}, {
  timestamps: true
});

orderSchema.index({ orderNumber: 1 });
orderSchema.index({ storeId: 1, createdAt: -1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ cashierId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'items.productId': 1 });

orderSchema.pre('save', function(this: IOrder, next: any) {
  this.balanceAmount = this.totalAmount - this.paidAmount;
  
  if (this.status === OrderStatus.DELIVERED && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

orderSchema.pre('save', function(this: IOrder, next: any) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  next();
});

export const Order = mongoose.model<IOrder>('Order', orderSchema);
