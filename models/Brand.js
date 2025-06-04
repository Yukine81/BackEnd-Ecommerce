import mongoose from 'mongoose';

const BrandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng cung cấp tên thương hiệu.'],
    unique: true,
    trim: true,
    maxlength: [50, 'Tên thương hiệu.'],
  },
  image: {
    type: String
  }
}, {
  timestamps: true,
});

const Brand = mongoose.models.Brand || mongoose.model('Brand', BrandSchema);

export default Brand;