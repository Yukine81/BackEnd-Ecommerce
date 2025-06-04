import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import PaymentSettings from "../models/PaymentSettings.js";
import Product from "../models/Products.js"; // Cần để populate product details
import User from "../models/User.js"; // Cần để populate user details
import { stripe } from "../lib/stripe.js";

async function createStripeCoupon(discountAmount) {
    try {
        const coupon = await stripe.coupons.create({
            percent_off: discountAmount,
            duration: "once",
        });
        return coupon.id;
    } catch (error) {
        console.error("Error creating Stripe coupon:", error);
        throw new Error("Failed to create Stripe coupon.");
    }
}

// @desc    Tạo phiên thanh toán Stripe
// @route   POST /api/orders/checkout-session
// @access  Private
export const createCheckoutSession = async (req, res) => {
    try {
        const { products, couponCode } = req.body;
        const userId = req.user._id;

        const paymentSettings = await PaymentSettings.findOne({ settingsId: 'default_payment_settings' });
        if (!paymentSettings || !paymentSettings.stripe.enabled) {
            return res.status(400).json({ error: "Thanh toán bằng Stripe hiện không khả dụng." });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            console.error("Stripe Secret Key is not configured.");
            return res.status(500).json({ message: "Cấu hình thanh toán Stripe chưa hoàn chỉnh." });
        }

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: "Giỏ hàng rỗng hoặc không hợp lệ." });
        }

        let totalAmountVND = 0;

        const lineItems = products.map((product) => {
            const unitAmount = Math.round(product.price);
            totalAmountVND += unitAmount * (product.quantity || 1);

            return {
                price_data: {
                    currency: "vnd",
                    product_data: {
                        name: product.name,
                        images: product.imageUrls && product.imageUrls.length > 0 ? [product.imageUrls[0]] : ['https://placehold.co/100x100/CCCCCC/333333?text=No+Image'],
                    },
                    unit_amount: unitAmount,
                },
                quantity: product.quantity || 1,
            };
        });

        let stripeCouponId = null;

        if (couponCode) {
            const coupon = await Coupon.findOne({
                code: couponCode,
                isActive: true,
                startDate: { $lte: new Date() },
                expiryDate: { $gte: new Date() },
            });

            if (coupon) {
                stripeCouponId = await createStripeCoupon(coupon.discount);
            } else {
                console.log("Coupon not found, inactive, or expired.");
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
            discounts: stripeCouponId ? [{ coupon: stripeCouponId }] : [],
            metadata: {
                userId: userId.toString(),
                couponCode: couponCode || "",
                paymentMethod: 'Stripe',
                products: JSON.stringify(
                    products.map((p) => ({
                        id: p._id,
                        quantity: p.quantity,
                        price: p.price,
                        variantType: p.variantType || null,
                    }))
                ),
            },
        });

        const newOrder = new Order({
            userId: userId,
            totalAmount: totalAmountVND,
            status: 'pending',
            details: products.map((product) => ({
                productId: product._id,
                variantType: product.variantType || null,
                quantity: product.quantity,
                price: product.price,
            })),
            stripeSessionId: session.id,
            paymentMethod: 'Stripe',
        });
        await newOrder.save();

        res.status(200).json({ id: session.id, totalAmount: totalAmountVND });
    } catch (error) {
        console.error("Error processing Stripe checkout session:", error);
        res.status(500).json({ message: "Lỗi khi tạo phiên thanh toán Stripe", error: error.message });
    }
};

// @desc    Xử lý kết quả thanh toán thành công từ Stripe webhook (hoặc trang success)
// @route   POST /api/orders/checkout-success
// @access  Public (thường được gọi bởi Stripe webhook hoặc redirect từ frontend)
export const checkoutSuccess = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === "paid") {
            const order = await Order.findOneAndUpdate(
                { stripeSessionId: sessionId },
                { status: 'completed' },
                { new: true }
            );

            if (!order) {
                console.warn(`Order with stripeSessionId ${sessionId} not found.`);
                return res.status(404).json({ message: "Không tìm thấy đơn hàng tương ứng." });
            }

            if (session.metadata.couponCode) {
                await Coupon.findOneAndUpdate(
                    { code: session.metadata.couponCode },
                    { isActive: false }
                );
            }

            res.status(200).json({
                success: true,
                message: "Thanh toán thành công, đơn hàng đã được cập nhật và mã giảm giá đã được vô hiệu hóa nếu sử dụng.",
                orderId: order._id,
            });
        } else {
            await Order.findOneAndUpdate(
                { stripeSessionId: sessionId },
                { status: 'payment_failed' },
                { new: true }
            );
            res.status(400).json({ message: `Trạng thái thanh toán không thành công: ${session.payment_status}` });
        }
    } catch (error) {
        console.error("Error processing successful checkout:", error);
        res.status(500).json({ message: "Lỗi khi xử lý thanh toán thành công", error: error.message });
    }
};

