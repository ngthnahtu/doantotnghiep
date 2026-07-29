import {
  LayoutDashboard,
  Bed,
  Wrench,
  UserRound,
  FileText,
  CircleDollarSign,
  ReceiptText,
  Bell,
  Settings,
  TriangleAlert,
} from "lucide-react";

import { NavLink } from "react-router-dom";
import { Logo } from "../common/Logo";

export default function Sidebar() {
  const navClass = ({ isActive }) =>
    `flex items-center gap-3 p-2 pl-4 font-semibold transition-all duration-200 ${
      isActive
        ? "border-l-4 border-blue-500 bg-blue-50/50 text-blue-500 dark:bg-blue-950/50"
        : "mx-2 rounded-r hover:bg-gray-100 hover:font-bold hover:text-blue-500 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  return (
    <aside className="flex min-h-screen w-64 flex-col justify-between border-r border-slate-200 bg-white py-6 text-slate-800 shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
      <Logo className="py-2" />

      <div className="my-auto flex flex-1 flex-col justify-center gap-2">
        <nav className="flex flex-col gap-2">
          <NavLink to="/admin/dashboard" className={navClass}>
            <LayoutDashboard size={22} />
            <span>Tổng quan</span>
          </NavLink>

          <NavLink to="/admin/room" className={navClass}>
            <Bed size={22} />
            <span>Phòng</span>
          </NavLink>

          <NavLink to="/admin/service" className={navClass}>
            <Wrench size={22} />
            <span>Dịch vụ</span>
          </NavLink>

          <NavLink to="/admin/tenant" className={navClass}>
            <UserRound size={22} />
            <span>Khách thuê</span>
          </NavLink>

          <NavLink to="/admin/contract" className={navClass}>
            <FileText size={22} />
            <span>Hợp đồng</span>
          </NavLink>

          <NavLink to="/admin/invoice" className={navClass}>
            <ReceiptText size={22} />
            <span>Hóa đơn</span>
          </NavLink>

          <NavLink to="/admin/payment" className={navClass}>
            <CircleDollarSign size={22} />
            <span>Thanh toán</span>
          </NavLink>

          <NavLink to="/admin/notification" className={navClass}>
            <Bell size={22} />
            <span>Thông báo</span>
          </NavLink>

          <NavLink to="/admin/issue" className={navClass}>
            <TriangleAlert size={22} />
            <span>Sự cố</span>
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center justify-center pt-4">
        <NavLink
          to="/admin/setting"
          className={({ isActive }) =>
            `flex items-center justify-center rounded-full p-2.5 transition-all duration-200 ${
              isActive
                ? "bg-blue-50 text-blue-500 dark:bg-blue-950"
                : "hover:bg-gray-100 hover:text-blue-500 dark:text-slate-300 dark:hover:bg-slate-800"
            }`
          }
        >
          <Settings size={22} />
        </NavLink>
      </div>
    </aside>
  );
}