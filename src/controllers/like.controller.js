import { Like } from "../models/like.model";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Post } from "../models/post.model.js";

import { Mongoose,isValidObjectId } from "mongoose";


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
    const existingLike = await Like.findOne({ postId, userId });

    if (existingLike) {
        // If the like exists, remove it (unlike)
        await Like.findByIdAndDelete(existingLike._id);
        return res.status(200).json(new apiResponse(200, null, "Post unliked successfully"));
    } else {
        // If the like doesn't exist, create a new like
        const newLike = new Like({ postId, userId });
        await newLike.save();
        return res.status(200).json(new apiResponse(200, newLike, "Post liked successfully"));
    }
});

export { toggleLike };
