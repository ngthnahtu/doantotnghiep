import api from "./api"

export const getContracts = (page=1, search = "", filter="")=>{
    return api.get("/contracts",{
        params:{
            page,search, filter
        }
    });
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