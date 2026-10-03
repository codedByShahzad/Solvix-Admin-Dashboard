import { Request } from "express";
import Website from "../models/Website";

/**
 * Single source of truth for "which websites may this user work with".
 *
 * The rule is the one GET /websites has always used:
 *   - Admin  → websites they OWN        (website.owner)
 *   - Editor → websites they are ASSIGNED to (website.editors)
 *
 * Blogs, media and website integrations all belong to a website, so every
 * controller derives its access from this helper. Previously those
 * controllers treated *any* admin as having access to *every* website, which
 * let a newly registered admin read other admins' blogs/media while their
 * Websites page (correctly owner-scoped) showed nothing.
 */

type AuthUser = { userId: string; role: "admin" | "editor" } | undefined;

type WebsiteLike = {
  owner?: unknown;
  editors?: unknown[];
};

const idOf = (value: unknown): string => {
  if (value && typeof value === "object" && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }
  return String(value);
};

/** Mongo filter for the websites the user may access. */
export const accessibleWebsiteFilter = (user: AuthUser) => {
  if (user?.role === "admin") return { owner: user.userId };
  if (user?.role === "editor") return { editors: user.userId };
  // Unknown role / no user → match nothing.
  return { _id: { $in: [] as string[] } };
};

/** IDs (as strings) of the websites the user may access. */
export const getAccessibleWebsiteIds = async (
  req: Request
): Promise<string[]> => {
  const websites = await Website.find(
    accessibleWebsiteFilter(req.user)
  ).select("_id");

  return websites.map((website) => website._id.toString());
};

/** Whether the user may access an already-loaded website document. */
export const canAccessWebsiteDoc = (
  website: WebsiteLike | null | undefined,
  user: AuthUser
): boolean => {
  if (!website || !user) return false;

  if (user.role === "admin") {
    return !!website.owner && idOf(website.owner) === user.userId;
  }

  if (user.role === "editor") {
    return (website.editors ?? []).some(
      (editor) => idOf(editor) === user.userId
    );
  }

  return false;
};
