import api from "./api"

export const getUsers = (page= 1)=>{
    return api.get(`/users?page=${page}`);
}
export const getUser = (id) => {
    return api.get(`/users/${id}`);

}
export const createUser = (data) => {
    return api.post("/users",data);
}
export const updateUser= (id,data) => {
    return api.put(`/users/${id}`,data);
}
export const deleteUser = (id)=>{
    return api.delete(`/users/${id}`);
}