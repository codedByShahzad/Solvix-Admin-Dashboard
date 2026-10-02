import mongoose, { Document, Schema } from "mongoose";

export interface IWebsiteIntegration extends Document {
  websiteId: mongoose.Types.ObjectId;

  type: "REST_API";

  apiUrl: string;

  apiKey?: string;

  apiSecret?: string;

  status: "connected" | "disconnected" | "error";

  lastConnectedAt?: Date;

  createdAt: Date;

  updatedAt: Date;
}

const websiteIntegrationSchema = new Schema<IWebsiteIntegration>(
  {
    websiteId: {
      type: Schema.Types.ObjectId,
      ref: "Website",
      required: true,
      unique: true,
    },

    type: {
      type: String,
      enum: ["REST_API"],
      required: true,
      default: "REST_API",
    },

    apiUrl: {
      type: String,
      required: true,
      trim: true,
    },

    apiKey: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },

    apiSecret: {
      type: String,
      select: false,
    },

    status: {
      type: String,
      enum: ["connected", "disconnected", "error"],
      default: "disconnected",
    },

    lastConnectedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const WebsiteIntegration = mongoose.model<IWebsiteIntegration>(
  "WebsiteIntegration",
  websiteIntegrationSchema
);

export default WebsiteIntegration;