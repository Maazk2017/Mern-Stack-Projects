import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createNewNote, updateExistingNote } from "./notesSlice";

export default function NoteEditor ({ onOpenShareModal }) {
    const dispatch = useDispatch();
    const { activeNote } = useSelector((state) => state.notes);

    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [file, setFile] = useState(null);
    const [isSaving, setIsSaving] = useState(false);


    useEffect(() => {
        if (activeNote) {
            setTitle(activeNote.title || "");
            setContent(activeNote.content || "");
            setFile(activeNote.file);
        } else {
            setTitle("");
            setContent("");
            setFile(null);
        }
    }, [activeNote]);

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        if (activeNote?._id) {
            await dispatch(
                updateExistingNote({
                    noteId: activeNote._id,
                    updatedData: {title, content}
                })
            )
        } else {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("content", content);
            if (file) formData.append("file", file);
            
            await dispatch(createNewNote(formData));
            
        }

        setIsSaving(false);
        
    }

    return (
        <div className="card shadow-sm border-0 h-100">

            <div className="card-header bg-light d-flex justify-content-between align-items-center py-3">
                <h5 className="mb-0 fw-bold">
                    {activeNote?._id ? "Edit Note" : "New Note"}
                </h5>
                {activeNote?._id && (
                    <button onClick={onOpenShareModal} className="btn btn-outline-info btn-sm">
                        👥 Share Note
                    </button>
                )}
            </div>

            <div className="card-body p-4">

                <form onSubmit={handleSave}>

                    <div className="mb-3">
                        <label className="form-label fw-semibold">Title</label>
                            <input required type="text" className="form-control" placeholder="Note Title" value={title} onChange={(e) => setTitle(e.target.value) }/>
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-semibold">Content</label>
                        <textarea required className="form-control" rows="8" placeholder="Write your note content here..." value={content} onChange={(e) => setContent(e.target.value)}>
                        </textarea>
                    </div>

                    {!activeNote?._id && (
                        <div className="mb-4">
                            <label className="form-label fw-semibold">Attachment</label>
                            <input type="file" className="form-control" onChange={(e) => setFile(e.target.files[0])} />
                        </div>
                    )}

                    <div className="d-flex justify-content-end gap-2">
                        <button type="submit" className="btn btn-primary px-4 fw-semibold" disabled={isSaving}>
                            {isSaving ? "Saving..." : activeNote?._id ? "Update Note" : "Create Note"}
                        </button>
                    </div>

                </form>

            </div>

        </div>
    )
}