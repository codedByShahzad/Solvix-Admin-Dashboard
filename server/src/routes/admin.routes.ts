import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { authorize } from "../middleware/role.middleware";
import User from "../models/User";

const router = Router();

router.get(
  "/test",
  authMiddleware,
  authorize("admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Admin access granted",
      user: req.user,
    });
  }
);

// ========================================
// List Editors (Admin only, read-only)
// Needed so the dashboard can show editors and
// assign them to websites (PATCH /websites/:id/assign-editor).
// ========================================

router.get(
  "/editors",
  authMiddleware,
  authorize("admin"),
  async (req, res) => {
    try {
      const editors = await User.find({ role: "editor" })
        .select("-password")
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        count: editors.length,
        data: editors,
      });
    } catch (error) {
      console.error("List editors error:", error);

      res.status(500).json({
        success: false,
        message: "Failed to fetch editors",
      });
    }
  }
);

export default router;
