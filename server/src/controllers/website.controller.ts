import { Request, Response } from "express";
import Website from "../models/Website";
import User from "../models/User";

export const createWebsite = async (req: Request, res: Response) => {
  try {
    const { name, slug, domain, description } = req.body;

    // Validate required fields
    if (!name || !slug || !domain) {
      return res.status(400).json({
        success: false,
        message: "Name, slug, and domain are required",
      });
    }

    // Check if slug or domain already exists
    const existingWebsite = await Website.findOne({
      $or: [{ slug }, { domain }],
    });

    if (existingWebsite) {
      return res.status(409).json({
        success: false,
        message: "Website with this slug or domain already exists",
      });
    }

    // Create website
    const website = await Website.create({
      name,
      slug,
      domain,
      description,
      owner: req.user!.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Website created successfully",
      data: website,
    });
  } catch (error) {
    console.error("Create website error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create website",
    });
  }
};

export const getWebsites = async (req: Request, res: Response) => {
  try {
    const websites = await Website.find({
      owner: req.user!.userId,
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Websites fetched successfully",
      data: websites,
    });
  } catch (error) {
    console.error("Get websites error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch websites",
    });
  }
};

export const getWebsite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const website = await Website.findOne({
      _id: id,
      owner: req.user!.userId,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Website fetched successfully",
      data: website,
    });
  } catch (error) {
    console.error("Get website error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch website",
    });
  }
};

export const updateWebsite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { name, slug, domain, description, isActive } = req.body;

    const website = await Website.findOne({
      _id: id,
      owner: req.user!.userId,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    // Update only fields that were provided
    if (name !== undefined) website.name = name;
    if (slug !== undefined) website.slug = slug;
    if (domain !== undefined) website.domain = domain;
    if (description !== undefined) website.description = description;
    if (isActive !== undefined) website.isActive = isActive;

    const updatedWebsite = await website.save();

    return res.status(200).json({
      success: true,
      message: "Website updated successfully",
      data: updatedWebsite,
    });
  } catch (error) {
    console.error("Update website error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update website",
    });
  }
};

export const deleteWebsite = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const website = await Website.findOneAndDelete({
      _id: id,
      owner: req.user!.userId,
    });

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Website deleted successfully",
    });
  } catch (error) {
    console.error("Delete website error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete website",
    });
  }
};

export const transferWebsiteOwnership = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { owner } = req.body;

    if (!owner) {
      return res.status(400).json({
        success: false,
        message: "New owner ID is required",
      });
    }

    // Check if target user exists
    const newOwner = await User.findById(owner);

    if (!newOwner) {
      return res.status(404).json({
        success: false,
        message: "New owner not found",
      });
    }

    // Find the website
    const website = await Website.findById(id);

    if (!website) {
      return res.status(404).json({
        success: false,
        message: "Website not found",
      });
    }

    // Change ownership
    website.owner = newOwner._id;

    const updatedWebsite = await website.save();

    return res.status(200).json({
      success: true,
      message: "Website ownership transferred successfully",
      data: updatedWebsite,
    });
  } catch (error) {
    console.error("Transfer website ownership error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to transfer website ownership",
    });
  }
};