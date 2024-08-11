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
router.use(verifyjwt);

router.route("/posts").post(
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
router.route("/posts/:id").get(getpostbyUser);
router.route("posts").post(deletePost);

export default router;
