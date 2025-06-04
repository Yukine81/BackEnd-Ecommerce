import express from "express";
import {
    createCheckoutSession,
    checkoutSuccess,
    createCodOrder,
    getAllOrders, // Thêm
    getMyOrders, // Thêm
    getOrderById, // Thêm
    updateOrderStatus, // Thêm
    deleteOrder, // Thêm
} from "../controllers/order.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/checkout-session", protectRoute, createCheckoutSession); 
router.post("/checkout-success", checkoutSuccess); 
router.route("/")
    .get(protectRoute, adminRoute, getAllOrders);

router.route("/my-orders")
    .get(protectRoute, getMyOrders)

router.route("/:id")
    .get(protectRoute, getOrderById)
    .delete(protectRoute, adminRoute, deleteOrder); 
router.route("/:id/status")
    .patch(protectRoute, adminRoute, updateOrderStatus);

export default router;
