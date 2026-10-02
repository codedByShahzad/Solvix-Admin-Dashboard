import { Request, Response } from "express";
import mongoose from "mongoose";

import BlogModel from "../models/Blog";
import Website from "../models/Website";

// ========================================
// Helpers
// ========================================

/**
 * Website IDs the current user may manage blogs for.
 *
 * - Admin → every website (null = no restriction)
 * - Editor → websites they are assigned to (website.editors)
 */
const getAccessibleWebsiteIds = async (
  req: Request
): Promise<string[] | null> => {
  if (req.user?.role === "admin") {
    return null;
  }

  const websites = await Website.find({
    editors: req.user?.userId,
  }).select("_id");

  return websites.map((website) => website._id.toString());
};

const canAccessWebsite = (
  allowed: string[] | null,
  websiteId: unknown
): boolean => {
  if (allowed === null) {
    return true;
  }

  return !!websiteId && allowed.includes(String(websiteId));
};

/**
 * Map Mongoose errors to proper HTTP responses instead of a generic 500.
 */
const sendBlogError = (
  res: Response,
  error: unknown,
  fallbackMessage: string
) => {
  const err = error as {
    code?: number;
    name?: string;
    message?: string;
    errors?: Record<string, { message: string }>;
  };

  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message:
        "A blog with this slug already exists on this website",
    });
  }

  if (err?.name === "ValidationError") {
    const details = Object.values(err.errors ?? {}).map(
      (e) => e.message
    );

    return res.status(400).json({
      success: false,
      message: details[0] ?? "Blog validation failed",
      errors: details,
    });
  }

  if (err?.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID or field value",
    });
  }

  console.error(fallbackMessage, error);

  return res.status(500).json({
    success: false,
    message: fallbackMessage,
  });
};

const isValidId = (id: unknown) =>
  typeof id === "string" &&
  mongoose.Types.ObjectId.isValid(id);

// ========================================
// Create Blog
// ========================================

export const createBlog = async (
  req: Request,
  res: Response
) => {
  try {
    const allowed = await getAccessibleWebsiteIds(req);

    if (
      !canAccessWebsite(
        allowed,
        req.body.website
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: You do not have access to this website",
      });
    }

    /**
     * Author behavior:
     *
     * 1. Use the author selected from the dashboard.
     * 2. If no author was supplied, fall back to the
     *    currently logged-in user.
     */
    const author =
      req.body.author || req.user?.userId;

    const blog = await BlogModel.create({
      ...req.body,
      author,
      status: req.body.status || "draft",
    });

    const populatedBlog = await BlogModel.findById(
      blog._id
    )
      .populate("website", "name domain")
      .populate("author", "name email");

    return res.status(201).json({
      success: true,
      message: "Blog created successfully",
      data: populatedBlog ?? blog,
    });
  } catch (error) {
    sendBlogError(
      res,
      error,
      "Failed to create blog"
    );
  }
};

// ========================================
// Get All Blogs
// ========================================

export const getBlogs = async (
  req: Request,
  res: Response
) => {
  try {
    const { status, website } = req.query;

    const filter: Record<string, unknown> = {};

    if (status) {
      filter.status = status;
    }

    const allowed = await getAccessibleWebsiteIds(
      req
    );

    if (allowed !== null) {
      filter.website = {
        $in: allowed,
      };
    }

    if (website && isValidId(website)) {
      filter.website =
        allowed === null ||
        allowed.includes(String(website))
          ? website
          : { $in: [] };
    }

    const blogs = await BlogModel.find(filter)
      .populate("website", "name domain")
      .populate("author", "name email")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error) {
    sendBlogError(
      res,
      error,
      "Failed to fetch blogs"
    );
  }
};

// ========================================
// Get Single Blog
// ========================================

export const getBlogById = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }

    const blog = await BlogModel.findById(
      req.params.id
    )
      .populate("website", "name domain")
      .populate("author", "name email");

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const allowed = await getAccessibleWebsiteIds(
      req
    );

    const websiteId =
      (
        blog.website as unknown as {
          _id?: unknown;
        }
      )?._id ?? blog.website;

    if (
      !canAccessWebsite(
        allowed,
        websiteId
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: You do not have access to this blog",
      });
    }

    return res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    sendBlogError(
      res,
      error,
      "Failed to fetch blog"
    );
  }
};

// ========================================
// Update Blog
// ========================================

export const updateBlog = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }

    const existing = await BlogModel.findById(
      req.params.id
    ).select("website");

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const allowed = await getAccessibleWebsiteIds(
      req
    );

    if (
      !canAccessWebsite(
        allowed,
        existing.website
      ) ||
      (req.body.website !== undefined &&
        !canAccessWebsite(
          allowed,
          req.body.website
        ))
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: You do not have access to this blog",
      });
    }

    /**
     * Keep the author in the update data.
     *
     * Previously this code removed author:
     *
     * const { author: _author, ...updateData } = req.body;
     *
     * That prevented the Author dropdown from
     * actually changing the blog author.
     */
    const updateData = {
      ...req.body,
    };

    /**
     * Only stamp a publish date when publishing
     * without one, so editing a published post keeps
     * its original date.
     */
    if (
      updateData.status === "published" &&
      !updateData.publishDate
    ) {
      updateData.publishDate = new Date();
    }

    const blog =
      await BlogModel.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      )
        .populate("website", "name domain")
        .populate("author", "name email");

    return res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: blog,
    });
  } catch (error) {
    sendBlogError(
      res,
      error,
      "Failed to update blog"
    );
  }
};

// ========================================
// Delete Blog
// ========================================

export const deleteBlog = async (
  req: Request,
  res: Response
) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog ID",
      });
    }

    const blog = await BlogModel.findById(
      req.params.id
    ).select("website");

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const allowed = await getAccessibleWebsiteIds(
      req
    );

    if (
      !canAccessWebsite(
        allowed,
        blog.website
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Forbidden: You do not have access to this blog",
      });
    }

    await BlogModel.findByIdAndDelete(
      req.params.id
    );

    return res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });
  } catch (error) {
    sendBlogError(
      res,
      error,
      "Failed to delete blog"
    );
  }
};