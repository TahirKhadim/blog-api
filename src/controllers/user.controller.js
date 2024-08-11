import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudnary.js";

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accesstoken = user.generateaccesstoken();

    const refreshtoken = user.generaterefreshtoken();

    user.refreshtoken = refreshtoken;
    await user.save({ validateBeforeSave: false });

    return { accesstoken, refreshtoken };
  } catch (error) {
    throw new apiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

// steps for register user
// get data from req.body
// check for empty for data *
// check username or email already exist or not*
// handling image and files

// save data in db

const Register = asyncHandler(async (req, res) => {
  const { username, email, fullname, password } = req.body;

  console.log(req.body);

  if (
    [username, email, fullname, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "all fields required");
  }

  const existuser = await User.findOne({
    $or: [{ email }, { username }],
  });
  console.log(existuser);

  if (existuser) {
    throw new apiError(409, "eail or username already exists");
  }

  const avatarlocalpath = req.files?.avatar[0].path;
  const coverimagelocalpath = req.files?.coverimage[0].path;

  console.log(req.files);

  if (!avatarlocalpath) {
    throw new apiError(400, "avatar required");
  }

  const avatar = await uploadOnCloudinary(avatarlocalpath);
  const coverimage = await uploadOnCloudinary(coverimagelocalpath);

  if (!avatar) {
    throw new apiError(400, "avatar required");
  }

  const saveuser = await User.create({
    fullname,
    username: username.toLowerCase(),
    password,
    email,
    avatar: avatar.url,
    coverimage: coverimage?.url || "",
  });

  const createduser = await User.findById(saveuser?._id).select(
    "-password -refreshtoken"
  );

  if (!createduser) {
    throw new apiError(400, "not created ");
  }

  return res
    .status(200)
    .json(new apiResponse(200, createduser, "user register successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new apiError(400, "Username and password are required");
    }

    const user = await User.findOne({ username });
    if (!user) {
      throw new apiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new apiError(400, "Invalid password");
    }

    const accesstoken = user.generateaccesstoken();
    const refreshtoken = user.generaterefreshtoken();

    user.refreshtoken = refreshtoken;
    await user.save({ validateBeforeSave: false });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
    };

    return res
      .status(200)
      .cookie("accesstoken", accesstoken, cookieOptions)
      .json({
        success: true,
        message: "Login successful",
        accesstoken,
        refreshtoken,
      });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const logoutuser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user_id,
    {
      $unset: {
        refreshtoken: undefined,
      },
    },
    { new: true }
  );

  const option = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("refreshtoken", option)
    .json(new apiResponse(200, {}, "logout"));
});

const getCurrentUser=asyncHandler(async(req,res)=>{
  return res.status(200).json(new apiResponse(200,req.user._id,"get user successfully"))
})

const changePassword=asyncHandler(async(req,res)=>{
const {oldpassword, newPassword}=req.body
// get user

const user=await User.findById(req.user?._id);
const isPasswordCorrect=await user.isPasswordCorrect(oldpassword)
if(!isPasswordCorrect){
  throw new apiError(404,"invalid old password")
}
user.password=newPassword;
await user.save({validateBeforeSave:false})
return res.status(200).json(new apiResponse(200,{},"paasword updated successfully"))
})

const updateUserInfo=asyncHandler(async(req,res)=>{
  const{username, email, fullname}=req.body

  if([username,email,fullname].some((field)=>field.trim==='')){
    throw new apiError(400, "all fields required")
  }
  const updated=await Post.findByIdAndUpdate(req.user._id,{
    username,
    fullname,
    email
  },{new:true}.select("-password"))
})

const changeAvatar=asyncHandler(async(req,res)=>{
  const avatarlocalpath=req.file.avatar[0].path
  if(!avatarlocalpath){
    throw new apiError(404,"image not found")
  }
  const avatar=await uploadOnCloudinary(avatarlocalpath)
  if(!avatar){
    throw new apiError(400, "not uploaded on cloudnary")
  }
  const user=await User.findByIdAndUpdate(req,user._id,{
    $set:{
      avatar:avatar.url
    }
  },{new:true}.select("-password"))
  return res.status(200).json(new apiResponse(200,user,"avatar updated successfully!!"))
})
const changecoverimager=asyncHandler(async(req,res)=>{
  const cimagelocalpath=req.file.coverimage[0].path
  if(!cimagelocalpath){
    throw new apiError(404,"image not found")
  }
  const coverimage=await uploadOnCloudinary(cimagelocalpath)
  if(!coverimage){
    throw new apiError(400, "not uploaded on cloudnary")
  }
  const user=await User.findByIdAndUpdate(req,user._id,{
    $set:{
      coverimage:coverimage.url
    }
  },{new:true}.select("-password"))
  return res.status(200).json(new apiResponse(200,user,"coverimage updated successfully!!"))
})

export { Register, loginUser, logoutuser,getCurrentUser };