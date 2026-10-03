import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Website from "../models/Website";
import { canAccessWebsiteDoc } from "../utils/access";

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

    // Admin → must own the website; editor → must be assigned to it.
    // Same rule as GET /websites (see utils/access.ts).
    if (req.user?.role === "admin" || req.user?.role === "editor") {
      if (!canAccessWebsiteDoc(website, req.user)) {
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
