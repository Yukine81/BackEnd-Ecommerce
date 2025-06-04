import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
// import path from "path";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import PetRoutes from "./routes/pet.route.js"
import categoryRoutes from "./routes/category.route.js";
import subcategoryRoutes from "./routes/subcategory.route.js";
import userRoutes from "./routes/user.route.js";
import reviewRoutes from "./routes/review.route.js";
import orderRoutes from "./routes/order.route.js"
import paymentsettingRoutes from "./routes/paymentsettings.route.js";
import blogRoutes from "./routes/blog.route.js";
import blogcategoryRoutes from "./routes/blogcategory.route.js"
import analyticsRoutes from "./routes/analytics.route.js";

import { connectDB } from "./lib/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
// const __dirname = path.resolve();

app.use(express.json({ limit: "10mb" })); // allows you to parse the body of the request
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/subcategory", subcategoryRoutes);
app.use('/api/user', userRoutes);
app.use("/api/coupon", couponRoutes);
app.use("/api/payments", paymentRoutes);
// app.use('/api/wishlist', wishlistRoutes);
app.use('/api/pets', PetRoutes);
app.use("/api/order", orderRoutes);
app.use("/api/review", reviewRoutes);
app.use('/api/paymentsettings', paymentsettingRoutes);
app.use("/api/blog", blogRoutes);
app.use('/api/blogcategory', blogcategoryRoutes);
app.use("/api/analytics", analyticsRoutes);

// if (process.env.NODE_ENV === "production") {
// 	app.use(express.static(path.join(__dirname, "/frontend/dist")));

// 	app.get("*", (req, res) => {
// 		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
// 	});
// }

app.listen(PORT, () => {
	console.log("Server is running on http://localhost:" + PORT);
	connectDB();
});