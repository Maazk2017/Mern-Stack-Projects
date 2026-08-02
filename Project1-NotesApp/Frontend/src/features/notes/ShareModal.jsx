import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCollaborators, shareNote, changeCollaboratorRole, deleteCollaborator } from "./notesSlice";

export default function ShareModal({ isOpen, onClose }) {
    const dispatch = useDispatch();
    const { activeNote, collaborators } = useSelector((state) => state.notes);

    const [email, setEmail] = useState("");
    const [role, setRole] = useState("viewer");

    useEffect(() => {
        if (activeNote?._id && isOpen) {
            dispatch(fetchCollaborators(activeNote._id));
        }
    }, [activeNote, isOpen, dispatch]);

    if (!isOpen || !activeNote) return null;

    const handleAddCollaborator = async (e) => {
        e.preventDefault();
        if (!email) return;

        await dispatch(
            shareNote({
                noteId: activeNote._id,
                collaborators: { email, role }
            })
        );
        setEmail("");
    };

    return (
        <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg">
                    <div className="modal-header bg-primary text-white">
                        <h5 className="modal-title fw-bold">
                            Share "{activeNote.title || "Note"}"
                        </h5>
                        <button
                            type="button"
                            className="btn-close btn-close-white"
                            onClick={onClose}
                        ></button>
                    </div>

                    <div className="modal-body p-4">
                        {/* Add Collaborator Form */}
                        <form onSubmit={handleAddCollaborator} className="mb-4">
                            <label className="form-label fw-semibold">Add Collaborator</label>
                            <div className="input-group">
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="User email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <select
                                    className="form-select"
                                    style={{ maxWidth: "120px" }}
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                >
                                    <option value="viewer">Viewer</option>
                                    <option value="editor">Editor</option>
                                </select>
                                <button className="btn btn-success" type="submit">
                                    Add
                                </button>
                            </div>
                        </form>

                        <hr />

                        {/* Existing Collaborators List */}
                        <h6 className="fw-bold mb-3">People with access</h6>
                        {collaborators.length === 0 ? (
                            <p className="text-muted small">No collaborators added yet.</p>
                        ) : (
                            <ul className="list-group list-group-flush">
                                {collaborators.map((collab) => (
                                    <li
                                        key={collab._id}
                                        className="list-group-item d-flex justify-content-between align-items-center px-0"
                                    >
                                        <div>
                                            <div className="fw-semibold small">
                                                {collab.email || collab.username || collab._id}
                                            </div>
                                        </div>

                                        <div className="d-flex align-items-center gap-2">
                                            <select
                                                className="form-select form-select-sm"
                                                value={collab.role}
                                                onChange={(e) =>
                                                    dispatch(
                                                        changeCollaboratorRole({
                                                            noteId: activeNote._id,
                                                            collaboratorId: collab._id,
                                                            role: e.target.value,
                                                        })
                                                    )
                                                }
                                            >
                                                <option value="viewer">Viewer</option>
                                                <option value="editor">Editor</option>
                                            </select>

                                            <button
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() =>
                                                    dispatch(
                                                        deleteCollaborator({
                                                            noteId: activeNote._id,
                                                            collaboratorId: collab._id,
                                                        })
                                                    )
                                                }
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={onClose}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}