import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: "admin" | "editor";
      };

      integration?: {
        integrationId: string;
        websiteId: string;
      };
    }
  }
}

export {};