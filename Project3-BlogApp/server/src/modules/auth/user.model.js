import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
    },

    password: {
        type: String,
        required: true
    },

    isVerified: { 
        type: Boolean, 
        default: false 
    },

    otp: {
        code: {
            type: String
        },
        expiresAt: {
            type: Date
        }   
    },

    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    }

}, {timestamps: true});

export const User = mongoose.model("User", userSchema);