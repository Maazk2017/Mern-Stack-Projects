import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createNewNote, updateExistingNote } from "./notesSlice";

export default function NoteEditor({ onOpenShareModal }) {
  const dispatch = useDispatch();
  const { activeNote, userRole } = useSelector((state) => state.notes);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const isNewNote = !activeNote?._id;
  const canEdit = isNewNote || userRole === "editor" || userRole === "owner";
  const isOwner = userRole === "owner";

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title || "");
      setContent(activeNote.content || "");
      setFile(null);
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
          updatedData: { title, content },
        })
      );
    } else {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);

      if (file) {
        formData.append("coverImage", file);
      }

      await dispatch(createNewNote(formData));
    }

    setIsSaving(false);
  };

  return (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-light d-flex justify-content-between align-items-center py-3">
        <h5 className="mb-0 fw-bold">
          {activeNote?._id ? "Edit Note" : "New Note"}
        </h5>
        {activeNote?._id && isOwner && (
          <button onClick={onOpenShareModal} className="btn btn-outline-info btn-sm">
            👥 Share Note
          </button>
        )}
      </div>

      <div className="card-body p-4">

        {activeNote?._id && activeNote?.coverImage && (
          <div className="mb-3">
            <label className="form-label fw-semibold">Cover Image</label>
            <div className="text-center">
              <img
                src={activeNote.coverImage}
                alt={activeNote.title}
                className="img-fluid rounded border shadow-sm"
                style={{ maxHeight: "250px", objectFit: "cover", width: "100%" }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSave}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Title</label>
            <input
              required
              type="text"
              className="form-control"
              placeholder="Note Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              readOnly={!canEdit}
            />
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Content</label>
            <textarea
              required
              className="form-control"
              rows="8"
              placeholder="Write your note content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              readOnly={!canEdit}
            ></textarea>
          </div>

          {!activeNote?._id && (
            <div className="mb-4">
              <label className="form-label fw-semibold">Attachment / Cover Image</label>
              <input
                key={activeNote?._id || "new-note"}
                type="file"
                accept="image/*"
                className="form-control"
                onChange={(e) => setFile(e.target.files[0])}
              />
            </div>
          )}

          {canEdit && (
            <div className="d-flex justify-content-end gap-2">
              <button
                type="submit"
                className="btn btn-primary px-4 fw-semibold"
                disabled={isSaving}
              >
                {isSaving
                  ? "Saving..."
                  : activeNote?._id
                  ? "Update Note"
                  : "Create Note"}
              </button>
            </div>
          )}

          {!canEdit && (
            <p className="text-muted small mb-0">
              You have view-only access to this note.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}