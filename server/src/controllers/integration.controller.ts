import { Request, Response } from "express";
import BlogModel from "../models/Blog";

export const getIntegrationBlogs = async (
  req: Request,
  res: Response
) => {
  try {
    const { status, websiteId } = req.query;

    const filter: any = {};

    // Only apply status filter when provided
    if (status) {
      filter.status = status;
    }

    // Only apply website filter when provided
    if (websiteId) {
      filter.website = websiteId;
    }

    const blogs = await BlogModel.find(filter)
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