const roleRank = { viewer: 1, editor: 2, owner: 3 };

export function getUserRole (note, userId) {
    if (note.owner.equals(userId)) {
        return "owner";
    }

    const collaborator = note.collaborators.find(c => c.user.equals(userId));

    if (collaborator) {
        return collaborator.role
    } else {
        return null;
    }

}

export function hasMinimumRole (role, minRole) {
    if (!role) return false;
    return roleRank[role] >= roleRank[minRole];
}

