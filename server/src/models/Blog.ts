import mongoose, { Document, Schema, Types } from "mongoose";

// ========================================
// Block
// ========================================

interface Block {
  type: "paragraph" | "list";
  text?: string;
  items?: string[];
}

// ========================================
// Section
// ========================================

interface Section {
  id: string;
  title: string;
  blocks: Block[];
}

// ========================================
// Blog
// ========================================

export interface Blog extends Document {
  website: Types.ObjectId;

  slug: string;
  title: string;
  subtitle?: string;

  heroImage?: string;

  category?: string;

  publishDate?: Date;

  readingTime?: string;

  canonicalPath?: string;

  seoTitle?: string;
  seoDescription?: string;

  keywords: string[];

  ogImage?: string;

  sections: Section[];

  status: "draft" | "published" | "archived";

  author: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;

  relatedSlugs: string[];
}

// ========================================
// Block Schema
// ========================================

const blockSchema = new Schema<Block>(
  {
    type: {
      type: String,
      enum: ["paragraph", "list"],
      required: true,
    },

    text: {
      type: String,
      trim: true,
    },

    items: {
      type: [String],
      default: undefined,
    },
  },
  {
    _id: false,
  }
);

// ========================================
// Section Schema
// ========================================

const sectionSchema = new Schema<Section>(
  {
    id: {
      type: String,
      required: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    blocks: {
      type: [blockSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

// ========================================
// Blog Schema
// ========================================

const blogSchema = new Schema<Blog>(
  {
    website: {
      type: Schema.Types.ObjectId,
      ref: "Website",
      required: true,
      index: true,
    },

    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    subtitle: {
      type: String,
      trim: true,
    },

    heroImage: {
      type: String,
    },

    category: {
      type: String,
      trim: true,
    },

    publishDate: {
      type: Date,
    },

    readingTime: {
      type: String,
      trim: true,
    },

    canonicalPath: {
      type: String,
      trim: true,
    },

    seoTitle: {
      type: String,
      trim: true,
    },

    seoDescription: {
      type: String,
      trim: true,
    },

    keywords: {
      type: [String],
      default: [],
    },

    ogImage: {
      type: String,
    },

    sections: {
      type: [sectionSchema],
      default: [],
    },

    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },

    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    relatedSlugs: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// ========================================
// Unique slug per website
// ========================================

blogSchema.index(
  {
    website: 1,
    slug: 1,
  },
  {
    unique: true,
  }
);

// ========================================
// Model
// ========================================

const BlogModel = mongoose.model<Blog>("Blog", blogSchema);

export default BlogModel;