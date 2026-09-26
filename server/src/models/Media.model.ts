import mongoose, { Document, Schema, Types } from "mongoose";

// ========================================
// Media
// ========================================

export interface IMedia extends Document {
  website: Types.ObjectId;
  blog?: Types.ObjectId;

  filename: string;
  url: string;
  publicId?: string;

  mimeType?: string;
  size?: number;

  width?: number;
  height?: number;

  altText?: string;

  createdAt: Date;
  updatedAt: Date;
}

// ========================================
// Media Schema
// ========================================

const mediaSchema = new Schema<IMedia>(
  {
    // ========================================
    // Website Relationship
    // ========================================

    website: {
      type: Schema.Types.ObjectId,
      ref: "Website",
      required: true,
      index: true,
    },

    // ========================================
    // Blog Relationship
    // ========================================

    blog: {
      type: Schema.Types.ObjectId,
      ref: "Blog",
      index: true,
    },

    // ========================================
    // File Information
    // ========================================

    filename: {
      type: String,
      required: true,
      trim: true,
    },

    // ========================================
    // Image URL
    // ========================================

    url: {
      type: String,
      required: true,
      trim: true,
    },

    // ========================================
    // Storage Provider ID
    // ========================================

    publicId: {
      type: String,
      trim: true,
    },

    // ========================================
    // File Metadata
    // ========================================

    mimeType: {
      type: String,
      trim: true,
    },

    size: {
      type: Number,
    },

    width: {
      type: Number,
    },

    height: {
      type: Number,
    },

    // ========================================
    // SEO / Accessibility
    // ========================================

    altText: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ========================================
// Model
// ========================================

const MediaModel = mongoose.model<IMedia>("Media", mediaSchema);

export default MediaModel;