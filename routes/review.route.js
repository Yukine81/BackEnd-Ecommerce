import express from "express";
import {
    getAllReviews,
    getReviewsByProductId,
    createReview,
    updateReview,
    deleteReview,
} from "../controllers/review.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/")
    .get(protectRoute, adminRoute, getAllReviews)
    .post(protectRoute, createReview);

router.route("/product/:productId")
    .get(getReviewsByProductId); 

router.route("/:id")
    .put(protectRoute, updateReview) 
    .delete(protectRoute, adminRoute, deleteReview);
export default router;
