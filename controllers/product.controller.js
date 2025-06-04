import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/Products.js";

export const getAllProducts = async (req, res) => {
    try {
        // Lấy tất cả sản phẩm, có thể thêm populate nếu muốn lấy thông tin category/subcategory
        const filter = {};
        if (req.query.categoryId) {
            filter.categoryId = req.query.categoryId;
        }
        const products = await Product.find(filter)
            .populate('categoryId') 
            .populate('subcategoryId'); 
        res.json({ products });
    } catch (error) {
        console.log("Error in getAllProducts controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getProductbyId = async (req, res) => {
    try {
        const products = await Product.findById(req.params.id)
            .populate('categoryId') // Populate thông tin danh mục cha
            .populate('subcategoryId'); // Populate thông tin danh mục con

        if (!products || products.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm nào." });
        }

        res.json({ products });
    } catch (error) {
        console.log("Error in getProductsById controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
export const getSalesProducts = async (req, res) => {
    try {
        let salesProducts = await redis.get("sales_products");
        if (salesProducts) {
            console.log("Fetching sales products from Redis cache.");
            return res.json(JSON.parse(salesProducts));
        }

        console.log("Fetching sales products from MongoDB.");
        // Lọc sản phẩm theo isSale: true
        salesProducts = await Product.find({ isSale: true }).lean();

        if (!salesProducts || salesProducts.length === 0) {
            return res.status(404).json({ message: "Không có sản phẩm hạ giá được tìm thấy" });
        }

        // Lưu vào Redis với key "sales_products"
        await redis.set("sales_products", JSON.stringify(salesProducts));

        res.json(salesProducts);
    } catch (error) {
        console.log("Error in getSalesProducts controller", error.message);
        res.status(500).json({ message: "Lỗi server", error: error.message });
    }
};

export const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            baseprice, 
            stock,
            categoryId,
            subcategoryId,
            imageUrls, 
            brand,
            hasVariants,
            variants,
            isSale,
            discount,
        } = req.body;

        // Validation cơ bản
        if (!name || !description || !categoryId || !imageUrls || imageUrls.length === 0) {
            return res.status(400).json({ message: "Vui lòng cung cấp đủ các trường bắt buộc: tên, mô tả, danh mục, và ít nhất một hình ảnh." });
        }

        if (!hasVariants && (baseprice === undefined || baseprice === null || stock === undefined || stock === null)) {
             return res.status(400).json({ message: "Sản phẩm không có biến thể phải có giá cơ bản và tồn kho." });
        }

        if (hasVariants && (!variants || variants.length === 0)) {
            return res.status(400).json({ message: "Sản phẩm có biến thể phải có ít nhất một biến thể." });
        }

        // Xử lý upload nhiều hình ảnh lên Cloudinary
        const uploadedImageUrls = [];
        for (const image of imageUrls) {
            try {
                const cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
                uploadedImageUrls.push(cloudinaryResponse.secure_url);
            } catch (uploadError) {
                console.error("Lỗi tải lên hình ảnh tới Cloudinary:", uploadError);
                return res.status(500).json({ message: "Lỗi khi tải lên hình ảnh.", error: uploadError.message });
            }
        }

        const productData = {
            name,
            description,
            categoryId,
            subcategoryId,
            imageUrls: uploadedImageUrls, 
            brand,
            hasVariants,
            isSale: isSale || false,
        };

        if (hasVariants) {
            // Nếu có biến thể, thêm mảng variants
            productData.variants = variants.map(v => ({
                type: v.type,
                price: parseFloat(v.price),
                stock: parseInt(v.stock),
                imageUrlIndex: parseInt(v.imageUrlIndex || 0),
                discount: parseFloat(v.discount || 0),
            }));
        } else {
            // Nếu không có biến thể, thêm baseprice, stock, discount
            productData.baseprice = parseFloat(baseprice);
            productData.stock = parseInt(stock);
            productData.discount = parseFloat(discount || 0);
        }

        const product = await Product.create(productData);

        // Cập nhật sản phẩm sale nếu sản phẩm mới là sản phẩm sale
        if (product.isSale) {
            await updateSalesProductsCache();
        }

        res.status(200).json(product);
    } catch (error) {
        console.log("Error in createProduct controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
export const updatedProduct = async(req, res) =>{
    const {
        name,
        description,
        baseprice, 
        stock,
        categoryId,
        subcategoryId,
        imageUrls, 
        brand,
        hasVariants,
        variants,
        isSale,
        discount,
    } = req.body;
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        let newImageUrls = [];
        if (product.imageUrls && product.imageUrls.length > 0) {
            for (const imageUrlold of product.imageUrls) {
                try {
                    // Lấy publicId từ URL
                    const publicIdMatch = imageUrlold.match(/\/products\/(.+?)(?:\.\w+)?$/);
                    // Nếu thay đổi tại 1 ví trí bất kì
                    if (publicIdMatch && publicIdMatch[1]) {
                        const publicId = publicIdMatch[1];
                        await cloudinary.uploader.destroy(`products/${publicId}`);
                        console.log(`Deleted image ${publicId} from Cloudinary`);
                    } else {
                        console.warn(`Could not extract publicId from URL: ${imageUrl}`);
                    }
                    const cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
                    newImageUrls.push(cloudinaryResponse.secure_url);
                
                } catch (uploadError) {
                    console.error("Lỗi tải lên hình ảnh tới Cloudinary:", uploadError);
                    return res.status(500).json({ message: "Lỗi khi tải lên hình ảnh.", error: uploadError.message });
                }
            }
        }
        product.name = name || product.name;
        product.description = description || product.description;
        product.baseprice = baseprice !== undefined ? baseprice : product.baseprice;
        product.stock = stock !== undefined ? stock : product.stock;
        product.imageUrls = newImageUrls;
        product.discount = discount !== undefined ? discount : product.discount;
        product.categoryId = categoryId || product.categoryId;
        product.subcategoryId = subcategoryId || product.subcategoryId;
        product.brand = brand || product.brand;
        product.hasVariants = hasVariants !== undefined ? hasVariants : product.hasVariants;
        product.isSale = isSale !== undefined ? isSale : product.isSale;
        if (variants) {
            // Assuming `variants` from req.body is an array of variant objects
            // You might need to parse it if it comes as a string (e.g., from FormData)
            try {
                product.variants = JSON.parse(variants);
            } catch (error) {
                console.error("Error parsing variants:", error);
                return res.status(400).json({ message: "Invalid variants format. Must be a valid JSON array." });
            }
        }
        await product.save();
        // Cập nhật cache sản phẩm sale sau khi sửa
        await updateSalesProductsCache();

          res.json({ message: "Sửa sản phẩm thành công!" });
    } catch (error) {
        console.log("Error in updated controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Xóa tất cả hình ảnh liên quan từ Cloudinary
        if (product.imageUrls && product.imageUrls.length > 0) {
            for (const imageUrl of product.imageUrls) {
                try {
                    // Lấy publicId từ URL
                    const publicIdMatch = imageUrl.match(/\/products\/(.+?)(?:\.\w+)?$/);
                    if (publicIdMatch && publicIdMatch[1]) {
                        const publicId = publicIdMatch[1];
                        await cloudinary.uploader.destroy(`products/${publicId}`);
                        console.log(`Deleted image ${publicId} from Cloudinary`);
                    } else {
                        console.warn(`Could not extract publicId from URL: ${imageUrl}`);
                    }
                } catch (error) {
                    console.log("Error deleting image from Cloudinary:", error);
                }
            }
        }

        await Product.findByIdAndDelete(req.params.id);

        // Cập nhật cache sản phẩm sale sau khi xóa
        await updateSalesProductsCache();

        res.json({ message: "Xóa sản phẩm thành công!" });
    } catch (error) {
        console.log("Error in deleteProduct controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getRecommendedProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
            {
                $sample: { size: 4 },
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    imageUrls: 1, 
                    baseprice: 1, 
                    stock: 1, 
                    discount: 1, 
                    discountType: 1, 
                    hasVariants: 1, 
                    variants: 1, 
                    isSale: 1,
                },
            },
        ]);

        res.json(products);
    } catch (error) {
        console.log("Error in getRecommendedProducts controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getProductsByCategory = async (req, res) => {
    const { categoryId } = req.params; 
    try {
        // Tìm sản phẩm theo categoryId
        const products = await Product.find({ categoryId });
        res.json({ products });
    } catch (error) {
        console.log("Error in getProductsByCategory controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getProductsBySubcategory = async (req, res) => {
    const { subcategoryId } = req.params;
    try {
        if (!subcategoryId) {
            return res.status(400).json({ message: "Vui lòng cung cấp Subcategory ID." });
        }
        const products = await Product.find({ subcategoryId })
            .populate('categoryId') // Populate thông tin danh mục cha

        if (!products || products.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm nào trong danh mục con này." });
        }

        res.json({ products });
    } catch (error) {
        console.log("Error in getProductsBySubcategory controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getProductbyPets = async(req, res) => {
    const { petid } = req.params;
    try {
        if (!subcategoryId) {
            return res.status(400).json({ message: "Vui lòng cung cấp Subcategory ID." });
        }
        const products = await Product.find({ subcategoryId })
            .populate('categoryId') // Populate thông tin danh mục cha

        if (!products || products.length === 0) {
            return res.status(404).json({ message: "Không tìm thấy sản phẩm nào trong danh mục con này." });
        }

        res.json({ products });
    } catch (error) {
        console.log("Error in getProductsBySubcategory controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}
export const toggleSalesProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.isSale = !product.isSale; 
            const updatedProduct = await product.save();
            await updateSalesProductsCache(); 
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        }
    } catch (error) {
        console.log("Error in toggleSalesProduct controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

async function updateSalesProductsCache() {
    try {
        const salesProducts = await Product.find({ isSale: true }).lean(); // Lọc theo isSale
        await redis.set("sales_products", JSON.stringify(salesProducts)); 
    } catch (error) {
        console.log("Error in updateSalesProductsCache function", error.message);
    }
}