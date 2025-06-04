import mongoose from 'mongoose';

const BlogCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Vui lòng cung cấp tên danh mục blog.'],
    unique: true,
    trim: true,
    maxlength: [50, 'Tên danh mục blog không thể dài hơn 50 ký tự.'],
  },
}, {
  timestamps: true,
});

const BlogCategory = mongoose.models.BlogCategory || mongoose.model('BlogCategory', BlogCategorySchema);

export default BlogCategory;