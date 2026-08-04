import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createNote, getAllNotes, getNote, updateNote, deleteNote } from "../../api/noteApi";
import { getCollaborators, addCollaborator, updateRole, removeCollaborator } from "../../api/shareApi";
import { logout } from "../auth/authSlice"; // adjust path to match your actual folder structure

// --- Async Thunks: Notes ---

export const createNewNote = createAsyncThunk(
    "notes/createNewNote",
    async (formData, { rejectWithValue }) => {
        try {
            const data = await createNote(formData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to create note");
        }
    }
);

export const fetchOneNote = createAsyncThunk(
    "notes/fetchOneNote",
    async (noteId, { rejectWithValue }) => {
        try {
            const data = await getNote(noteId);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to load note");
        }
    }
);

export const fetchNotes = createAsyncThunk(
    "notes/fetchNotes",
    async (_, { rejectWithValue }) => {
        try {
            const data = await getAllNotes();
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch notes");
        }
    }
);

export const updateExistingNote = createAsyncThunk(
    "notes/updateExistingNote",
    async ({ noteId, updatedData }, { rejectWithValue }) => {
        try {
            const data = await updateNote(noteId, updatedData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update note");
        }
    }
);

export const removeNote = createAsyncThunk(
    "notes/removeNote",
    async (noteId, { rejectWithValue }) => {
        try {
            await deleteNote(noteId);
            return noteId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to delete note");
        }
    }
);

// --- Async Thunks: Collaborators ---

export const fetchCollaborators = createAsyncThunk(
    "notes/fetchCollaborators",
    async (noteId, { rejectWithValue }) => {
        try {
            const data = await getCollaborators(noteId);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch collaborators");
        }
    }
);

export const shareNote = createAsyncThunk(
    "notes/shareNote",
    async ({ noteId, collaboratorData }, { rejectWithValue }) => {
        try {
            const data = await addCollaborator(noteId, collaboratorData);
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to add collaborators");
        }
    }
);

export const changeCollaboratorRole = createAsyncThunk(
    "notes/changeCollaboratorRole",
    async ({ noteId, collaboratorId, role }, { rejectWithValue }) => {
        try {
            await updateRole(noteId, collaboratorId, role);
            return { collaboratorId, role };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to update role");
        }
    }
);

export const deleteCollaborator = createAsyncThunk(
    "notes/deleteCollaborator",
    async ({ noteId, collaboratorId }, { rejectWithValue }) => {
        try {
            await removeCollaborator(noteId, collaboratorId);
            return collaboratorId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to remove collaborator");
        }
    }
);

// --- Slice Definition ---
const initialState = {
    notes: [],
    activeNote: null,
    collaborators: [],
    userRole: null,
    status: "idle",
    error: null
};

const notesSlice = createSlice({
    name: "notes",
    initialState,

    reducers: {
        setActiveNote: (state, action) => {
            state.activeNote = action.payload;
        },
        clearActiveNote: (state) => {
            state.activeNote = null;
            state.collaborators = [];
            state.userRole = null;
        },
        clearNotesError: (state) => {
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(fetchNotes.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(fetchNotes.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.notes = action.payload.notes || action.payload;
            })
            .addCase(fetchNotes.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })

            .addCase(fetchOneNote.fulfilled, (state, action) => {
                state.activeNote = action.payload.note || action.payload;
                state.userRole = action.payload.userRole || null;
            })

            .addCase(createNewNote.fulfilled, (state, action) => {
                const newNote = action.payload.note || action.payload;
                state.notes.unshift(newNote);
                state.activeNote = newNote;
                state.userRole = "owner";
            })

            .addCase(updateExistingNote.fulfilled, (state, action) => {
                const updated = action.payload.note || action.payload;
                state.notes = state.notes.map(n =>
                    n._id === updated._id ? updated : n
                );
                if (state.activeNote?._id === updated._id) {
                    state.activeNote = updated;
                }
            })

            .addCase(removeNote.fulfilled, (state, action) => {
                state.notes = state.notes.filter(n => n._id !== action.payload);
                if (state.activeNote?._id === action.payload) {
                    state.activeNote = null;
                    state.userRole = null;
                }
            })

            .addCase(fetchCollaborators.fulfilled, (state, action) => {
                state.collaborators = action.payload.collaborators || action.payload;
            })

            .addCase(shareNote.fulfilled, (state, action) => {
                const updatedNote = action.payload.note;
                if (updatedNote?.collaborators) {
                    state.collaborators = updatedNote.collaborators;
                }
            })

            .addCase(changeCollaboratorRole.fulfilled, (state, action) => {
                state.collaborators = state.collaborators.map(c => {
                    const cUserId = c.user?._id || c.user;
                    return cUserId === action.payload.collaboratorId
                        ? { ...c, role: action.payload.role }
                        : c;
                });
            })

            .addCase(deleteCollaborator.fulfilled, (state, action) => {
                state.collaborators = state.collaborators.filter(c => {
                    const cUserId = c.user?._id || c.user;
                    return cUserId !== action.payload;
                });
            })

            // reset everything on logout — prevents stale userRole/activeNote
            // from a previous session bleeding into the next login
            .addCase(logout.fulfilled, () => initialState);
    }
});

export const { setActiveNote, clearActiveNote, clearNotesError } = notesSlice.actions;
export default notesSlice.reducer;