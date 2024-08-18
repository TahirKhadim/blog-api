import {toggleLike } from '../controllers/like.controller.js'
  import { Router } from "express";
  
  import { upload } from "../middleware/multer.middleware.js";
  import { verifyjwt } from "../middleware/auth.middleware.js";
  
  const router = Router();
  
 

  // Route for toggling like on a post
  router.route('/like/:postId').post(verifyjwt, toggleLike);
  
  export default router;
  