import mongoose from "mongoose";

const likesSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
        required: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }

}, {timestamps: true});

// one like per user per post — enforced at the DB level, not in application code
likesSchema.index({ post: 1, user: 1 }, { unique: true });

export const Likes = mongoose.model("Likes", likesSchema);