import api from "./api";

export const getTenants = (page = 1,search="", filter="") => {
    return api.get("/tenants",{
        params:{
            page, search, filter
        }
    });
};

export const getTenant = (id) => {
    return api.get(`/tenants/${id}`);
};

export const createTenant = (data) => {
    return api.post("/tenants", data);
};

export const updateTenant = (id, data) => {
    return api.put(`/tenants/${id}`, data);
};

export const deleteTenant = (id) => {
    return api.delete(`/tenants/${id}`);
};
export const tenantOptions = ()=>{
    return api.get("/tenants/options")
}