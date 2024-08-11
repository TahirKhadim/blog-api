import { Register } from "../controllers/user.controller.js";
import { Router } from "express";
import { loginUser, logoutuser } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyjwt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverimage",
      maxCount: 1,
    },
  ]),
  Register
);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyjwt, logoutuser);

export default router;
