import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import PaymentSettings from "../models/PaymentSettings.js";
import { stripe } from "../lib/stripe.js";

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

        let totalAmountVND = 0; // Tổng số tiền tính bằng VNĐ

    
        const lineItems = products.map((product) => {
            // Đối với VNĐ, Stripe sử dụng đơn vị tiền tệ nhỏ nhất là Đồng
            const unitAmount = Math.round(product.price); 
            totalAmountVND += unitAmount * (product.quantity || 1); 

            return {
                price_data: {
                    currency: "vnd", 
                    product_data: {
                        name: product.name,
                        images: product.imageUrls && product.imageUrls.length > 0 ? [product.imageUrls[0]] : ['https://placehold.co/100x100/CCCCCC/333333?text=No+Image'], // Lấy ảnh đầu tiên
                    },
                    unit_amount: unitAmount,
                },
                quantity: product.quantity || 1,
            };
        });

        let coupon = 0;

        if (couponCode) {
            // Tìm coupon theo code và đảm bảo nó đang hoạt động và chưa hết hạn
            coupon = await Coupon.findOne({
                code: couponCode,
                isActive: true,
                startDate: { $lte: new Date() },
                expiryDate: { $gte: new Date() },
            });

            if (coupon) {
                totalAmountVND -= Math.round((totalAmountVND * coupon.discount) / 100); 
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
            discounts: coupon ? [{ coupon: await createStripeCoupon(coupon.discount)}] : [], // Áp dụng coupon Stripe
            metadata: {
                userId: userId.toString(),
                couponCode: couponCode || "",
                paymentMethod: 'Stripe', // Đánh dấu phương thức thanh toán
                products: JSON.stringify(
                    products.map((p) => ({
                        id: p._id,
                        quantity: p.quantity,
                        price: p.price,
                        variantType: p.variantType || null, // Thêm variantType vào metadata
                    }))
                ),
            },
        });

        // Tạo Order ở trạng thái 'pending' ngay sau khi tạo session Stripe
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

export const checkoutSuccess = async (req, res) => {
    try {
        const { sessionId } = req.body;
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === "paid") {
            // Cập nhật trạng thái đơn hàng dựa trên stripeSessionId
            const order = await Order.findOneAndUpdate(
                { stripeSessionId: sessionId },
                { status: 'completed' }, // Cập nhật trạng thái thành completed
                { new: true }
            );

            if (!order) {
                console.warn(`Order with stripeSessionId ${sessionId} not found.`);
                return res.status(404).json({ message: "Không tìm thấy đơn hàng tương ứng." });
            }

            // Deactivate coupon nếu có sử dụng
            if (session.metadata.couponCode) {
                await Coupon.findOneAndUpdate(
                    {
                        code: session.metadata.couponCode,
                        userId: session.metadata.userId,
                    },
                    { isActive: false }
                );
            }

            res.status(200).json({
                success: true,
                message: "Thanh toán thành công, đơn hàng đã được cập nhật và mã giảm giá đã được vô hiệu hóa nếu sử dụng.",
                orderId: order._id,
            });
        } else {
            // Cập nhật trạng thái đơn hàng thành payment_failed
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

// Controller mới: Xử lý đơn hàng COD (Cash On Delivery)
export const createCodOrder = async (req, res) => {
    try {
        const { products, couponCode } = req.body;
        const userId = req.user._id;

        // Lấy cài đặt thanh toán
        const paymentSettings = await PaymentSettings.findOne({ settingsId: 'default_payment_settings' });
        if (!paymentSettings || !paymentSettings.cod.enabled) {
            return res.status(400).json({ error: "Thanh toán khi nhận hàng (COD) hiện không khả dụng." });
        }

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: "Giỏ hàng rỗng hoặc không hợp lệ." });
        }

        let totalAmount = 0;
        // Tính toán tổng số tiền
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

        // Áp dụng giảm giá từ coupon (nếu có)
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

        // Tạo đơn hàng COD
        const newOrder = new Order({
            userId: userId,
            totalAmount: totalAmount,
            status: 'pending', // COD thường bắt đầu với trạng thái pending hoặc processing
            details: orderDetails,
            paymentMethod: 'COD', // Đặt phương thức thanh toán là COD
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

async function createStripeCoupon(discountPercentage) {
	const coupon = await stripe.coupons.create({
		percent_off: discountPercentage,
		duration: "once",
	});

	return coupon.id;
}
