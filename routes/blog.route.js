import express from "express";
import {
    getAllBlogs,
    getBlogById,
    getBlogsByCategoryId,
    createBlog,
    updateBlog,
    deleteBlog,
} from "../controllers/blog.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/")
    .get(getAllBlogs) 
    .post(protectRoute, adminRoute, createBlog); 
router.route("/byCategory/:categoryId")
    .get(getBlogsByCategoryId); 

router.route("/:id")
    .get(getBlogById)
    .put(protectRoute, adminRoute, updateBlog) 
    .delete(protectRoute, adminRoute, deleteBlog); 

export default router;
