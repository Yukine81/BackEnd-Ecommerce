import User from "../models/User.js"; // Đảm bảo đường dẫn đúng
import UserInfo from "../models/UserInfo.js"; // Import UserInfo model

// @desc    Lấy tất cả người dùng (chỉ Admin)
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).populate('userInfo').lean(); // Giả sử bạn muốn populate UserInfo
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error("Error in getAllUsers controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Lấy thông tin người dùng hiện tại (cho người dùng đã đăng nhập)
// @route   GET /api/users/me
// @access  Private
export const getCurrentUser = async (req, res) => {
    try {
        // req.user được gắn từ middleware protectRoute
        const user = await User.findById(req.user._id).populate('userInfo').lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error("Error in getCurrentUser controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Lấy một người dùng theo ID (chỉ Admin)
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).populate('userInfo').lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng." });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error("Error in getUserById controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Cập nhật thông tin người dùng (Admin hoặc chính người dùng đó)
// @route   PUT /api/users/:id
// @access  Private/Admin (hoặc người dùng tự cập nhật)
export const updateUser = async (req, res) => {
    try {
        const { name, email, role, isEmployee, address, phoneNumber, avatar } = req.body;
        const userId = req.params.id;

        // Chỉ admin mới được cập nhật vai trò và isEmployee
        if (req.user.role !== 'admin' && (role || isEmployee !== undefined)) {
            return res.status(403).json({ success: false, message: "Bạn không có quyền cập nhật vai trò hoặc trạng thái nhân viên." });
        }

        const updateFields = { name, email }; // Các trường User model
        const userInfoUpdateFields = { phoneNumber, address, avatar }; // Các trường UserInfo model

        const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true, runValidators: true });

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng để cập nhật." });
        }

        // Cập nhật hoặc tạo UserInfo nếu có các trường liên quan
        if (phoneNumber || address || avatar) {
            let userInfo = await UserInfo.findOne({ userId });
            if (userInfo) {
                // Cập nhật UserInfo
                Object.assign(userInfo, userInfoUpdateFields);
                await userInfo.save();
            } else {
                // Tạo UserInfo mới nếu chưa có
                userInfo = await UserInfo.create({ userId, ...userInfoUpdateFields });
            }
        }

        res.status(200).json({ success: true, data: updatedUser, message: "Thông tin người dùng đã được cập nhật." });
    } catch (error) {
        console.error("Error in updateUser controller:", error.message);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Email hoặc số điện thoại đã tồn tại." });
        }
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Xóa người dùng (chỉ Admin)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ success: false, message: "Không tìm thấy người dùng để xóa." });
        }
        // Xóa thông tin UserInfo liên quan
        await UserInfo.deleteOne({ userId: req.params.id });

        res.status(200).json({ success: true, message: "Người dùng đã được xóa thành công." });
    } catch (error) {
        console.error("Error in deleteUser controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};
