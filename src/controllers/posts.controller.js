import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";
import { Post } from "../models/post.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { isValidObjectId } from "mongoose";

const createPost = asyncHandler(async (req, res) => {
  // const user = await User.findById(req.user?._id);
  // console.log(user);

  const { title, description, writtenby } = req.body;
  console.log(title);
  if ([title, description, writtenby].some((field) => field.trim() === "")) {
    throw new apiError(400, "These are required fields");
  }

  const imagelocalpath = req.files.image[0].path;
  if (!imagelocalpath) {
    throw new apiError(400, "Image is required");
  }
  console.log(req.files);

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
        writtenby: 1,
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
});

const readPost=asyncHandler(async(req,res)=>{
  try {
    const post=await Post.find();
    if(post.length===0){
      throw new apiError(404, "no post found")
    }
    return res.status(200),json(new apiResponse(200,post,"all post fetched successfully"))
  } catch (error) {
    console.log(error)
  }
})

const getpostbyUser=asyncHandler(async(req,res)=>{
const {userId}=req.params
if(!isValidObjectId(userId)){
  throw new apiError(404,"Invalid user id")
}

const post=await Post.find({owner:userId})

if(post.length===0){
  throw new apiError(404," no post found againt user")
}

return res.status(200).json(new apiResponse(200,post,"post by user fetched"))
})

const updatePost = asyncHandler(async (req, res) => {
  const { postId } = req.params;

  // Check if postId is a valid ObjectId
  if (!isValidObjectId(postId)) {
    throw new apiError(400, "Invalid post ID");
  }

  // Find the post by ID
  const post = await Post.findById(postId);
  if (!post) {
    throw new apiError(404, "Post not found");
  }

  const { title, description, writtenby } = req.body;

  // Ensure at least one field is being updated
  if (![title, description, writtenby].some((field) => field && field.trim())==='') {
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
    postId,
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


const deletePost=asyncHandler(async(req,res)=>{
  const{postId}=req.params
  if(!isValidObjectId(postId)){
throw new apiError(404,"post id required")
  }
if(Post.owner?.toString()!==req.user?._id.toString()){
  throw new apiError(409," your are not the owner")
}
  await Post.findByIdAndDelete(postId)
})

export { createPost,updatePost,deletePost,readPost,getpostbyUser };
