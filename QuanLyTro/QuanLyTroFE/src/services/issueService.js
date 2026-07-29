import api from "./api"

export const getIssues = (page=1)=>{
    return api.get(`/issues?page=${page}`);
}
export const  getIssue = (id)=>{
    return api.get(`/issues/${id}`);
}
export const createIssue = (data)=>{
    return api.post("/issues",data);
}
export const updateIssue = (id,data)=>{
    return api.put(`/issues/${id}`,data);
}
export const deleteIssue = (id)=>{
    return api.delete(`/issues/${id}`);
}