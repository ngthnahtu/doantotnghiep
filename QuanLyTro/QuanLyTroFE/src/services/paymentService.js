import api from "./api"

export const getPayments = (page=1)=>{
    return api.get(`/payments?page=${page}`);
}
export const  getPayment = (id)=>{
    return api.get(`/payments/${id}`);
}
export const createPayment = (data)=>{
    return api.post("/payments",data);
}
export const updatePayment = (id,data)=>{
    return api.put(`/payments/${id}`,data);
}
export const deletePayment = (id)=>{
    return api.delete(`/payments/${id}`);
}