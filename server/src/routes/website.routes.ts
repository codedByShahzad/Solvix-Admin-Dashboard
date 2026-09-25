import { Router } from "express";

import {
  createWebsite,
  getWebsites,
  getWebsite,
  updateWebsite,
  deleteWebsite,
  transferWebsiteOwnership,
} from "../controllers/website.controller";

import {
  authMiddleware,
  adminMiddleware,
} from "../middleware/auth.middleware";

const router = Router();

router.post("/", authMiddleware, createWebsite);

router.get("/", authMiddleware, getWebsites);

router.get("/:id", authMiddleware, getWebsite);

router.patch("/:id", authMiddleware, updateWebsite);

router.delete("/:id", authMiddleware, deleteWebsite);

// Admin-only ownership transfer
router.patch(
  "/:id/owner",
  authMiddleware,
  adminMiddleware,
  transferWebsiteOwnership
);

export default router;