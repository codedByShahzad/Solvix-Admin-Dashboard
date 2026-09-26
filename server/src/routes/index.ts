import { Router } from "express";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import websiteRoutes from "./website.routes";
import blogRoutes from "./blog.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/websites", websiteRoutes);
router.use("/blogs", blogRoutes);

export default router;