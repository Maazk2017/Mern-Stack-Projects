import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true
    },
    
    content: {
        type: String,
        trim: true
    },

    images: {
        type: [String],
        default: []
    },

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    isDeleted: {
        type: Boolean,
        default: false
    }

}, {timestamps: true});

export const Post = mongoose.model("Post", postSchema);