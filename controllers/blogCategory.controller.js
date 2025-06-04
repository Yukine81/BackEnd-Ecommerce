import BlogCategory from "../models/BlogCategory.js"; // Đảm bảo đường dẫn đúng

// @desc    Lấy tất cả danh mục blog
// @route   GET /api/blogcategories
// @access  Public
export const getAllBlogCategories = async (req, res) => {
    try {
        const blogCategories = await BlogCategory.find({});
        res.status(200).json({ success: true, data: blogCategories });
    } catch (error) {
        console.error("Error in getAllBlogCategories controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Lấy một danh mục blog theo ID
// @route   GET /api/blogcategories/:id
// @access  Public
export const getBlogCategoryById = async (req, res) => {
    try {
        const blogCategory = await BlogCategory.findById(req.params.id);
        if (!blogCategory) {
            return res.status(404).json({ success: false, message: "Không tìm thấy danh mục blog." });
        }
        res.status(200).json({ success: true, data: blogCategory });
    } catch (error) {
        console.error("Error in getBlogCategoryById controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Tạo danh mục blog mới
// @route   POST /api/blogcategories
// @access  Private/Admin
export const createBlogCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp tên danh mục blog." });
        }

        const newBlogCategory = await BlogCategory.create({ name });
        res.status(201).json({ success: true, data: newBlogCategory, message: "Danh mục blog đã được tạo thành công." });
    } catch (error) {
        console.error("Error in createBlogCategory controller:", error.message);
        if (error.code === 11000) { // Duplicate key error
            return res.status(400).json({ success: false, message: "Tên danh mục blog đã tồn tại." });
        }
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Cập nhật danh mục blog (sử dụng PUT - thay thế hoàn toàn)
// @route   PUT /api/blogcategories/:id
// @access  Private/Admin
export const updateBlogCategory = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp tên danh mục mới." });
        }

        const updatedBlogCategory = await BlogCategory.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true, runValidators: true }
        );

        if (!updatedBlogCategory) {
            return res.status(404).json({ success: false, message: "Không tìm thấy danh mục blog để cập nhật." });
        }
        res.status(200).json({ success: true, data: updatedBlogCategory, message: "Danh mục blog đã được cập nhật thành công (PUT)." });
    } catch (error) {
        console.error("Error in updateBlogCategory controller (PUT):", error.message);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Tên danh mục blog đã tồn tại." });
        }
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Cập nhật một phần danh mục blog (sử dụng PATCH)
// @route   PATCH /api/blogcategories/:id
// @access  Private/Admin
export const patchBlogCategory = async (req, res) => {
    try {
        const updates = req.body; // Lấy tất cả các trường cần cập nhật từ body

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: "Không có trường nào được cung cấp để cập nhật." });
        }

        // Kiểm tra xem có trường 'name' trong updates không, nếu có thì validate nó
        if (updates.name !== undefined && updates.name.trim() === '') {
            return res.status(400).json({ success: false, message: "Tên danh mục không được để trống." });
        }

        const updatedBlogCategory = await BlogCategory.findByIdAndUpdate(
            req.params.id,
            { $set: updates }, // Sử dụng $set để chỉ cập nhật các trường được cung cấp
            { new: true, runValidators: true }
        );

        if (!updatedBlogCategory) {
            return res.status(404).json({ success: false, message: "Không tìm thấy danh mục blog để cập nhật." });
        }
        res.status(200).json({ success: true, data: updatedBlogCategory, message: "Danh mục blog đã được cập nhật một phần (PATCH)." });
    } catch (error) {
        console.error("Error in patchBlogCategory controller (PATCH):", error.message);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Tên danh mục blog đã tồn tại." });
        }
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};


// @desc    Xóa danh mục blog
// @route   DELETE /api/blogcategories/:id
// @access  Private/Admin
export const deleteBlogCategory = async (req, res) => {
    try {
        const deletedBlogCategory = await BlogCategory.findByIdAndDelete(req.params.id);
        if (!deletedBlogCategory) {
            return res.status(404).json({ success: false, message: "Không tìm thấy danh mục blog để xóa." });
        }
        res.status(200).json({ success: true, message: "Danh mục blog đã được xóa thành công." });
    } catch (error) {
        console.error("Error in deleteBlogCategory controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};