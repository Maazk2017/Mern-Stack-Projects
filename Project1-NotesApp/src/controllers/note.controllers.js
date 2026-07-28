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

export async function getAllNotes(req, res) {
    try {
        const notes = await Note.find({
            $or: [
                { owner: req.user.id },
                { "collaborators.user": req.user.id }
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

export async function updateNote(req, res) {
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

export async function deleteNote(req, res) {
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

export async function getCollaborators(req, res) {
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

export async function shareNote(req, res) {
    try {
        const { email, role } = req.body;

        if (!email || !role) {
            return res.status(400).json({
                message: "Email and role are required"
            });
        }

        if (!["viewer", "editor"].includes(role)) {
            return res.status(400).json({
                message: "Role must be a viewer or editor"
            });
        }

        const userExists = await User.findOne({ email });

        if (!userExists) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        if (req.note.owner.equals(userExists._id)) {
            return res.status(400).json({
                message: "Cannot share with the owner himself"
            });
        }

        const alreadyCollaborator = req.note.collaborators.find(c =>
            c.user.equals(userExists._id)
        );

        if (alreadyCollaborator) {
            return res.status(400).json({
                message: "User is already a collaborator"
            });
        }


        req.note.collaborators.push({
            user: userExists._id,
            role
        });

        await req.note.save();

        return res.status(200).json({
            message: "User added to collaborators successfully",
            note: req.note
        })

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}

export async function updateRole(req, res) {
    try {
        const { role } = req.body;
        const userId = req.params.userId;


        if (!role || !userId) {
            return res.status(400).json({
                message: "No role or no userId provided"
            });
        }

        if (!["viewer", "editor"].includes(role)) {
            return res.status(400).json({
                message: "Role must be viewer or editor"
            });
        }

        if (req.note.owner.equals(userId)) {
            return res.status(400).json({
                message: "Cannot update role of the owner"
            });
        }

        const existsCollaborator = req.note.collaborators.find(c => (
            c.user.equals(userId)
        ));

        if (!existsCollaborator) {
            return res.status(404).json({
                message: "UserID not in collaborators"
            });
        }

        if (existsCollaborator.role === role) {
            return res.status(400).json({
                message: `User is already a ${role}`
            });
        }

        existsCollaborator.role = role;

        await req.note.save();

        return res.status(200).json({
            message: "Role updated successfully",
            note: req.note
        });


    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}

export async function removeCollaborator(req, res) {
    try {

        const userId = req.params.userId;

        if (req.note.owner.equals(userId)) {
            return res.status(400).json({
                message: "Cannot delete the owner"
            });
        }

        const existsCollaborator = req.note.collaborators.find(c => (
            c.user.equals(userId)
        ));

        if (!existsCollaborator) {
            return res.status(404).json({
                message: "UserID not not in collaborators"
            });
        }

        req.note.collaborators = req.note.collaborators.filter(
            c => !c.user.equals(userId)
        );

        await req.note.save();

        return res.status(200).json({
            message: "Collaborator removed successfully",
            note: req.note
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}