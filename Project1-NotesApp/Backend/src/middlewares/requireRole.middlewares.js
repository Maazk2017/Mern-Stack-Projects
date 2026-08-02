import { Note } from "../models/note.models.js";
import { getUserRole, hasMinimumRole } from "../utils/permission.utils.js";

export function requireRole (minRole) {
    return async (req, res, next) => {
        try {
            const note = await Note.findById(req.params.id);

            if (!note) {
                return res.status(404).json({
                    message: "Note not found"
                });
            }

            const role = getUserRole(note, req.user.id);

            if (!hasMinimumRole(role, minRole)) {
                return res.status(403).json({
                    message: "Forbidden"
                });
            }

            req.note = note;
            req.userRole = role;
            next();

        } catch (error) {
            return res.status(500).json({
                message: "Something went wrong",
                error: error.message
            });
        }
    } 
}