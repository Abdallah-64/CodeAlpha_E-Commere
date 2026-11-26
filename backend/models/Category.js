import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 80
    },
    description: {
      type: String,
      trim: true,
      maxlength: 400,
      default: ''
    },
    image: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export default mongoose.model('Category', categorySchema);
