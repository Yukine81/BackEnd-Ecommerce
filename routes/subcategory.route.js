import express from "express";
import {
    getAllSubcategories,
    getSubcategoryById,
    getSubcategoriesByCategoryId,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
} from "../controllers/subcategory.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/")
    .get(getAllSubcategories)
    .post(protectRoute, adminRoute, createSubcategory);

router.route("/:subcategoryId")
    .get(getSubcategoriesByCategoryId);

router.route("/:id")
    .get(getSubcategoryById)
    .put(protectRoute, adminRoute, updateSubcategory)
    .delete(protectRoute, adminRoute, deleteSubcategory); 

export default router;
