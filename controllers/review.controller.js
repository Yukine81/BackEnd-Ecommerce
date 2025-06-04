import Review from "../models/Review.js";
import Product from "../models/Products.js"; 
import User from "../models/User.js"; 

// @desc    Lấy tất cả đánh giá (chỉ Admin)
// @route   GET /api/reviews
// @access  Private/Admin
export const getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.find({})
            .populate('productId', 'name imageUrls') // Lấy tên và ảnh sản phẩm
            .populate('userId', 'name email'); // Lấy tên và email người dùng
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        console.error("Error in getAllReviews controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Lấy đánh giá theo Product ID
// @route   GET /api/reviews/product/:productId
// @access  Public
export const getReviewsByProductId = async (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = await Review.find({ productId, isAbusive: false }) // Chỉ lấy review không lạm dụng
            .populate('userId', 'name avatar') // Lấy tên và avatar người dùng
            .sort({ date: -1 }); // Sắp xếp theo ngày mới nhất
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        console.error("Error in getReviewsByProductId controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Tạo đánh giá mới (người dùng)
// @route   POST /api/reviews
// @access  Private/User
export const createReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.user._id; // Lấy userId từ người dùng đã đăng nhập

        if (!productId || !rating) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp ID sản phẩm và xếp hạng." });
        }

        // Kiểm tra xem sản phẩm có tồn tại không
        const productExists = await Product.findById(productId);
        if (!productExists) {
            return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại." });
        }

        // Kiểm tra xem người dùng đã đánh giá sản phẩm này chưa (tùy chọn, nếu bạn chỉ cho phép 1 review/sản phẩm/user)
        const existingReview = await Review.findOne({ productId, userId });
        if (existingReview) {
            return res.status(400).json({ success: false, message: "Bạn đã đánh giá sản phẩm này rồi." });
        }

        const newReview = await Review.create({ productId, userId, rating, comment });
        res.status(200).json({ success: true, data: newReview, message: "Đánh giá đã được tạo thành công." });
    } catch (error) {
        console.error("Error in createReview controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Cập nhật đánh giá (chỉ Admin hoặc người tạo review)
// @route   PUT /api/reviews/:id
// @access  Private/Admin (hoặc người tạo review)
export const updateReview = async (req, res) => {
    try {
        const { rating, comment, isAbusive } = req.body;
        const reviewId = req.params.id;

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá." });
        }

        // Chỉ admin mới được cập nhật isAbusive
        if (req.user.role !== 'admin' && isAbusive !== undefined) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền cập nhật trạng thái lạm dụng." });
        }

        // Chỉ người tạo review hoặc admin mới được cập nhật rating/comment
        if (req.user.role !== 'admin' && review.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền cập nhật đánh giá này." });
        }

        review.rating = rating !== undefined ? rating : review.rating;
        review.comment = comment !== undefined ? comment : review.comment;
        review.isAbusive = isAbusive !== undefined ? isAbusive : review.isAbusive;

        const updatedReview = await review.save();
        res.status(200).json({ success: true, data: updatedReview, message: "Đánh giá đã được cập nhật thành công." });
    } catch (error) {
        console.error("Error in updateReview controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Xóa đánh giá (chỉ Admin)
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
export const deleteReview = async (req, res) => {
    try {
        const deletedReview = await Review.findByIdAndDelete(req.params.id);
        if (!deletedReview) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá để xóa." });
        }
        res.status(200).json({ success: true, message: "Đánh giá đã được xóa thành công." });
    } catch (error) {
        console.error("Error in deleteReview controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};
