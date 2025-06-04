import Coupon from "../models/Coupon.js"; 


export const getCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findOne({
            startDate: { $lte: new Date() }, // Start date is less than or equal to current date
            expiryDate: { $gte: new Date() }, // Expiry date is greater than or equal to current date
            isActive: true,
        });

        res.json(coupon || null);
    } catch (error) {
        console.log("Error in getCoupon controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const validateCoupon = async (req, res) => {
    try {
        const { code } = req.body;

        // Tìm coupon theo code và isActive là true
        const coupon = await Coupon.findOne({ code: code, isActive: true });

        if (!coupon) {
            return res.status(404).json({ message: "Mã giảm giá không tồn tại hoặc không hoạt động." });
        }

        const currentDate = new Date();

        // Kiểm tra xem coupon đã hết hạn chưa (ngày hiện tại > ngày hết hạn)
        if (currentDate > coupon.expiryDate) {
            // Nếu hết hạn, cập nhật isActive thành false và lưu vào database
            coupon.isActive = false;
            await coupon.save();
            return res.status(400).json({ message: "Mã giảm giá đã hết hạn." });
        }

        // Kiểm tra xem coupon đã bắt đầu hiệu lực chưa (ngày hiện tại < ngày bắt đầu)
        if (currentDate < coupon.startDate) {
            return res.status(400).json({ message: "Mã giảm giá chưa đến ngày sử dụng." });
        }

        // Nếu qua được các kiểm tra trên, coupon hợp lệ
        res.json({
            message: "Mã giảm giá hợp lệ.",
            code: coupon.code,
            discount: coupon.discount,
        });
    } catch (error) {
        console.log("Error in validateCoupon controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const createCoupon = async (req, res) => {
    try {
        const { code, discount, startDate, expiryDate, isActive } = req.body;

        if (!code || discount === undefined || !startDate || !expiryDate) {
            return res.status(400).json({ success: false, message: "Vui lòng cung cấp đầy đủ thông tin mã giảm giá." });
        }

        const newCoupon = await Coupon.create({
            code,
            discount,
            startDate,
            expiryDate,
            isActive: isActive !== undefined ? isActive : true,
        });
        res.status(200).json({ success: true, data: newCoupon, message: "Mã giảm giá đã được tạo thành công." });
    } catch (error) {
        console.error("Error in createCoupon controller:", error.message);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Mã giảm giá đã tồn tại." });
        }
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

export const getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({});
        res.status(200).json({ success: true, data: coupons });
    } catch (error) {
        console.error("Error in getAllCoupons controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

export const getCouponById = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Không tìm thấy mã giảm giá." });
        }
        res.status(200).json({ success: true, data: coupon });
    } catch (error) {
        console.error("Error in getCouponById controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

export const updateCoupon = async (req, res) => {
    try {
        const { code, discount, startDate, expiryDate, isActive } = req.body;
        const couponId = req.params.id;

        const updatedCoupon = await Coupon.findByIdAndUpdate(
            couponId,
            { code, discount, startDate, expiryDate, isActive },
            { new: true, runValidators: true }
        );

        if (!updatedCoupon) {
            return res.status(404).json({ success: false, message: "Không tìm thấy mã giảm giá để cập nhật." });
        }
        res.status(200).json({ success: true, data: updatedCoupon, message: "Mã giảm giá đã được cập nhật thành công." });
    } catch (error) {
        console.error("Error in updateCoupon controller:", error.message);
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: "Mã giảm giá đã tồn tại." });
        }
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

export const deleteCoupon = async (req, res) => {
    try {
        const deletedCoupon = await Coupon.findByIdAndDelete(req.params.id);
        if (!deletedCoupon) {
            return res.status(404).json({ success: false, message: "Không tìm thấy mã giảm giá để xóa." });
        }
        res.status(200).json({ success: true, message: "Mã giảm giá đã được xóa thành công." });
    } catch (error) {
        console.error("Error in deleteCoupon controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};
