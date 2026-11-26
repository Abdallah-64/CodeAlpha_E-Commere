import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 2000
    },
    price: {
      type: Number,
      required: true,
      min: 0.01
    },
    stock: {
      type: Number,
      min: 0,
      default: null
    },
    images: {
      type: [String],
      default: []
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Product', productSchema);
