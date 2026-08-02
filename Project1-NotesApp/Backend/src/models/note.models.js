import mongoose from "mongoose";

const notesSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    content: {
        type: String,
        default: "",
        trim: true
    },

    coverImage: {
        type: String
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    collaborators: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },

            role: {
                type: String,
                enum: ['viewer', 'editor'],
                default: 'viewer'
            },
        }
    ],

    
    isArchived: {
        type: Boolean,
        default: false
    }

}, {timestamps: true});

export const Note = mongoose.model("Notes", notesSchema);