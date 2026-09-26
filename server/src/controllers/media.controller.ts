import { Request, Response } from "express";
import mongoose from "mongoose";

import MediaModel from "../models/Media.model";
import WebsiteModel from "../models/Website";
import BlogModel from "../models/Blog";

import cloudinary from "../config/cloudinary";
import { uploadImage } from "../services/media.service";

// ============================================================
// Helper: Validate MongoDB ObjectId
// ============================================================

const isValidId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ============================================================
// Helper: Check Website Access
// ============================================================

const checkWebsiteAccess = (
  website: any,
  req: Request
): boolean => {
  const userId = req.user?.userId;
  const role = req.user?.role;

  if (!userId) {
    return false;
  }

  // Admin can access all websites
  if (role === "admin") {
    return true;
  }

  // Editor can access websites they own
  if (
    role === "editor" &&
    website?.owner?.toString() === userId
  ) {
    return true;
  }

  return false;
};

// ============================================================
// Upload Media
// ============================================================

export const uploadMedia = async (
  req: Request,
  res: Response
) => {
  try {
    // --------------------------------------------------------
    // Authentication
    // --------------------------------------------------------

    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // --------------------------------------------------------
    // File validation
    // --------------------------------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    // --------------------------------------------------------
    // Get body fields
    // --------------------------------------------------------

    const {
      websiteId,
      blogId,
      altText,
    } = req.body;

    // --------------------------------------------------------
    // Validate websiteId
    // --------------------------------------------------------

    if (!websiteId) {
      return res.status(400).json({
        success: false,
        message: "websiteId is required",
      });
    }

    if (!isValidId(websiteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid websiteId",
      });
    }

    // --------------------------------------------------------
    // Find website
    // --------------------------------------------------------

    const website = await WebsiteModel.findById(websiteId);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    // --------------------------------------------------------
    // Website authorization
    // --------------------------------------------------------

    if (!checkWebsiteAccess(website, req)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this website",
      });
    }

    // --------------------------------------------------------
    // Validate blog if supplied
    // --------------------------------------------------------

    let blog = undefined;

    if (blogId) {
      if (!isValidId(blogId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid blogId",
        });
      }

      blog = await BlogModel.findById(blogId);

      if (!blog) {
        return res.status(404).json({
          success: false,
          message: "Blog not found",
        });
      }

      // Blog must belong to the same website
      if (blog.website.toString() !== websiteId) {
        return res.status(400).json({
          success: false,
          message: "Blog does not belong to this website",
        });
      }
    }

    // --------------------------------------------------------
    // Upload image to Cloudinary
    // --------------------------------------------------------

    const uploadedImage = await uploadImage(
      req.file.buffer,
      `solvix/${websiteId}/media`
    );

    // --------------------------------------------------------
    // Create media record
    // --------------------------------------------------------

    const media = await MediaModel.create({
      website: websiteId,
      blog: blog?._id,
      filename: req.file.originalname,
      url: uploadedImage.url,
      publicId: uploadedImage.publicId,
      mimeType: req.file.mimetype,
      size: uploadedImage.bytes,
      width: uploadedImage.width,
      height: uploadedImage.height,
      altText,
    });

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Media uploaded successfully",
      data: media,
    });
  } catch (error) {
    console.error("Media upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload media",
    });
  }
};

// ============================================================
// Get All Media
// ============================================================

export const getAllMedia = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    // --------------------------------------------------------
    // Authentication
    // --------------------------------------------------------

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // --------------------------------------------------------
    // Find websites accessible by user
    // --------------------------------------------------------

    let websites;

    if (role === "admin") {
      websites = await WebsiteModel.find().select("_id");
    } else {
      websites = await WebsiteModel.find({
        owner: userId,
      }).select("_id");
    }

    const websiteIds = websites.map(
      (website) => website._id
    );

    // --------------------------------------------------------
    // Find media
    // --------------------------------------------------------

    const media = await MediaModel.find({
      website: {
        $in: websiteIds,
      },
    })
      .populate(
        "website",
        "name slug domain"
      )
      .populate(
        "blog",
        "title slug"
      )
      .sort({
        createdAt: -1,
      });

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,
      count: media.length,
      data: media,
    });
  } catch (error) {
    console.error("Get all media error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get media",
    });
  }
};

// ============================================================
// Get Single Media
// ============================================================

export const getSingleMedia = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    const id = req.params.id;

    // --------------------------------------------------------
    // Authentication
    // --------------------------------------------------------

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // --------------------------------------------------------
    // Validate media ID
    // --------------------------------------------------------

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Media ID is required",
      });
    }

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid media ID",
      });
    }

    // --------------------------------------------------------
    // Find media
    // --------------------------------------------------------

    const media = await MediaModel.findById(id)
      .populate(
        "website",
        "name slug domain owner"
      )
      .populate(
        "blog",
        "title slug"
      );

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    // --------------------------------------------------------
    // Website access
    // --------------------------------------------------------

    const website = media.website as any;

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website associated with this media was not found",
      });
    }

    const hasAccess =
      role === "admin" ||
      website.owner?.toString() === userId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this media",
      });
    }

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,
      data: media,
    });
  } catch (error) {
    console.error("Get single media error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get media",
    });
  }
};

