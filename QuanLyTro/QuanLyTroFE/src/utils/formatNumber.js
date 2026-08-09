export const formatNumber = (value)=>{
    if(value===null || value === undefined || value===""){
        return "Chưa có";
    }
    return Number(value);
}