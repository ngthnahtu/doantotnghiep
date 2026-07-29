export const formatDate= (value)=>{
    if(!value){
        return "Chưa có";
    }
    const date= new Date(value);
    return date.toLocaleDateString("vi-VN");
}