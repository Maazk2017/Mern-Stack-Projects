import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchNotes, clearActiveNote } from "./notesSlice";

import NotesList from "./NotesList";
import NoteEditor from "./NoteEditor";
import ShareModal from "./ShareModal";

export default function NotesDashboard () {
    const dispatch = useDispatch();
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    useEffect(() => {
        dispatch(fetchNotes());
    }, [dispatch]);

    const handleNewNoteClick = () => {
        dispatch(clearActiveNote());
    };

    return (
        <div className="container my-4">

            <div className="row g-4">

                <div className="col-md-4">
                    <NotesList onNewNoteClick={handleNewNoteClick}/>
                </div>

                <div className="col-md-8">
                    <NoteEditor onOpenShareModal={() => setIsShareModalOpen(prev => !prev)}/>
                </div>

            </div>

            <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(prev => !prev)}/>

        </div>
    )
}