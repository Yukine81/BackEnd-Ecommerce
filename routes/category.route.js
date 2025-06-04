import express from "express";
import {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
} from "../controllers/category.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", getAllCategories);
router.post("/", protectRoute, adminRoute, createCategory);

router.get("/:id", getCategoryById);
router.put("/:id", protectRoute, adminRoute, updateCategory)
router.delete("/:id", protectRoute, adminRoute, deleteCategory);

export default router;
