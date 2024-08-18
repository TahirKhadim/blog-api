import {
  createPost,
  deletePost,
  getpostbyUser,
  readPost,
  updatePost,
  getpostbyPostId,
} from "../controllers/posts.controller.js";
import { Router } from "express";

import { upload } from "../middleware/multer.middleware.js";
import { verifyjwt } from "../middleware/auth.middleware.js";

const router = Router();

// Create a post
router.route("/posts").post(
  verifyjwt,
  upload.single("image"), // Use single if only one image is expected
  createPost
);

// Update a post
router.route("/posts/:id").put(
  verifyjwt,
  upload.single("image"), // Use single if only one image is expected
  updatePost
);

// Read all posts
router.route("/posts").get(verifyjwt, readPost);

// Read all post by userID
router.route("/posts/:id").get(verifyjwt, getpostbyUser);

// read post by post id
router.route("/posts/posts/:id").get(verifyjwt, getpostbyPostId);

// Delete a post
router.route("/posts/:id").delete(verifyjwt, deletePost);

export default router;
