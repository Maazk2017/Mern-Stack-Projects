import api from "./axiosInstance";

export const createNote = async (formData) => {
    const response = await api.post("/note/createNote", formData, {
        headers: {"Content-Type": "multipart/form-data"}
    });
    return response.data;
};

export const getAllNotes = async () => {
    const response = await api.get("/note/getNotes");
    return response.data;
};

export const getNote = async (noteId) => {
    const response = await api.get(`/note/getNote/${noteId}`);
    return response.data;
};

export const updateNote = async (noteId, updatedData) => {
    const response = await api.patch(`/note/updateNote/${noteId}`, updatedData);
    return response.data;
};

export const deleteNote = async (noteId) => {
    const response = await api.delete(`/note/deleteNote/${noteId}`);
    return response.data;
};

