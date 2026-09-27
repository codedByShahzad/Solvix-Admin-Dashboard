import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Website from "../models/Website";

export const websiteAccessMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

    // Check if website ID is valid
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid website ID",
      });
    }

    // Find website
    const website = await Website.findById(id);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    // Admin has access to every website
    if (req.user?.role === "admin") {
      return next();
    }

    // Editor must be assigned to this website
    if (req.user?.role === "editor") {
      const isAssigned = website.editors?.some(
        (editorId) => editorId.toString() === req.user?.userId,
      );

      if (!isAssigned) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You do not have access to this website",
        });
      }

      return next();
    }

    // Any unknown role
    return res.status(403).json({
      success: false,
      message: "Forbidden: You do not have permission to access this resource",
    });
  } catch (error) {
    console.error("Website access middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify website access",
    });
  }
};
