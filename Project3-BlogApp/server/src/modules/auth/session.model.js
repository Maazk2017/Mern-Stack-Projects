import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    hashedRefreshToken: {
        type: String,
        required: true
    },

    ip: {
        type: String,
        required: true
    },

    userAgent: {
        type: String,
        default: "Unknown device"
    },

    revoked: {
        type: Boolean,
        default: false
    },

    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }
    }

}, {timestamps: true});

export const Session = mongoose.model("Session", sessionSchema);