import { Router } from "express";
import { getIntegrationBlogs } from "../controllers/integration.controller";
import { integrationAuth } from "../middleware/integrationAuth.middleware";

const router = Router();

router.get(
  "/blogs",
  integrationAuth,
  getIntegrationBlogs
);

export default router;