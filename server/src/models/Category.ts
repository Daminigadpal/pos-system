import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  parent?: mongoose.Types.ObjectId;
  level: number;
  path: string;
  isActive: boolean;
  image?: string;
  sortOrder: number;
}

const categorySchema = new Schema<ICategory>({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  level: {
    type: Number,
    default: 0,
    min: 0
  },
  path: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: String,
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

categorySchema.index({ parent: 1, sortOrder: 1 });
categorySchema.index({ path: 1 });
categorySchema.index({ isActive: 1 });

categorySchema.pre('save', async function(next) {
  if (this.isNew) {
    if (this.parent) {
      const parent = await Category.findById(this.parent);
      if (parent) {
        this.level = parent.level + 1;
        this.path = `${parent.path} / ${this.name}`;
      }
    } else {
      this.level = 0;
      this.path = this.name;
    }
  }
  next();
});

export const Category = mongoose.model<ICategory>('Category', categorySchema);
