import express from "express";
import {
    getAllUsers,
    getCurrentUser,
    getUserById,
    updateUser,
    deleteUser,
} from "../controllers/user.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/")
    .get(protectRoute, adminRoute, getAllUsers); 

router.route("/:id")
    .get(protectRoute, adminRoute, getUserById)
    .put(protectRoute, updateUser)
    .delete(protectRoute, adminRoute, deleteUser);

export default router;
