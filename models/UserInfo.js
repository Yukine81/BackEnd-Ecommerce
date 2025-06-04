import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
  street: {
    type: String,
    trim: true,
    maxlength: [200, 'Tên đường không thể dài quá 200 ký tự.']
  },
  district: { // Quận/Huyện
    type: String,
    trim: true,
    maxlength: [100, 'Tên quận/huyện không thể dài quá 100 ký tự.']
  },
  city: { // Tỉnh/Thành phố
    type: String,
    trim: true,
    maxlength: [100, 'Tên thành phố không thể dài quá 100 ký tự.']
  },
  country: {
    type: String,
    trim: true,
    default: 'Việt Nam', // Mặc định là Việt Nam
    maxlength: [100, 'Tên quốc gia không thể dài quá 100 ký tự.']
  },
  zipCode: { // Mã bưu chính (nếu có)
    type: String,
    trim: true,
    maxlength: [20, 'Mã bưu chính không thể dài quá 20 ký tự.']
  },
}, { _id: false }); // Không tạo _id cho subdocument này nếu không cần

const UserInfoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Tham chiếu đến mô hình User
    required: true,
    unique: true, // Đảm bảo mối quan hệ một-một
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    unique: true, // Số điện thoại phải là duy nhất
    match: [/^(0|\+84)\d{9,10}$/], // Regex kiểm tra định dạng số điện thoại Việt Nam
  },
  address: {
    type: AddressSchema,
    default: {}, // Mặc định là một đối tượng rỗng
  },
  avatar: {
    type: String,
    trim: true,
    default: '',
  },
}, {
  timestamps: true,
});

const UserInfo = mongoose.models.UserInfo || mongoose.model('UserInfo', UserInfoSchema);

export default UserInfo;