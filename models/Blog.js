import mongoose from 'mongoose';

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [200, 'Tiêu đề không thể dài hơn 200 ký tự.'],
  },
  content: {
    type: String,
    required: true,
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogCategory', 
    required:true,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    trim: true,
  },
  publishDate: {
    type: Date,
    default: Date.now,
  },
  imageUrl: {
    type: String, // URL hình ảnh đại diện cho bài viết
    trim: true,
  },
  likes: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
});

const Blog = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);

export default Blog;