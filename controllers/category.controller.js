import ProductCategory from "../models/ProductCategory.js";
// @desc    Lấy tất cả danh mục sản phẩm
// @route   GET /api/categories
// @access  Public (có thể thêm adminRoute nếu chỉ admin được xem tất cả)
export const getAllCategories = async (req, res) => {
    try {
        const categories = await ProductCategory.find({});
        res.status(200).json({ success: true, data: categories });
    } catch (error) {
        console.error("Error in getAllCategories controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Lấy một danh mục sản phẩm theo ID
// @route   GET /api/categories/:id
// @access  Public
export const getCategoryById = async (req, res) => {
    try {
        const category = await ProductCategory.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Không tìm thấy danh mục." });
        }
        res.status(200).json({ success: true, data: category });
    } catch (error) {
        console.error("Error in getCategoryById controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Tạo danh mục sản phẩm mới
// @route   POST /api/categories
// @access  Private/Admin
export const createCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp tên danh mục." });
        }

        const newCategory = await ProductCategory.create({ name });
        res.status(200).json({ success: true, data: newCategory, message: "Danh mục đã được tạo thành công." });
    } catch (error) {
        console.error("Error in createCategory controller:", error.message);
        if (error.code === 11000) { // Duplicate key error
            return res.status(400).json({ success: false, message: "Tên danh mục đã tồn tại." });
        }
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Cập nhật danh mục sản phẩm
// @route   PUT /api/categories/:id
// @access  Private/Admin
export const updateCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp tên danh mục mới." });
        }

        const updatedCategory = await ProductCategory.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true, runValidators: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ success: false, message: "Không tìm thấy danh mục để cập nhật." });
        }
        res.status(200).json({ success: true, data: updatedCategory, message: "Danh mục đã được cập nhật thành công." });
    } catch (error) {
        console.error("Error in updateCategory controller:", error.message);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Tên danh mục đã tồn tại." });
        }
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Xóa danh mục sản phẩm
// @route   DELETE /api/categories/:id
// @access  Private/Admin
export const deleteCategory = async (req, res) => {
    try {
        const deletedCategory = await ProductCategory.findByIdAndDelete(req.params.id);
        if (!deletedCategory) {
            return res.status(404).json({ success: false, message: "Không tìm thấy danh mục để xóa." });
        }
        res.status(200).json({ success: true, message: "Danh mục đã được xóa thành công." });
    } catch (error) {
        console.error("Error in deleteCategory controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};
