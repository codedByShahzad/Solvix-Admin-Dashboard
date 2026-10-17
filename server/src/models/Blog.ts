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
// Table of contents entry
// ========================================

interface TocItem {
  id: string;
  title: string;
  level: 2 | 3;
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

  /**
   * Rich-text content (Tiptap JSON) — the source of truth for posts written
   * with the rich-text editor. On save, `contentHtml`, `toc` and `sections`
   * are derived from it (utils/blogContent.ts). Older posts only have `sections`.
   */
  contentJson?: Record<string, unknown>;

  /** Article HTML with heading ids — derived from contentJson. */
  contentHtml?: string;

  /** Table of contents from the H2/H3 headings — derived from contentJson. */
  toc?: TocItem[];

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
// TOC Schema
// ========================================

const tocItemSchema = new Schema<TocItem>(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    level: { type: Number, enum: [2, 3], required: true },
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
  set: (keywords: string[]) =>
    keywords.map((keyword) => keyword.trim().toLowerCase()),
},

    ogImage: {
      type: String,
    },

    sections: {
      type: [sectionSchema],
      default: [],
    },

    contentJson: {
      type: Schema.Types.Mixed,
      default: undefined,
    },

    contentHtml: {
      type: String,
    },

    toc: {
      type: [tocItemSchema],
      default: undefined,
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
  set: (slugs: string[]) =>
    slugs.map((slug) => slug.trim().toLowerCase()),
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