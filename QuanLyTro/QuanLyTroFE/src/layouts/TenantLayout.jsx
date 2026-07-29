  import { Outlet } from "react-router-dom";
  import TenantSidebar from "../components/layout/TenantSidebar";
  import Navbar from "../components/layout/Navbar";

  export default function TenantLayout() {
    return (
      <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
        <TenantSidebar />

        <div className="flex flex-1 flex-col">
          <Navbar />

          <main className="flex flex-1 flex-col bg-slate-100 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <Outlet />
          </main>
        </div>
      </div>
    );
  } 