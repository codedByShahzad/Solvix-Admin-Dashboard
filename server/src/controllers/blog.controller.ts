import { Request, Response } from "express";
import BlogModel from "../models/Blog";

// ========================================
// Create Blog
// ========================================

export const createBlog = async (req: Request, res: Response) => {
  try {
    const blog = await BlogModel.create({
      ...req.body,
      author: req.user?.userId,
      status: req.body.status || "draft",
    });

    res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create blog",
      error,
    });
  }
};

// ========================================
// Get All Blogs
// ========================================

export const getBlogs = async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    const blogs = await BlogModel.find(filter)
      .populate("website", "name domain")
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
      error,
    });
  }
};

// ========================================
// Get Single Blog
// ========================================

export const getBlogById = async (req: Request, res: Response) => {
  try {
    const blog = await BlogModel.findById(req.params.id)
      .populate("website", "name domain")
      .populate("author", "name email");

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
      error,
    });
  }
};

// ========================================
// Update Blog
// ========================================

export const updateBlog = async (req: Request, res: Response) => {
  try {
    const updateData = {
      ...req.body,
    };

    if (req.body.status === "published") {
      updateData.publishDate = new Date();
    }

    const blog = await BlogModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update blog",
      error,
    });
  }
};

// ========================================
// Delete Blog
// ========================================

export const deleteBlog = async (req: Request, res: Response) => {
  try {
    const blog = await BlogModel.findByIdAndDelete(req.params.id);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete blog",
      error,
    });
  }
};