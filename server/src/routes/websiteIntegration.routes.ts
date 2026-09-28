import { Router } from "express";
import {
  createWebsiteIntegration,
  getWebsiteIntegration,
  updateWebsiteIntegration,
  deleteWebsiteIntegration,
  testWebsiteIntegration,
} from "../controllers/websiteIntegration.controller";

import { authMiddleware } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";

const router = Router();

router.post(
  "/",
  authMiddleware,
  authorize("admin"),
  createWebsiteIntegration
);

router.get(
  "/:websiteId",
  authMiddleware,
  authorize("admin"),
  getWebsiteIntegration
);

router.patch(
  "/:websiteId",
  authMiddleware,
  authorize("admin"),
  updateWebsiteIntegration
);

router.delete(
  "/:websiteId",
  authMiddleware,
  authorize("admin"),
  deleteWebsiteIntegration
);

router.post(
  "/:websiteId/test",
  authMiddleware,
  authorize("admin"),
  testWebsiteIntegration
);

export default router;