import { Request, Response } from "express";
import mongoose from "mongoose";
import BlogModel from "../models/Blog";

/**
 * GET ALL PUBLISHED BLOGS
 * GET /api/v1/integration/blogs
 */
export const getIntegrationBlogs = async (
  req: Request,
  res: Response
) => {
  try {
    // Make sure integration authentication was successful
    if (!req.integration) {
      return res.status(401).json({
        success: false,
        message: "Integration authentication required",
      });
    }

    // Get websiteId from authenticated integration
    const websiteId = req.integration.websiteId;

    // Only return published blogs belonging to this website
    const blogs = await BlogModel.find({
      website: websiteId,
      status: "published",
    })
      .populate("website", "name domain")
      .populate("author", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error) {
    console.error("Get integration blogs error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch integration blogs",
    });
  }
};

/**
 * GET SINGLE PUBLISHED BLOG
 * GET /api/v1/integration/blogs/:blogId
 */
export const getIntegrationBlog = async (
  req: Request<{ blogId: string }>,
  res: Response
) => {
  try {
    // Make sure integration authentication was successful
    if (!req.integration) {
      return res.status(401).json({
        success: false,
        message: "Integration authentication required",
      });
    }

    const { blogId } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(blogId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }

    // Get websiteId from authenticated integration
    const websiteId = req.integration.websiteId;

    // Find only a published blog belonging to this website
    const blog = await BlogModel.findOne({
      _id: blogId,
      website: websiteId,
      status: "published",
    })
      .populate("website", "name domain")
      .populate("author", "name email");

    // Blog does not exist or does not belong to this website
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Published blog not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("Get integration blog error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch integration blog",
    });
  }
};