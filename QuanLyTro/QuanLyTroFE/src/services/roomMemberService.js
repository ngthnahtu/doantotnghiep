import api from "./api";

export const getRoomMembers = (contractId) => {
    return api.get(`/room-members?contract_id=${contractId}`);
};

export const getRoomMember = (id) => {
    return api.get(`/room-members/${id}`);
};

export const createRoomMember = (data) => {
    return api.post("/room-members", data);
};

export const updateRoomMember = (id, data) => {
    return api.put(`/room-members/${id}`, data);
};

export const deleteRoomMember = (id) => {
    return api.delete(`/room-members/${id}`);
};