import mongoose from 'mongoose';

const OrderDetailSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product', 
    required: true,
  },
  variantType: {
    type: String, // Loại biến thể của sản phẩm (ví dụ: "Small Bag", "Red")
    trim: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Số lượng phải lớn hơn 0.'],
  },
  price: {
    type: Number, 
    required: true,
    min: [0, 'Giá không thể là số âm.'],
  },
});

const OrderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: [true, 'Đơn hàng phải thuộc về một người dùng.'],
  },
  orderDate: {
    type: Date,
    default: Date.now, 
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Tổng số tiền không thể là số âm.'],
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'completed', 'cancelled','payment_failed'], // Trạng thái đơn hàng
    default: 'pending',
  },
  details: {
    type: [OrderDetailSchema], // Mảng các chi tiết sản phẩm trong đơn hàng
    default: [],
  },
  stripeSessionId: {
    type: String,
    unique: true,
    sparse: true, // Cho phép nhiều Doc có giá trị null cho trường này (nếu không phải tất cả đơn hàng đều qua Stripe)
  },
  paymentMethod: {
    type: String,
    enum: ['Stripe', 'COD'],
    required: true,
  }
}, {
  timestamps: true,
});

const Order = mongoose.models.Order || mongoose.model('Order', OrderSchema);

export default Order;