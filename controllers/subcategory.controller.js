import Subcategory from "../models/SubCategory.js"; 
import ProductCategory from "../models/ProductCategory.js"; 

// @desc    Lấy tất cả danh mục con
// @route   GET /api/subcategories
// @access  Public
export const getAllSubcategories = async (req, res) => {
    try {
        const subcategories = await Subcategory.find({}).populate('categoryId', 'name'); // Populate tên danh mục cha
        res.status(200).json({ success: true, data: subcategories });
    } catch (error) {
        console.error("Error in getAllSubcategories controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Lấy một danh mục con theo ID
// @route   GET /api/subcategories/:id
// @access  Public
export const getSubcategoryById = async (req, res) => {
    try {
        const subcategory = await Subcategory.findById(req.params.id).populate('categoryId', 'name');
        if (!subcategory) {
            return res.status(404).json({ success: false, message: "Không tìm thấy danh mục con." });
        }
        res.status(200).json({ success: true, data: subcategory });
    } catch (error) {
        console.error("Error in getSubcategoryById controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Lấy danh mục con theo Category ID
// @route   GET /api/subcategories/byCategory/:categoryId
// @access  Public
export const getSubcategoriesByCategoryId = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const subcategories = await Subcategory.find({ categoryId }).populate('categoryId', 'name');
        res.status(200).json({ success: true, data: subcategories });
    } catch (error) {
        console.error("Error in getSubcategoriesByCategoryId controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Tạo danh mục con mới
// @route   POST /api/subcategories
// @access  Private/Admin
export const createSubcategory = async (req, res) => {
    try {
        const { name, categoryId } = req.body;
        if (!name || !categoryId) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp tên và ID danh mục cha." });
        }

        // Kiểm tra xem categoryId có tồn tại không
        const categoryExists = await ProductCategory.findById(categoryId);
        if (!categoryExists) {
            return res.status(404).json({ success: false, message: "Danh mục cha không tồn tại." });
        }

        const newSubcategory = await Subcategory.create({ name, categoryId });
        res.status(200).json({ success: true, data: newSubcategory, message: "Danh mục con đã được tạo thành công." });
    } catch (error) {
        console.error("Error in createSubcategory controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Cập nhật danh mục con
// @route   PUT /api/subcategories/:id
// @access  Private/Admin
export const updateSubcategory = async (req, res) => {
    try {
        const { name, categoryId } = req.body;
        if (!name || !categoryId) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp tên và ID danh mục cha mới." });
        }

        // Kiểm tra categoryId mới có tồn tại không
        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
            return res.status(404).json({ success: false, message: "Danh mục cha mới không tồn tại." });
        }

        const updatedSubcategory = await Subcategory.findByIdAndUpdate(
            req.params.id,
            { name, categoryId },
            { new: true, runValidators: true }
        );

        if (!updatedSubcategory) {
            return res.status(404).json({ success: false, message: "Không tìm thấy danh mục con để cập nhật." });
        }
        res.status(200).json({ success: true, data: updatedSubcategory, message: "Danh mục con đã được cập nhật thành công." });
    } catch (error) {
        console.error("Error in updateSubcategory controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Xóa danh mục con
// @route   DELETE /api/subcategories/:id
// @access  Private/Admin
export const deleteSubcategory = async (req, res) => {
    try {
        const deletedSubcategory = await Subcategory.findByIdAndDelete(req.params.id);
        if (!deletedSubcategory) {
            return res.status(404).json({ success: false, message: "Không tìm thấy danh mục con để xóa." });
        }
        res.status(200).json({ success: true, message: "Danh mục con đã được xóa thành công." });
    } catch (error) {
        console.error("Error in deleteSubcategory controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};
