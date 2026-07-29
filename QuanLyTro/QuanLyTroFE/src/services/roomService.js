import api from "./api"

export const getRooms = (page= 1)=>{
    return api.get(`/rooms?page=${page}`);
}
export const getRoom = (id) => {
    return api.get(`/rooms/${id}`);

}
export const createRoom = (data) => {
    return api.post("/rooms",data);
}
export const updateRoom= (id,data) => {
    data.append("_method","PUT");
    return api.post(`/rooms/${id}`,data);
}
export const deleteRoom = (id)=>{
    return api.delete(`/rooms/${id}`);
}
export const roomOptions = ()=>{
    return api.get("/rooms/options")
}