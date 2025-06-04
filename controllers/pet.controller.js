import Pet from "../models/pet.js"

// @desc    Lấy tất cả đánh giá (chỉ Admin)
// @route   GET /api/reviews
// @access  Private/Admin
export const getAllPets = async (req, res) => {
    try {
        const reviews = await Pet.find({})
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        console.error("Error in getAll Pets controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Lấy loại pet theo pets name
// @route   GET /api/pets/:petsName
// @access  Public
export const getPetbyId = async (req, res) => {
    try {
        const { Petname } = req.params;
        const reviews = await Pet.find({ PetId }) // Chỉ lấy review không lạm dụng
        res.status(200).json({ success: true, data: reviews });
    } catch (error) {
        console.error("Error in getReviewsByProductId controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Tạo đánh giá mới (người dùng)
// @route   POST /api/reviews
// @access  Private/User
export const createPet = async (req, res) => {
    try {
        const { name, logo } = req.body;

        if (!name && !logo) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp ID sản phẩm và xếp hạng." });
        }
        let uploadedImageUrl;
        try {
                const cloudinaryResponse = await cloudinary.uploader.upload(logo, { folder: "Pets" });
                uploadedImageUrl.push(cloudinaryResponse.secure_url);
            } catch (uploadError) {
                console.error("Lỗi tải lên hình ảnh tới Cloudinary:", uploadError);
                return res.status(500).json({ message: "Lỗi khi tải lên hình ảnh.", error: uploadError.message });
            }

        const petData = {
            name,
            logo: uploadedImageUrl, 
        };
        // Kiểm tra xem sản phẩm có tồn tại không

        const newPet= await Pet.create({ name, imageurl });
        res.status(200).json({ success: true, data: newPet, message: "Tạo Pet thành công." });
    } catch (error) {
        console.error("Error in createReview controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Cập nhật đánh giá (chỉ Admin hoặc người tạo review)
// @route   PUT /api/reviews/:id
// @access  Private/Admin (hoặc người tạo review)
export const updatePet = async (req, res) => {
    try {
        const {  PetId, name, imageurl } = req.body;

        const Pet = await Pet.findById(PetId);
        if (!Pet) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá." });
        }

        // Chỉ admin mới được cập nhật isAbusive
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Bạn không có quyền cập nhật trạng thái này." });
        }

        

        Pet.name = name !== undefined ? name : Pet.name;
        Pet.imageurl = logo !== undefined ? logo : Pet.imageurl;
        
        const updatedPet = await Pet.save();
        res.status(200).json({ success: true, data: updatedReview, message: "Đánh giá đã được cập nhật thành công." });
    } catch (error) {
        console.error("Error in updateReview controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Xóa đánh giá (chỉ Admin)
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
export const deletePet = async (req, res) => {
    try {
        const deletedPet = await Pet.findByIdAndDelete(req.params.id);
        if (!deletedPet) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá để xóa." });
        }
        res.status(200).json({ success: true, message: "Đánh giá đã được xóa thành công." });
    } catch (error) {
        console.error("Error in deleteReview controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};
