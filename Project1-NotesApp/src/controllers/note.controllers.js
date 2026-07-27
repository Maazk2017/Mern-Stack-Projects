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