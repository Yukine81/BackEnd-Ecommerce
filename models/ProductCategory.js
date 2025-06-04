import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Tên danh mục phải là duy nhất
    trim: true,
    maxlength: [50, 'Tên danh mục không thể dài hơn 50 ký tự.'],
  },
}, {
  timestamps: true,
});

const ProductCategory = mongoose.models.Category || mongoose.model('ProductCategory', CategorySchema);

export default ProductCategory;