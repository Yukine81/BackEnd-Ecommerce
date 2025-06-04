import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', 
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [600, 'Bình luận không thể dài hơn 600 ký tự.'],
  },
  date: {
    type: Date,
    default: Date.now, // Mặc định là thời điểm hiện tại
  },
  isAbusive: {
    type: Boolean,
    default: false, // Cờ đánh dấu bình luận có lạm dụng ngôn ngữ hay không
  },
}, {
  timestamps: true,
});

const Review = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

export default Review;