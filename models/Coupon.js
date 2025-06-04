// models/Coupon.js
import mongoose from 'mongoose';

const CouponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true, // Mã giảm giá phải là duy nhất
    trim: true,
    uppercase: true, // Lưu mã giảm giá dưới dạng chữ hoa
  },
  discount: {
    type: Number,
    required: true,
    min: 0,
    max: 100, // Giả sử giảm giá theo phần trăm
  },
  startDate: {
    type: Date,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        return v > this.startDate; // Ngày hết hạn phải sau ngày bắt đầu
      },
      message: 'Ngày hết hạn phải sau ngày bắt đầu.'
    },
  },
  isActive: { 
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const Coupon = mongoose.models.Coupon || mongoose.model('Coupon', CouponSchema);
export default Coupon;