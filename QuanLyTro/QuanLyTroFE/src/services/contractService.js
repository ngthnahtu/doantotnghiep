import api from "./api"

export const getContracts = (page=1)=>{
    return api.get(`/contracts?page=${page}`);
}
export const getContract = (id)=>{
    return api.get(`/contracts/${id}`);
}
export const createContract = (data)=>{
    return api.post("/contracts",data);
}
export const updateContract= (id,data)=>{
    return api.put(`/contracts/${id}`,data);
}
export const deleteContract = (id)=>{
    return api.delete(`/contracts/${id}`);
}
export const terminateContract= (id,data)=>{
    return api.put(`/contracts/${id}/terminate`,data)
}