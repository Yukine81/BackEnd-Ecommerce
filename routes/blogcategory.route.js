import express from "express";
import {
    getAllBlogCategories,
    getBlogCategoryById,
    createBlogCategory,
    updateBlogCategory,
    deleteBlogCategory,
} from "../controllers/blogCategory.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/")
    .get(getAllBlogCategories) 
    .post(protectRoute, adminRoute, createBlogCategory); 

router.route("/:id")
    .get(getBlogCategoryById) 
    .put(protectRoute, adminRoute, updateBlogCategory) 
    .delete(protectRoute, adminRoute, deleteBlogCategory); 
    
export default router;
