import mongoose from "mongoose";
import { Schema } from "mongoose";

const userSchema=new Schema(
    {
      username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
      },
      fullname: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },
      avatar: {
        type: String,
        required: true,
      },
      coverimage: {
        type: String,
        required: true,
      },
      watchhistory: [
        {
          type: Schema.Types.ObjectId,
          ref: "Video",
        },
      ],
      password: {
        type: String,
        required: [true, "password is required"],
      },
      refreshtoken: {
        type: String,
      },
    },
    { timestamps: true }
  );