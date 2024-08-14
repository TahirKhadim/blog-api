import {
  createPost,
  deletePost,
  getpostbyUser,
  readPost,
  updatePost,
} from "../controllers/posts.controller.js";
import { Router } from "express";

import { upload } from "../middleware/multer.middleware.js";
import { verifyjwt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/posts").post(
  verifyjwt,
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  createPost
);

router.route("/posts/:id").post(
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  updatePost
);

router.route("/posts").get(readPost);
router.route("/posts/:id").get(verifyjwt, getpostbyUser);
router.route("/posts/:id").delete(verifyjwt, deletePost);
router.route("/posts/:id").put(
  verifyjwt,
  upload.fields([
    {
      name: "image",
      maxCount: 1,
    },
  ]),
  updatePost
);

export default router;
