import Blog from "../models/Blog.js";
import BlogCategory from "../models/BlogCategory.js";
import cloudinary from "../lib/cloudinary.js"; 

// @desc    Lấy tất cả bài viết blog
// @route   GET /api/blogs
// @access  Public
export const getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({}).populate('categoryId', 'name').sort({ publishDate: -1 });
        res.status(200).json({ success: true, data: blogs });
    } catch (error) {
        console.error("Error in getAllBlogs controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Lấy một bài viết blog theo ID
// @route   GET /api/blogs/:id
// @access  Public
export const getBlogById = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate('categoryId', 'name');
        if (!blog) {
            return res.status(404).json({ success: false, message: "Không tìm thấy bài viết blog." });
        }
        res.status(200).json({ success: true, data: blog });
    } catch (error) {
        console.error("Error in getBlogById controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Lấy bài viết blog theo Category ID
// @route   GET /api/blogs/byCategory/:categoryId
// @access  Public
export const getBlogsByCategoryId = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const blogs = await Blog.find({ categoryId }).populate('categoryId', 'name').sort({ publishDate: -1 });
        res.status(200).json({ success: true, data: blogs });
    } catch (error) {
        console.error("Error in getBlogsByCategoryId controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Tạo bài viết blog mới
// @route   POST /api/blogs
// @access  Private/Admin
export const createBlog = async (req, res) => {
    try {
        const { title, content, categoryId, authorId, imageUrl } = req.body;
        if (!title || !content || !categoryId) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp tiêu đề, nội dung, danh mục và tác giả." });
        }

        // Kiểm tra xem categoryId có tồn tại không
        const categoryExists = await BlogCategory.findById(categoryId);
        if (!categoryExists) {
            return res.status(404).json({ success: false, message: "Danh mục blog không tồn tại." });
        }

        let uploadedImageUrl = '';
        if (imageUrl) {
            try {
                const cloudinaryResponse = await cloudinary.uploader.upload(imageUrl, { folder: "blogs" });
                uploadedImageUrl = cloudinaryResponse.secure_url;
            } catch (uploadError) {
                console.error("Error uploading image to Cloudinary:", uploadError);
                return res.status(500).json({ success: false, message: "Lỗi khi tải lên hình ảnh blog." });
            }
        }

        const newBlog = await Blog.create({ title, content, categoryId, authorId, imageUrl: uploadedImageUrl });
        res.status(201).json({ success: true, data: newBlog, message: "Bài viết blog đã được tạo thành công." });
    } catch (error) {
        console.error("Error in createBlog controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Cập nhật bài viết blog
// @route   PUT /api/blogs/:id
// @access  Private/Admin
export const updateBlog = async (req, res) => {
    try {
        const { title, content, categoryId, author, imageUrl, likes, shares } = req.body;
        const blogId = req.params.id;

        const blog = await Blog.findById(blogId);
        if (!blog) {
            return res.status(404).json({ success: false, message: "Không tìm thấy bài viết blog để cập nhật." });
        }

        // Kiểm tra categoryId mới có tồn tại không
        if (categoryId) {
            const categoryExists = await BlogCategory.findById(categoryId);
            if (!categoryExists) {
                return res.status(404).json({ success: false, message: "Danh mục blog mới không tồn tại." });
            }
        }

        // Xử lý cập nhật hình ảnh
        let updatedImageUrl = blog.imageUrl;
        if (imageUrl && imageUrl !== blog.imageUrl) { // Chỉ upload nếu có ảnh mới và khác ảnh cũ
            try {
                // Xóa ảnh cũ nếu có
                if (blog.imageUrl) {
                    const publicIdMatch = blog.imageUrl.match(/\/blogs\/(.+?)(?:\.\w+)?$/);
                    if (publicIdMatch && publicIdMatch[1]) {
                        await cloudinary.uploader.destroy(`blogs/${publicIdMatch[1]}`);
                    }
                }
                const cloudinaryResponse = await cloudinary.uploader.upload(imageUrl, { folder: "blogs" });
                updatedImageUrl = cloudinaryResponse.secure_url;
            } catch (uploadError) {
                console.error("Error updating image on Cloudinary:", uploadError);
                return res.status(500).json({ success: false, message: "Lỗi khi cập nhật hình ảnh blog." });
            }
        } else if (imageUrl === '') { // Nếu người dùng muốn xóa ảnh
             if (blog.imageUrl) {
                const publicIdMatch = blog.imageUrl.match(/\/blogs\/(.+?)(?:\.\w+)?$/);
                if (publicIdMatch && publicIdMatch[1]) {
                    await cloudinary.uploader.destroy(`blogs/${publicIdMatch[1]}`);
                }
            }
            updatedImageUrl = '';
        }


        const updatedBlog = await Blog.findByIdAndUpdate(
            blogId,
            {
                title,
                content,
                categoryId,
                author,
                imageUrl: updatedImageUrl,
                likes,
                shares,
            },
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: updatedBlog, message: "Bài viết blog đã được cập nhật thành công." });
    } catch (error) {
        console.error("Error in updateBlog controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Xóa bài viết blog
// @route   DELETE /api/blogs/:id
// @access  Private/Admin
export const deleteBlog = async (req, res) => {
    try {
        const deletedBlog = await Blog.findByIdAndDelete(req.params.id);
        if (!deletedBlog) {
            return res.status(404).json({ success: false, message: "Không tìm thấy bài viết blog để xóa." });
        }

        // Xóa hình ảnh liên quan từ Cloudinary
        if (deletedBlog.imageUrl) {
            try {
                const publicIdMatch = deletedBlog.imageUrl.match(/\/blogs\/(.+?)(?:\.\w+)?$/);
                if (publicIdMatch && publicIdMatch[1]) {
                    await cloudinary.uploader.destroy(`blogs/${publicIdMatch[1]}`);
                    console.log(`Deleted blog image ${publicIdMatch[1]} from Cloudinary`);
                }
            } catch (error) {
                console.error("Error deleting blog image from Cloudinary:", error);
            }
        }

        res.status(200).json({ success: true, message: "Bài viết blog đã được xóa thành công." });
    } catch (error) {
        console.error("Error in deleteBlog controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// ---------------Blog Category ---------------//



