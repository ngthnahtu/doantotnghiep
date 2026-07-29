import { Navigate, Outlet } from "react-router-dom";

export default function Role({allowRole}){
    const token=localStorage.getItem("token");
    const user=JSON.parse(localStorage.getItem("user"));
    
    if(!token || !user){
        return <Navigate to="/" replace />;
    }

    if(allowRole !== undefined && user.role !== allowRole){
        return user.role === 0 ? <Navigate to="/admin/dashboard" replace /> : <Navigate to="/tenant/contract" replace/>
    }
    return <Outlet/>
}