import express from "express";
import {
	createProduct,
	deleteProduct,
	getAllProducts,
	getProductbyId,
	getProductsByCategory,
	getProductsBySubcategory,
	getRecommendedProducts,
	getSalesProducts,
	toggleSalesProduct,
} from "../controllers/product.controller.js";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", protectRoute, adminRoute, getAllProducts);
router.get("/:id",getProductbyId)
router.get("/sales", getSalesProducts);
router.get("/category/:categoryId", getProductsByCategory);
router.get('/subcategory/:subcategoryId', getProductsBySubcategory);
router.get("/recommendations", getRecommendedProducts);
router.post("/", protectRoute, adminRoute, createProduct);
router.patch("/:id", protectRoute, adminRoute, toggleSalesProduct);
router.delete("/:id", protectRoute, adminRoute, deleteProduct);

export default router;