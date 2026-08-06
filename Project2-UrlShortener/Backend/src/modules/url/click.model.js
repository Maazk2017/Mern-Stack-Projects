import mongoose from "mongoose";

const clickSchema = new mongoose.Schema({
    url: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Url",
        required: true,
        index: true
    },

    timestamp: {
        type: Date,
        default: Date.now()
    },

    referrer: {
        type: String,
        default: null
    },

    useragent: {
        type: String,
        default: null
    },

    ip: {
        type: String,
        default: null
    }
});

export const Click = mongoose.model("Click", clickSchema);