import { Note } from "../models/note.models.js";
import { User } from "../models/user.models.js";
import uploadFile from "../services/storage.services.js";

export async function createNote(req, res) {
    try {

        const { title, content } = req.body;
        const file = req.file;

        if (!title) {
            return res.status(400).json({
                message: "Title is required"
            });
        }

        let coverImage;

        if (file) {
            const result = await uploadFile(file.buffer.toString('base64'));
            coverImage = result.url;
        }

        const note = await Note.create({
            title,
            content,
            coverImage,
            owner: req.user.id,
        });

        return res.status(201).json({
            message: "Note created successfully",
            note
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}

export async function getNote(req, res) {

    try {

        return res.status(200).json({
            message: "Note fetched successfully",
            note: req.note
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }


}

export async function getAllNotes (req, res) {
    try {
        const notes = await Note.find({
            $or: [
                { owner : req.user.id },
                { "collaborators.user" : req.user.id }
            ]
        });

        return res.status(200).json({
            message: "Notes fetched successfully",
            notes
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }

}

export async function updateNote (req, res) {
    try {

        const { title, content } = req.body;
        const file = req.file;

        if (!title) {
            return res.status(400).json({
                message: "Title is required"
            });
        }

        let coverImage;

        if (coverImage) {
            const result = await uploadFile(file.buffer.toString('base64'));
            coverImage = result.url;
        }

        if (title !== undefined) req.note.title = title;
        if (content !== undefined) req.note.content = content
        if (coverImage) req.note.coverImage = coverImage;

        await req.note.save();

        return res.status(201).json({
            message: "Note updated successfully",
            note: req.note
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
} 

export async function deleteNote (req, res) {
    try {

        await Note.deleteOne(req.note._id);

        return res.status(200).json({
            message: "Note deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}

export async function getCollaborators (req, res) {
    try {
        await req.note.populate("collaborators.user", "username email");

        return res.status(200).json({
            message: "Collaborators fetched successfully",
            collaborators: req.note.collaborators
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }


}