// @desc    Xử lý đơn hàng COD (Cash On Delivery)
// @route   POST /api/orders/cod
// @access  Private
export const createCodOrder = async (req, res) => {
    try {
        const { products, couponCode } = req.body;
        const userId = req.user._id;

        const paymentSettings = await PaymentSettings.findOne({ settingsId: 'default_payment_settings' });
        if (!paymentSettings || !paymentSettings.cod.enabled) {
            return res.status(400).json({ error: "Thanh toán khi nhận hàng (COD) hiện không khả dụng." });
        }

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: "Giỏ hàng rỗng hoặc không hợp lệ." });
        }

        let totalAmount = 0;
        const orderDetails = products.map((product) => {
            const itemPrice = parseFloat(product.price);
            const itemQuantity = parseInt(product.quantity || 1);
            totalAmount += itemPrice * itemQuantity;

            return {
                productId: product._id,
                variantType: product.variantType || null,
                quantity: itemQuantity,
                price: itemPrice,
            };
        });

        if (couponCode) {
            const coupon = await Coupon.findOne({
                code: couponCode,
                isActive: true,
                startDate: { $lte: new Date() },
                expiryDate: { $gte: new Date() },
            });

            if (coupon) {
                totalAmount -= (totalAmount * coupon.discount) / 100;
                coupon.isActive = false;
                await coupon.save();
            } else {
                console.log("Coupon not found, inactive, or expired for COD order.");
            }
        }

        const newOrder = new Order({
            userId: userId,
            totalAmount: totalAmount,
            status: 'pending',
            details: orderDetails,
            paymentMethod: 'COD',
        });

        await newOrder.save();

        res.status(201).json({
            success: true,
            message: "Đơn hàng COD đã được tạo thành công.",
            orderId: newOrder._id,
        });

    } catch (error) {
        console.error("Error creating COD order:", error);
        res.status(500).json({ message: "Lỗi khi tạo đơn hàng COD", error: error.message });
    }
};

// @desc    Lấy tất cả đơn hàng (chỉ Admin)
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('userId', 'name email')
            .populate('details.productId', 'name imageUrls');
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("Error in getAllOrders controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Lấy đơn hàng của người dùng hiện tại
// @route   GET /api/orders/my-orders
// @access  Private
export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id })
            .populate('details.productId', 'name imageUrls')
            .sort({ orderDate: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        console.error("Error in getMyOrders controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Lấy một đơn hàng theo ID (Admin hoặc người dùng sở hữu)
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('userId', 'name email')
            .populate('details.productId', 'name imageUrls');

        if (!order) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });
        }

        if (order.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: "Bạn không có quyền xem đơn hàng này." });
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        console.error("Error in getOrderById controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Cập nhật trạng thái đơn hàng (chỉ Admin)
// @route   PATCH /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const orderId = req.params.id;

        if (!status || !['pending', 'processing', 'shipped', 'completed', 'cancelled', 'payment_failed'].includes(status)) {
            return res.status(400).json({ success: false, message: "Trạng thái đơn hàng không hợp lệ." });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng." });
        }

        order.status = status;
        const updatedOrder = await order.save();

        res.status(200).json({ success: true, data: updatedOrder, message: "Trạng thái đơn hàng đã được cập nhật." });
    } catch (error) {
        console.error("Error in updateOrderStatus controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};

// @desc    Xóa đơn hàng (chỉ Admin)
// @route   DELETE /api/orders/:id
// @access  Private/Admin
export const deleteOrder = async (req, res) => {
    try {
        const deletedOrder = await Order.findByIdAndDelete(req.params.id);
        if (!deletedOrder) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng để xóa." });
        }
        res.status(200).json({ success: true, message: "Đơn hàng đã được xóa thành công." });
    } catch (error) {
        console.error("Error in deleteOrder controller:", error.message);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ." });
    }
};
