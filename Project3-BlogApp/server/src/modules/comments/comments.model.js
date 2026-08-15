import mongoose from "mongoose";

const commentsSchema = new mongoose.Schema({

    text: {
        type: String,
        required: true
    },

    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comments",
        default: null
    },


    isDeleted: {
        type: Boolean,
        default: false
    }

}, {timestamps: true});

commentsSchema.index({ post: 1, parentComment: 1 });

export const Comments = mongoose.model("Comments", commentsSchema);