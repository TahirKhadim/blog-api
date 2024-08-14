import mongoose from 'mongoose'
import { Schema } from 'mongoose'

const likeSchema=new Schema({
    likeBy:{
        type:Schema.Types.ObjectId,
        ref:"User"
    },
    post:{
        type:Schema.Types.ObjectId,
        ref:"Post"
    }
})

export const Like=mongoose.model("Like",likeSchema);