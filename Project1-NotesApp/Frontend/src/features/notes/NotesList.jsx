import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeNote, fetchOneNote } from "./notesSlice";

export default function NotesList ({ onNewNoteClick }) {
    const dispatch = useDispatch();
    const { notes, activeNote, status } = useSelector((state) => state.notes)

    return (
        <div className="card shadow-sm border-0 h-100">

            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center py-3">
                <h5 className="mb-0 fw-bold">My Notes</h5>
                <button className="btn btn-login btn-sm fw-semibold" onClick={onNewNoteClick}>
                    + New Note
                </button>
            </div>

            <div className="card-body p-2 overflow-auto " style={{ maxHeight: "70vh" }}>
                {status === "loading" && notes.length === 0 ? (
                    <div className="text-center py-4">
                        <div className="spinner-border text-primary" role="status"></div>
                    </div>
                ) : notes.length === 0 ? (
                    <p className="text-center text-muted my-4">No notes found. Create One!</p>
                ) : (
                    <div className="list-group list-group-flush">
                        {notes.map(note => {
                            const isActive = activeNote?._id == note._id;
                            return (
                                <div key={note._id} className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start border-0 rounded my-1 p-3 cursor-pointer ${
                                isActive ? "active" : ""}`} onClick={() => dispatch(fetchOneNote(note._id))} style={{ cursor : "pointer"}}>
                                    
                                    <div className="me-auto text-truncate">
                                        <div className="fw-bold text-truncate">
                                            {note.title || "Untitled Note"}
                                        </div>
                                        <small
                                        className={`text-truncate d-block ${
                                            isActive ? "text-light" : "text-muted"
                                        }`}
                                        >
                                            {note.content || "No content"}
                                        </small>
                                    </div>

                                    <button title="Delete Note" onClick={(e) => {
                                        e.stopPropagation();
                                        dispatch(removeNote(note._id))
                                    }} className={`btn btn-sm ${isActive ? "btn-outline-light" : "btn-outline-danger"} ms=2`}>
                                        🗑️
                                    </button>

                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

        </div>
    )
}