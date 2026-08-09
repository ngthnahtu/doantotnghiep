import api from "./api"

export const getServices = (page=1, search="", filter="")=>{
    return api.get("/services",{
        params:{
            page,search, filter
        }
    });
}
export const  getService = (id)=>{
    return api.get(`/services/${id}`);
}
export const createService = (data)=>{
    return api.post("/services",data);
}
export const updateService = (id,data)=>{
    return api.put(`/services/${id}`,data);
}
export const deleteService = (id)=>{
    return api.delete(`/services/${id}`);
}
export const serviceOptions = ()=>{
    return api.get("/services/options")
}