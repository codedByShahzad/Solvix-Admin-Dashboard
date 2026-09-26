import { Router } from "express";

import {
  createBlog,
  getBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
} from "../controllers/blog.controller";

import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// ========================================
// Blog Routes
// ========================================

router.post("/", authMiddleware, createBlog);

router.get("/", authMiddleware, getBlogs);

router.get("/:id", authMiddleware, getBlogById);

router.patch("/:id", authMiddleware, updateBlog);

router.delete("/:id", authMiddleware, deleteBlog);

export default router;