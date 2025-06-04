import mongoose from 'mongoose';

const SubcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Tên danh mục con không thể dài hơn 50 ký tự.'],
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory',
    required: true,
  },
}, {
  timestamps: true,
});

const Subcategory = mongoose.models.Subcategory || mongoose.model('Subcategory', SubcategorySchema);

export default Subcategory;