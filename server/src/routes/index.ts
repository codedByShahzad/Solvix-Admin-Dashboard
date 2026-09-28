import { Router } from "express";
import authRoutes from "./auth.routes";
import adminRoutes from "./admin.routes";
import websiteRoutes from "./website.routes";
import blogRoutes from "./blog.routes";
import mediaRoutes from "./media.routes";
import websiteIntegrationRoutes from "./websiteIntegration.routes";
import integrationRoutes from "./integration.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/websites", websiteRoutes);
router.use("/blogs", blogRoutes);
router.use("/media", mediaRoutes);
router.use( "/website-integrations", websiteIntegrationRoutes );
router.use( "/integration", integrationRoutes);

export default router;