import { Request, Response, NextFunction } from "express";
import WebsiteIntegration from "../models/websiteIntegration.model";

export const integrationAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get credentials from request headers
    const apiKey = req.header("X-API-Key");
    const apiSecret = req.header("X-API-Secret");

    // Check that credentials were provided
    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        success: false,
        message: "API key and API secret are required",
      });
    }

    // Find the integration using the API key
    const integration = await WebsiteIntegration.findOne({
      apiKey,
    }).select("+apiKey +apiSecret");

    // API key doesn't exist
    if (!integration) {
      return res.status(401).json({
        success: false,
        message: "Invalid API key",
      });
    }

    // Make sure the integration has a secret
    if (!integration.apiSecret) {
      return res.status(401).json({
        success: false,
        message: "Integration credentials are not configured",
      });
    }

    // Check API secret
    if (integration.apiSecret !== apiSecret) {
      return res.status(401).json({
        success: false,
        message: "Invalid API secret",
      });
    }

    // Authentication successful
    console.log("✅ Integration authentication successful");
    console.log("Website ID:", integration.websiteId.toString());
    console.log("Path:", req.originalUrl);

    // Attach integration information to request
    req.integration = {
      integrationId: integration._id.toString(),
      websiteId: integration.websiteId.toString(),
    };

    next();
  } catch (error) {
    console.error("Integration authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Integration authentication failed",
    });
  }
};