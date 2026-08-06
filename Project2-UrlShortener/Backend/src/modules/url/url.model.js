import mongoose from "mongoose";

const urlSchema = new mongoose.Schema({

    originalurl: {
        type: String,
        required: true,
    },

    shortcode: {
        type: String,
        required: true,
        index: true,
        unique: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    clicks: {
        type: Number,
        required: true,
        default: 0
    },

    expireat: {
        type: Date,
        default: null
    }

}, {timestamps: true});

export const Url = mongoose.model("Url", urlSchema);
