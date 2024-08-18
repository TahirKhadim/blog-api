import { Like } from "../models/like.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Post } from "../models/post.model.js";
import { isValidObjectId } from "mongoose";

const toggleLike = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const userId = req.user?._id;

  // Validate the postId
  if (!isValidObjectId(postId)) {
    throw new apiError(401, "Invalid post ID");
  }

  // Check if the post exists
  const post = await Post.findById(postId);
  if (!post) {
    throw new apiError(404, "Post not found");
  }

  // Check if the user has already liked the post
  const existingLike = await Like.findOne({ post: postId, likeBy: userId });

  if (existingLike) {
    // If the like exists, remove it (unlike)
    console.log("Removing like:", existingLike);
    await Like.findByIdAndDelete(existingLike._id);
  } else {
    // If the like doesn't exist, create a new like
    const newLike = new Like({ post: postId, likeBy: userId });
    console.log("Adding new like:", newLike);
    await newLike.save();
  }

  // Get the updated likes count
  const likesCount = await Like.countDocuments({ post: postId });
  console.log("Updated likes count:", likesCount);

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        { likesCount },
        "Post like status updated successfully"
      )
    );
});

export { toggleLike };
