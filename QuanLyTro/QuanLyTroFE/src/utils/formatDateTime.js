export const formatDateTime = (value)=>{
    if(!value) {
        return "Chưa có";
    }
    return new Date(value).toLocaleString("vi-VN");
}