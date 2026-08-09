import api from "./api"

export const getInvoices = (page=1, search="", filter="")=>{
    return api.get("/invoices",{
        params:{
            page, search, filter
        }
    });
}
export const getInvoice = (id)=>{
    return api.get(`/invoices/${id}`);
}
export const createInvoice = (data)=>{
    return api.post("/invoices",data);
}
export const updateInvoice = (id, data)=>{
    return api.put(`/invoices/${id}`,data);
}
export const deleteInvoice = (id) =>{
    return api.delete(`/invoices/${id}`);
}
export const prepareInvoice = (billMonth)=>{
    return api.get(`/invoices/prepare?bill_month=${billMonth}`);
}