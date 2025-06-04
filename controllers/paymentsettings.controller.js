import PaymentSettings from "../models/PaymentSettings.js"; // Đảm bảo đường dẫn đúng

// @desc    Lấy cài đặt thanh toán
// @route   GET /api/payment-settings
// @access  Public (chỉ trả về publishableKey cho frontend)
export const getPaymentSettings = async (req, res) => {
    try {
        let settings = await PaymentSettings.findOne({ settingsId: 'default_payment_settings' });

        // Nếu chưa có cài đặt, tạo một cái mặc định
        if (!settings) {
            settings = await PaymentSettings.create({ settingsId: 'default_payment_settings' });
        }

        // Chỉ trả về các thông tin an toàn cho frontend
        res.status(200).json({
            success: true,
            data: {
                stripe: {
                    enabled: settings.stripe.enabled,
                },
                cod: {
                    enabled: settings.cod.enabled,
                },
            },
        });
    } catch (error) {
        console.error("Error in getPaymentSettings controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Cập nhật cài đặt thanh toán
// @route   PUT /api/payment-settings
// @access  Private/Admin
export const updatePaymentSettings = async (req, res) => {
    try {
        const { stripe, cod } = req.body;

        let settings = await PaymentSettings.findOne({ settingsId: 'default_payment_settings' });

        // Nếu chưa có cài đặt, tạo một cái mới
        if (!settings) {
            settings = new PaymentSettings({ settingsId: 'default_payment_settings' });
        }

        // Cập nhật cài đặt Stripe
        if (stripe) {
            if (stripe.enabled !== undefined) settings.stripe.enabled = stripe.enabled;
            if (stripe.secretKey !== undefined) settings.stripe.secretKey = stripe.secretKey;
        }

        // Cập nhật cài đặt COD
        if (cod && cod.enabled !== undefined) {
            settings.cod.enabled = cod.enabled;
        }

        await settings.save();

        // Trả về các thông tin an toàn sau khi cập nhật
        res.status(200).json({
            success: true,
            message: "Cài đặt thanh toán đã được cập nhật thành công.",
            data: {
                stripe: {
                    enabled: settings.stripe.enabled,
                },
                cod: {
                    enabled: settings.cod.enabled,
                },
            },
        });
    } catch (error) {
        console.error("Error in updatePaymentSettings controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};
