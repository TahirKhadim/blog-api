import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { Post } from "../models/post.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { isValidObjectId } from "mongoose";
import mongoose from "mongoose";

const createPost = asyncHandler(async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log("Request Files:", req.file);

    const { title, description, writtenby } = req.body;

    if (!title || !description || !writtenby) {
      throw new apiError(400, "These are required fields");
    }

    const imagelocalpath = req.file?.path;
    if (!imagelocalpath) {
      throw new apiError(400, "Image is required");
    }

    const image = await uploadOnCloudinary(imagelocalpath);
    if (!image) {
      throw new apiError(500, "Image upload failed");
    }

    const post = await Post.create({
      title,
      description,
      writtenby,
      image: image.url,
      owner: req.user?._id,
    });
    console.log("post data", post);

    const postcreated = await Post.aggregate([
      {
        $match: { _id: post?._id },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "ownerDetails",
        },
      },
      { $unwind: "$ownerDetails" },
      {
        $project: {
          title: 1,
          description: 1,
          writtenBy: 1,
          image: 1,
          owner: {
            _id: "$ownerDetails._id",
            username: "$ownerDetails.username",
            fullname: "$ownerDetails.fullname",
            email: "$ownerDetails.email",
            avatar: "$ownerDetails.avatar",
          },
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    if (!postcreated || postcreated.length === 0) {
      throw new apiError(500, "Post not created or owner details not found");
    }

    console.log("Post Created with Owner Details:", postcreated);

    return res
      .status(200)
      .json(new apiResponse(200, postcreated, "Post created successfully"));
  } catch (error) {
    console.error("Server Error:", error);
    return res
      .status(error.status || 500)
      .json({ message: error.message || "Internal Server Error" });
  }
});

const readPost = asyncHandler(async (req, res) => {
  try {
    const posts = await Post.aggregate([
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "post",
          as: "likes",
        },
      },
      {
        $addFields: {
          likesCount: { $size: "$likes" },
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          writtenby: 1,
          image: 1,
          likesCount: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
    ]);

    if (posts.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No posts found" });
    }

    return res.status(200).json({
      success: true,
      data: posts,
      message: "All posts fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

const getpostbyUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(404, "Invalid user ID");
  }

  const posts = await Post.aggregate([
    {
      $match: { owner: new mongoose.Types.ObjectId(id) },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "post",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        writtenby: 1,
        image: 1,
        likesCount: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (posts.length === 0) {
    throw new apiError(404, "No posts found for this user");
  }

  return res
    .status(200)
    .json(new apiResponse(200, posts, "Posts by user fetched successfully"));
});
const getpostbyPostId = asyncHandler(async (req, res) => {
  const { id } = req.params; // Use `id` to match the route definition

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(404, "Invalid post ID");
  }

  const post = await Post.aggregate([
    { $match: { _id: new mongoose.Types.ObjectId(id) } },
    {
      $lookup: {
        from: "likes", // Collection name
        localField: "_id",
        foreignField: "post",
        as: "likes",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" }, // Count the number of likes
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    { $unwind: "$ownerDetails" },
    {
      $project: {
        title: 1,
        description: 1,
        writtenby: 1,
        image: 1,
        owner: {
          _id: "$ownerDetails._id",
          username: "$ownerDetails.username",
          fullname: "$ownerDetails.fullname",
          email: "$ownerDetails.email",
          avatar: "$ownerDetails.avatar",
        },
        likesCount: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!post || post.length === 0) {
    throw new apiError(404, "Post not found");
  }

  return res
    .status(200)
    .json(new apiResponse(200, post[0], "Post fetched successfully"));
});

const updatePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if postId is a valid ObjectId
  if (!isValidObjectId(id)) {
    throw new apiError(400, "Invalid post ID");
  }

  // Find the post by ID
  const post = await Post.findById(new mongoose.Types.ObjectId(id));
  if (!post) {
    throw new apiError(404, "Post not found");
  }

  const { title, description, writtenby } = req.body;

  // Ensure at least one field is being updated
  if (
    ![title, description, writtenby].some((field) => field && field.trim()) ===
    ""
  ) {
    throw new apiError(400, "No fields provided to update");
  }

  // Check if the user is the owner of the post
  if (post.owner?.toString() !== req.user?._id.toString()) {
    throw new apiError(409, "You are not the owner of the post");
  }

  let imageUrl = post.image; // Use the existing image URL as default

  // If there's a new image file, upload it to Cloudinary
  if (req.files?.image?.[0]?.path) {
    const imagelocalpath = req.files.image[0].path;
    const uploadedImage = await uploadOnCloudinary(imagelocalpath);
    if (!uploadedImage) {
      throw new apiError(500, "Image upload failed");
    }
    imageUrl = uploadedImage.url;
  }

  // Update the post with the new data
  const updatedPost = await Post.findByIdAndUpdate(
    id,
    {
      $set: {
        title: title?.trim() || post.title,
        description: description?.trim() || post.description,
        writtenby: writtenby?.trim() || post.writtenby,
        image: imageUrl,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new apiResponse(200, updatedPost, "Post updated successfully"));
});

const deletePost = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate the post ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new apiError(404, "Post ID is invalid");
  }

  // Find the post by ID
  const post = await Post.findById(id);

  if (!post) {
    throw new apiError(404, "Post not found");
  }

  // Check if the authenticated user is the owner of the post
  if (post.owner.toString() !== req.user._id.toString()) {
    throw new apiError(403, "You are not the owner of this post");
  }

  // Delete the post
  await post.deleteOne();

  await Like.deleteMany({ post: id });

  // Return a success response
  return res
    .status(200)
    .json(new apiResponse(200, null, "Post deleted successfully"));
});

export {
  createPost,
  updatePost,
  deletePost,
  readPost,
  getpostbyUser,
  getpostbyPostId,
};
