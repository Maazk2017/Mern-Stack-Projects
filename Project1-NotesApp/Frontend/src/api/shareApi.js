import api from "./axiosInstance";

export const getCollaborators = async (noteId) => {
    const response = await api.get(`/note/${noteId}/collaborators`);
    return response.data;
};

export const addCollaborator = async (noteId, collaboratorData) => {
    const response = await api.post(`/note/${noteId}/share`, collaboratorData);
    return response.data;
};

export const updateRole = async (noteId, collaboratorId, role) => {
    const response = await api.patch(`/note/${noteId}/share/${collaboratorId}`, { role });
    return response.data;
};

export const removeCollaborator = async (noteId, collaboratorId) => {
    const response = await api.delete(`/note/${noteId}/share/${collaboratorId}`);
    return response.data;
};