import { Router } from "express";

import {
  getIntegrationBlogs,
  getIntegrationBlog,
} from "../controllers/integration.controller";

import {
  getIntegrationMedia,
  getIntegrationMediaById,
} from "../controllers/integrationMedia.controller";

import { integrationAuth } from "../middleware/integrationAuth.middleware";

const router = Router();

/*
|--------------------------------------------------------------------------
| Blog Integration APIs
|--------------------------------------------------------------------------
*/

// Get all published blogs
router.get(
  "/blogs",
  integrationAuth,
  getIntegrationBlogs
);

// Get single published blog
router.get(
  "/blogs/:blogId",
  integrationAuth,
  getIntegrationBlog
);

/*
|--------------------------------------------------------------------------
| Media Integration APIs
|--------------------------------------------------------------------------
*/

// Get all media for authenticated website
router.get(
  "/media",
  integrationAuth,
  getIntegrationMedia
);

// Get single media for authenticated website
router.get(
  "/media/:mediaId",
  integrationAuth,
  getIntegrationMediaById
);

export default router;