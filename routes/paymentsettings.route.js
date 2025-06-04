import express from "express";
import {
    getPaymentSettings,
    updatePaymentSettings,
} from "../controllers/paymentsettings.controller.js";
import { protectRoute, adminRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.route("/")
    .get(getPaymentSettings) 
    .put(protectRoute, adminRoute, updatePaymentSettings); 

export default router;
