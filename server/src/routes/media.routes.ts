import { Router } from "express";

import {
  uploadMedia,
  getAllMedia,
  getSingleMedia,
  updateMedia,
  deleteMedia,
} from "../controllers/media.controller";

import { authMiddleware } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import upload from "../middleware/upload.middleware";

const router = Router();

// ========================================
// Media Routes
// ========================================

// Upload Media
// Admin + Editor
router.post(
  "/",
  authMiddleware,
  authorize("admin", "editor"),
  upload.single("image"),
  uploadMedia
);

// Get All Media
// Admin + Editor
router.get(
  "/",
  authMiddleware,
  authorize("admin", "editor"),
  getAllMedia
);

// Get Single Media
// Admin + Editor
router.get(
  "/:id",
  authMiddleware,
  authorize("admin", "editor"),
  getSingleMedia
);

// Update Media
// Admin + Editor
router.patch(
  "/:id",
  authMiddleware,
  authorize("admin", "editor"),
  upload.single("image"),
  updateMedia
);

// Delete Media
// Admin only
router.delete(
  "/:id",
  authMiddleware,
  authorize("admin"),
  deleteMedia
);

export default router;