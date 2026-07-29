import { Outlet } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

export default function AdminLayout(){
    return(
        <div className="flex min-h-screen">
            <Sidebar />
            <div className="flex flex-1 flex-col bg-slate-100 dark:bg-slate-950">
                <Navbar/>
                <main className="flex flex-1 flex-col bg-slate-100 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                    <Outlet/>
                </main>
            </div>
        </div>
    );  
}