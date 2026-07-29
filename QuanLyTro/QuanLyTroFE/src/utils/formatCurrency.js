export const formatCurrency = (value)=>{
    if(value === null || value=== undefined || value===""){
        return "0 đ";
    }
    return `${Number(value).toLocaleString("vi-VN")} đ`;
}