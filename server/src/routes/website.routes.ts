import { Router } from "express";
import {
  createWebsite,
  getWebsites,
  getWebsite,
  updateWebsite,
  deleteWebsite,
  assignEditor,
  transferWebsiteOwnership,
} from "../controllers/website.controller";
import { authMiddleware, adminMiddleware } from "../middleware/auth.middleware";

const router = Router();

// ========================================
// Get Websites
// Admin → owned websites
// Editor → assigned websites
// ========================================

router.get("/", authMiddleware, getWebsites);

// ========================================
// Get Single Website
// Admin → owned website
// Editor → assigned website
// ========================================

router.get("/:id", authMiddleware, getWebsite);

// ========================================
// Admin Website Management
// ========================================

// Create Website
router.post("/", authMiddleware, adminMiddleware, createWebsite);

// Update Website
router.patch("/:id", authMiddleware, adminMiddleware, updateWebsite);

// Delete Website
router.delete("/:id", authMiddleware, adminMiddleware, deleteWebsite);

// ========================================
// Assign Editor
// ========================================

router.patch(
  "/:id/assign-editor",
  authMiddleware,
  adminMiddleware,
  assignEditor
);

// ========================================
// Transfer Website Ownership
// ========================================

router.patch(
  "/:id/owner",
  authMiddleware,
  adminMiddleware,
  transferWebsiteOwnership
);

export default router;