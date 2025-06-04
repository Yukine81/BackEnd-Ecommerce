import mongoose from "mongoose";
  
const VariantSchema = new mongoose.Schema(
    {
        type: { 
          type: String,
        },
        price: {
          type: Number,
        },
        discount: { 
          type: Number, 
          default: 0 
        },
        stock: {
          type: Number,
        },
        imageUrlIndex: {
          type: [String],
          default: 0,
        }
    },
    { timestamps: true }
);


const ProductSchema = new mongoose.Schema(
    {
      name: { 
        type: String, required: true 
      },
      description: { 
        type: String, required: true 
      },
      baseprice: { 
        type: Number,
        min:0,
        require: true,
      },
      stock: { 
        type: Number, 
        min: 0,
        require: true 
      },
      discount: { 
        type: Number, 
        default: 0 
      },
      categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductCategory",
        required: true,
      },
      subcategoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subcategory",
      },
      imageUrls: {
        type: [String],
        default: [],
      },
      brand: {
        type: String
      },
      hasVariants: {
        type: Boolean,
        default: true,
      },
      variants: {
        type: [VariantSchema],
        default: [],
      },
      isSale: {
        type: Boolean,
        default: false,
      },
    },
    {
      timestamps: true,
    }
);

const Product =
  mongoose.models?.Product || mongoose.model("Product", ProductSchema);
  
export default Product;