import { Request, Response } from "express";
import mongoose from "mongoose";
import MediaModel from "../models/Media.model";

/**
 * GET ALL MEDIA FOR AUTHENTICATED WEBSITE
 *
 * GET /api/v1/integration/media
 */
export const getIntegrationMedia = async (
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

    // Get website ID from authenticated integration
    const websiteId = req.integration.websiteId;

    // Get only media belonging to this website
    const media = await MediaModel.find({
      website: websiteId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: media.length,
      data: media,
    });
  } catch (error) {
    console.error("Get integration media error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch integration media",
    });
  }
};

/**
 * GET SINGLE MEDIA FOR AUTHENTICATED WEBSITE
 *
 * GET /api/v1/integration/media/:mediaId
 */
export const getIntegrationMediaById = async (
  req: Request<{ mediaId: string }>,
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

    const { mediaId } = req.params;

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(mediaId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid media ID",
      });
    }

    // Get website ID from authenticated integration
    const websiteId = req.integration.websiteId;

    /**
     * IMPORTANT:
     * The media must:
     * 1. Match the requested media ID
     * 2. Belong to the authenticated website
     */
    const media = await MediaModel.findOne({
      _id: mediaId,
      website: websiteId,
    });

    // Media doesn't exist or doesn't belong to this website
    if (!media) {
      return res.status(404).json({
        success: false,
        message: "Media not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: media,
    });
  } catch (error) {
    console.error("Get integration media by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch integration media",
    });
  }
};