import { Request, Response } from "express";
import Website from "../models/Website";
import User from "../models/User";

// ========================================
// Create Website
// ========================================

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
      editors: [],
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

// ========================================
// Get Websites
// ========================================

export const getWebsites = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    let websites;

    // Admin sees websites they own
    if (role === "admin") {
      websites = await Website.find({
        owner: userId,
      }).sort({ createdAt: -1 });
    }

    // Editor sees websites assigned to them
    else if (role === "editor") {
      websites = await Website.find({
        editors: userId,
      }).sort({ createdAt: -1 });
    }

    else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

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

// ========================================
// Get Single Website
// ========================================

export const getWebsite = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const userId = req.user!.userId;
    const role = req.user!.role;

    let website;

    // Admin can access websites they own
    if (role === "admin") {
      website = await Website.findOne({
        _id: id,
        owner: userId,
      });
    }

    // Editor can access websites assigned to them
    else if (role === "editor") {
      website = await Website.findOne({
        _id: id,
        editors: userId,
      });
    }

    else {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

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

// ========================================
// Update Website
// ========================================

export const updateWebsite = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const {
      name,
      slug,
      domain,
      description,
      isActive,
    } = req.body;

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

    // Check slug uniqueness if slug is being changed
    if (slug !== undefined && slug !== website.slug) {
      const existingSlug = await Website.findOne({
        slug,
        _id: { $ne: id },
      });

      if (existingSlug) {
        return res.status(409).json({
          success: false,
          message: "Website with this slug already exists",
        });
      }
    }

    // Check domain uniqueness if domain is being changed
    if (domain !== undefined && domain !== website.domain) {
      const existingDomain = await Website.findOne({
        domain,
        _id: { $ne: id },
      });

      if (existingDomain) {
        return res.status(409).json({
          success: false,
          message: "Website with this domain already exists",
        });
      }
    }

    // Update only fields that were provided
    if (name !== undefined) {
      website.name = name;
    }

    if (slug !== undefined) {
      website.slug = slug;
    }

    if (domain !== undefined) {
      website.domain = domain;
    }

    if (description !== undefined) {
      website.description = description;
    }

    if (isActive !== undefined) {
      website.isActive = isActive;
    }

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

// ========================================
// Delete Website
// ========================================

export const deleteWebsite = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

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

// ========================================
// Assign Editor to Website
// ========================================

export const assignEditor = async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

    const { editorId } = req.body;

    // Validate editor ID
    if (!editorId) {
      return res.status(400).json({
        success: false,
        message: "Editor ID is required",
      });
    }

    // Find editor
    const editor = await User.findById(editorId);

    if (!editor) {
      return res.status(404).json({
        success: false,
        message: "Editor not found",
      });
    }

    // Make sure selected user is an editor
    if (editor.role !== "editor") {
      return res.status(400).json({
        success: false,
        message: "Only users with the editor role can be assigned",
      });
    }

    // Find website owned by current admin
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

    // Check if editor is already assigned
    const alreadyAssigned = website.editors.some(
      (assignedEditor) => assignedEditor.toString() === editorId
    );

    if (alreadyAssigned) {
      return res.status(409).json({
        success: false,
        message: "Editor is already assigned to this website",
      });
    }

    // Assign editor
    website.editors.push(editor._id);

    const updatedWebsite = await website.save();

    return res.status(200).json({
      success: true,
      message: "Editor assigned successfully",
      data: updatedWebsite,
    });
  } catch (error) {
    console.error("Assign editor error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to assign editor",
    });
  }
};

// ========================================
// Transfer Website Ownership
// ========================================

export const transferWebsiteOwnership = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id;

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

    // Find website owned by current user
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