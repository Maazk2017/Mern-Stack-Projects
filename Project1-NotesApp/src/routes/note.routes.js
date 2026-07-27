import express from "express";
import multer from "multer";

import { createNote, getNote, getAllNotes, updateNote, deleteNote, getCollaborators } from "../controllers/note.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
import { requireRole } from "../middlewares/requireRole.middlewares.js";

const upload = multer({
    storage: multer.memoryStorage()
});

const router = express.Router();

router.post("/createNote", verifyJWT, upload.single('coverImage'), createNote );
router.get("/getNote/:id", verifyJWT, requireRole("viewer"), getNote);
router.get("/getNotes", verifyJWT, getAllNotes);
router.patch("/updateNote/:id", verifyJWT, requireRole("editor"), upload.single('coverImage'), updateNote);
router.delete("/deleteNote/:id", verifyJWT, requireRole("owner"), deleteNote);

router.get("/:id/collaborators", verifyJWT, requireRole("viewer"), getCollaborators);

export default router;