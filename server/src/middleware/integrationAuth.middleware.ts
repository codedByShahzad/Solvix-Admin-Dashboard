import { Request, Response, NextFunction } from "express";

export const integrationAuth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get credentials from request headers
    const apiKey = req.headers["x-api-key"];
    const apiSecret = req.headers["x-api-secret"];

    // Get expected credentials from environment variables
    const expectedApiKey = process.env.SOLVIX_API_KEY;
    const expectedApiSecret = process.env.SOLVIX_API_SECRET;

    // Check server configuration
    if (!expectedApiKey || !expectedApiSecret) {
      console.error("❌ Solvix integration credentials are not configured");

      return res.status(500).json({
        success: false,
        message: "Integration credentials are not configured",
      });
    }

    // Check credentials
    if (
      apiKey !== expectedApiKey ||
      apiSecret !== expectedApiSecret
    ) {
      console.error("❌ Invalid integration credentials");
      console.error("Path:", req.originalUrl);
      console.error("API Key received:", !!apiKey);
      console.error("API Secret received:", !!apiSecret);

      return res.status(401).json({
        success: false,
        message: "Invalid integration credentials",
      });
    }

    // Authentication successful
    console.log("✅ Integration authentication successful");
    console.log("Path:", req.originalUrl);

    next();
  } catch (error) {
    console.error("Integration authentication error:", error);

    return res.status(500).json({
      success: false,
      message: "Integration authentication failed",
    });
  }
};