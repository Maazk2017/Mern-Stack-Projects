import mongoose from "mongoose";

const likesSchema = new mongoose.Schema({

    targetType: {
        type: String,
        enum: ["Post", "Comments"],
        required: true
    },

    target: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: "targetType"
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    

}, {timestamps: true});

// one like per user per post — enforced at the DB level, not in application code
likesSchema.index({ targetType: 1, target:1, user: 1 }, { unique: true });

export const Likes = mongoose.model("Likes", likesSchema);