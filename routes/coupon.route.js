import express from "express";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";
import { getCoupon, 
    validateCoupon, 
    getAllCoupons, 
    createCoupon, 
    getCouponById, 
    updateCoupon, 
    deleteCoupon } from "../controllers/coupon.controller.js";

const router = express.Router();

router.get("/active", getCoupon);
router.post("/validate", validateCoupon); // Public access to validate a coupon

router.route("/")
    .get(protectRoute, adminRoute, getAllCoupons) // Admin only to get all coupons
    .post(protectRoute, adminRoute, createCoupon); // Admin only to create coupon

router.route("/:id")
    .get(protectRoute, adminRoute, getCouponById) // Admin only to get coupon by ID
    .put(protectRoute, adminRoute, updateCoupon) // Admin only to update coupon
    .delete(protectRoute, adminRoute, deleteCoupon); // Admin only to delete coupon

export default router;