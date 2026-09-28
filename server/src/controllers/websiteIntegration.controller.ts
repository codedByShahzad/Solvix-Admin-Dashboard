import { Request, Response } from "express";
import WebsiteIntegration from "../models/websiteIntegration.model";
import Website from "../models/Website";

export const createWebsiteIntegration = async (
  req: Request,
  res: Response
) => {
  try {
    const { websiteId, type, apiUrl, apiKey, apiSecret } = req.body;

    // 1. Validate required fields
    if (!websiteId || !apiUrl) {
      return res.status(400).json({
        success: false,
        message: "websiteId and apiUrl are required",
      });
    }

    // 2. Check whether the website exists
    const website = await Website.findById(websiteId);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    // 3. Check whether an integration already exists
    const existingIntegration = await WebsiteIntegration.findOne({
      websiteId,
    });

    if (existingIntegration) {
      return res.status(409).json({
        success: false,
        message: "Integration already exists for this website",
      });
    }

    // 4. Create integration
    const integration = await WebsiteIntegration.create({
      websiteId,
      type: type || "REST_API",
      apiUrl,
      apiKey,
      apiSecret,
      status: "disconnected",
    });

    // 5. Return safe response
    return res.status(201).json({
      success: true,
      message: "Website integration created successfully",
      data: {
        id: integration._id,
        websiteId: integration.websiteId,
        type: integration.type,
        apiUrl: integration.apiUrl,
        status: integration.status,
        createdAt: integration.createdAt,
      },
    });
  } catch (error) {
    console.error("Create website integration error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getWebsiteIntegration = async (
  req: Request,
  res: Response
) => {
  try {
    const { websiteId } = req.params;

    // 1. Find integration
    const integration = await WebsiteIntegration.findOne({
      websiteId,
    });

    // 2. Integration doesn't exist
    if (!integration) {
      return res.status(404).json({
        success: false,
        message: "Website integration not found",
      });
    }

    // 3. Return safe configuration
    return res.status(200).json({
      success: true,
      data: {
        id: integration._id,
        websiteId: integration.websiteId,
        type: integration.type,
        apiUrl: integration.apiUrl,
        status: integration.status,
        lastConnectedAt: integration.lastConnectedAt,
        createdAt: integration.createdAt,
        updatedAt: integration.updatedAt,
      },
    });
  } catch (error) {
    console.error("Get website integration error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const updateWebsiteIntegration = async (
  req: Request,
  res: Response
) => {
  try {
    const { websiteId } = req.params;
    const { type, apiUrl, apiKey, apiSecret } = req.body;

    // 1. Find existing integration
    const integration = await WebsiteIntegration.findOne({
      websiteId,
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: "Website integration not found",
      });
    }

    // 2. Update only provided fields
    if (type !== undefined) {
      integration.type = type;
    }

    if (apiUrl !== undefined) {
      integration.apiUrl = apiUrl;
    }

    if (apiKey !== undefined) {
      integration.apiKey = apiKey;
    }

    if (apiSecret !== undefined) {
      integration.apiSecret = apiSecret;
    }

    // 3. Updating credentials means the connection
    // needs to be tested again
    integration.status = "disconnected";
    integration.lastConnectedAt = undefined;

    // 4. Save changes
    await integration.save();

    // 5. Return safe response
    return res.status(200).json({
      success: true,
      message: "Website integration updated successfully",
      data: {
        id: integration._id,
        websiteId: integration.websiteId,
        type: integration.type,
        apiUrl: integration.apiUrl,
        status: integration.status,
        lastConnectedAt: integration.lastConnectedAt,
        updatedAt: integration.updatedAt,
      },
    });
  } catch (error) {
    console.error("Update website integration error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteWebsiteIntegration = async (
  req: Request,
  res: Response
) => {
  try {
    const { websiteId } = req.params;

    // 1. Find the integration
    const integration = await WebsiteIntegration.findOne({
      websiteId,
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: "Website integration not found",
      });
    }

    // 2. Delete the integration
    await WebsiteIntegration.deleteOne({
      websiteId,
    });

    // 3. Return success response
    return res.status(200).json({
      success: true,
      message: "Website integration deleted successfully",
    });
  } catch (error) {
    console.error("Delete website integration error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const testWebsiteIntegration = async (
  req: Request,
  res: Response
) => {
  try {
    const { websiteId } = req.params;

    // Get integration including hidden credentials
    const integration = await WebsiteIntegration.findOne({
      websiteId,
    }).select("+apiKey +apiSecret");

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: "Website integration not found",
      });
    }

    // Check API URL
    if (!integration.apiUrl) {
      return res.status(400).json({
        success: false,
        message: "API URL is not configured",
      });
    }

    try {
      // Send request to external website
      const response = await fetch(integration.apiUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",

          ...(integration.apiKey && {
            "X-API-Key": integration.apiKey,
          }),

          ...(integration.apiSecret && {
            "X-API-Secret": integration.apiSecret,
          }),
        },
      });

      // External API responded successfully
      if (response.ok) {
        integration.status = "connected";
        integration.lastConnectedAt = new Date();

        await integration.save();

        return res.status(200).json({
          success: true,
          message: "Website connection successful",
          data: {
            websiteId: integration.websiteId,
            status: integration.status,
            lastConnectedAt: integration.lastConnectedAt,
          },
        });
      }

      // External API responded but with an error
      integration.status = "error";
      await integration.save();

      return res.status(400).json({
        success: false,
        message: "Website connection failed",
        data: {
          websiteId: integration.websiteId,
          status: integration.status,
          externalStatus: response.status,
        },
      });
    } catch (connectionError) {
      console.error(
        "External website connection error:",
        connectionError
      );

      integration.status = "error";
      await integration.save();

      return res.status(400).json({
        success: false,
        message: "Unable to connect to external website",
        data: {
          websiteId: integration.websiteId,
          status: integration.status,
        },
      });
    }
  } catch (error) {
    console.error("Test website integration error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};