// src/utils/permission.utils.js

const roleRank = { viewer: 1, editor: 2, owner: 3 };

const extractId = (entity) => {
    if (!entity) return null;
    if (typeof entity === "string") return entity;
    return entity._id || entity.id || entity.user?._id || entity.user?.id || entity.user || null;
};

export function getUserRole(note, userId) {
    if (!note || !userId) return null;

    const currentUserIdStr = extractId(userId)?.toString();
    const ownerIdStr = extractId(note.owner)?.toString();

    // Check Owner
    if (ownerIdStr && currentUserIdStr && ownerIdStr === currentUserIdStr) {
        return "owner";
    }

    // Check Collaborators
    const collaborators = note.collaborators || note.collaborator || [];
    const collaborator = collaborators.find((c) => {
        const collabUserIdStr = extractId(c.user || c)?.toString();
        return collabUserIdStr === currentUserIdStr;
    });

    return collaborator ? collaborator.role : null;
}

export function hasMinimumRole(role, minRole) {
    if (!role) return false;
    return roleRank[role] >= roleRank[minRole];
}