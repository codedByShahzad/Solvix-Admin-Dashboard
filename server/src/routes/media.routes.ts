import { Router } from "express";

import {
  uploadMedia,
  getAllMedia,
  getSingleMedia,
  updateMedia,
  deleteMedia,
} from "../controllers/media.controller";

import {authMiddleware} from "../middleware/auth.middleware";
import upload from "../middleware/upload.middleware";

const router = Router();

// ========================================
// Media Routes
// ========================================

// Upload Media
router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  uploadMedia
);

// Get All Media
router.get(
  "/",
  authMiddleware,
  getAllMedia
);

// Get Single Media
router.get(
  "/:id",
  authMiddleware,
  getSingleMedia
);

// Update Media
router.patch(
  "/:id",
  authMiddleware,
  upload.single("image"),
  updateMedia
);

// Delete Media
router.delete(
  "/:id",
  authMiddleware,
  deleteMedia
);

export default router;