// ============================================================
// Update Media
// ============================================================

export const updateMedia = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;

    const id = req.params.id;

    // --------------------------------------------------------
    // Authentication
    // --------------------------------------------------------

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // --------------------------------------------------------
    // Validate media ID
    // --------------------------------------------------------

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Media ID is required",
      });
    }

    if (!isValidId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid media ID",
      });
    }

    // --------------------------------------------------------
    // Find media
    // --------------------------------------------------------

    const media = await MediaModel.findById(id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    // --------------------------------------------------------
    // Find website
    // --------------------------------------------------------

    const website = await WebsiteModel.findById(
      media.website
    );

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website associated with this media was not found",
      });
    }

    // --------------------------------------------------------
    // Website authorization
    // --------------------------------------------------------

    const hasAccess =
      role === "admin" ||
      website.owner?.toString() === userId;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this media",
      });
    }

    // --------------------------------------------------------
    // Metadata fields
    // --------------------------------------------------------

    const {
      altText,
      filename,
      blog,
    } = req.body;

    // --------------------------------------------------------
    // Update alt text
    // --------------------------------------------------------

    if (altText !== undefined) {
      media.altText = altText;
    }

    // --------------------------------------------------------
    // Update filename
    // --------------------------------------------------------

    if (filename !== undefined) {
      media.filename = filename;
    }

    // --------------------------------------------------------
    // Update blog relationship
    // --------------------------------------------------------

    if (blog !== undefined) {
      if (blog === "" || blog === null) {
        media.blog = undefined;
      } else {
        // Validate blog ID
        if (!isValidId(blog)) {
          return res.status(400).json({
            success: false,
            message: "Invalid blog ID",
          });
        }

        // Find blog
        const blogDocument = await BlogModel.findById(
          blog
        );

        if (!blogDocument) {
          return res.status(404).json({
            success: false,
            message: "Blog not found",
          });
        }

        // Make sure blog belongs to same website
        if (
          blogDocument.website.toString() !==
          website._id.toString()
        ) {
          return res.status(400).json({
            success: false,
            message: "Blog does not belong to this website",
          });
        }

        media.blog = blogDocument._id;
      }
    }

    // --------------------------------------------------------
    // Replace image
    // --------------------------------------------------------

    if (req.file) {
      // Delete old image from Cloudinary
      if (media.publicId) {
        await cloudinary.uploader.destroy(
          media.publicId
        );
      }

      // Upload new image
      const uploadedImage = await uploadImage(
        req.file.buffer,
        `solvix/${website._id.toString()}/media`
      );

      // Update image information
      media.url = uploadedImage.url;

      media.publicId = uploadedImage.publicId;

      media.filename =
        filename ||
        req.file.originalname;

      media.mimeType =
        req.file.mimetype;

      media.size =
        uploadedImage.bytes;

      media.width =
        uploadedImage.width;

      media.height =
        uploadedImage.height;
    }

    // --------------------------------------------------------
    // Save media
    // --------------------------------------------------------

    await media.save();

    // --------------------------------------------------------
    // Get updated media
    // --------------------------------------------------------

    const updatedMedia =
      await MediaModel.findById(id)
        .populate(
          "website",
          "name slug domain"
        )
        .populate(
          "blog",
          "title slug"
        );

    // --------------------------------------------------------
    // Response
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Media updated successfully",
      data: updatedMedia,
    });
  } catch (error) {
    console.error("Update media error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update media",
    });
  }
};

// ========================================
// Delete Media
// ========================================

export const deleteMedia = async (
  req: Request,
  res: Response
) => {
  try {
    // ========================================
    // Get Authenticated User
    // ========================================

    const userId = req.user?.userId;
    const { id } = req.params;

    // ========================================
    // Authentication Check
    // ========================================

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ========================================
    // Media ID Validation
    // ========================================

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        success: false,
        message: "Valid Media ID is required",
      });
    }

    // ========================================
    // Find Media
    // ========================================

    const media = await MediaModel.findById(id);

    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    // ========================================
    // Find Associated Website
    // ========================================

    const website = await WebsiteModel.findById(
      media.website
    );

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    // ========================================
    // Check Website Ownership
    // ========================================

    if (website.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this media",
      });
    }

    // ========================================
    // Delete Image From Cloudinary
    // ========================================

    if (media.publicId) {
      await cloudinary.uploader.destroy(media.publicId);
    }

    // ========================================
    // Delete Media From MongoDB
    // ========================================

    await MediaModel.findByIdAndDelete(id);

    // ========================================
    // Success Response
    // ========================================

    return res.status(200).json({
      success: true,
      message: "Media deleted successfully",
    });

  } catch (error) {
    // ========================================
    // Error Handling
    // ========================================

    console.error("Delete media error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete media",
    });
  }
};