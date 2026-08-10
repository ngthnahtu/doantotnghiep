import { BrowserRouter, Route, Routes } from "react-router-dom";
import Role from "./Role";

import Dashboard from "../pages/admin/dashboard/Dashboard";
import ContractList from "../pages/admin/contract/ContractList";
import InvoiceList from "../pages/admin/invoice/InvoiceList";
import IssueList from "../pages/admin/issue/IssueList";
import NotificationList from "../pages/admin/notification/NotificationList";
import PaymentList from "../pages/admin/payment/PaymentList";
import RoomList from "../pages/admin/room/RoomList";
import ServiceList from "../pages/admin/service/ServiceList";
import Setting from "../pages/admin/setting/Setting";

import TenantList from "../pages/admin/tenant/TenantList";
import ContractTenant from "../pages/tenant/contract/ContractTenant";
import InvoiceTenant from "../pages/tenant/invoice/InvoiceTenant";
import IssueTenant from "../pages/tenant/issue/IssueTenant";
import NotificationTenant from "../pages/tenant/notification/NotificationTenant";
import PaymentTenant from "../pages/tenant/payment/PaymentTenant";
import NotFound from "../pages/NotFound";
import Login from "../pages/auth/Login";
import AdminLayout from "../layouts/AdminLayout";
import TenantLayout from "../layouts/TenantLayout";
import InvoiceCreate from "../pages/admin/invoice/InvoiceCreate";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route element={<Role allowRole={0} />}>
          <Route element={<AdminLayout/>}>
          
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/dashboard" element={<Dashboard />} />

            <Route path="/admin/contract" element={<ContractList />} />
            
            <Route path="/admin/invoice" element={<InvoiceList />} />
            <Route path="/admin/invoice/create" element={<InvoiceCreate/>} />

            <Route path="/admin/notification" element={<NotificationList />} />
            <Route path="/admin/payment" element={<PaymentList />} />
            <Route path="/admin/room" element={<RoomList />} />
            <Route path="/admin/issue" element={<IssueList/>}/>
            <Route path="/admin/service" element={<ServiceList />} />
            <Route path="/admin/setting" element={<Setting />} />
            <Route path="/admin/tenant" element={<TenantList />} />
          </Route>
        </Route>

        <Route element={<Role allowRole={1} />}>
          <Route element={<TenantLayout/>}>
            <Route path="/tenant" element={<ContractTenant />} />
            <Route path="/tenant/contract" element={<ContractTenant />} />
            <Route path="/tenant/invoice" element={<InvoiceTenant />} />
            <Route path="/tenant/notification" element={<NotificationTenant />}/>
            <Route path="/tenant/payment" element={<PaymentTenant />} />
            <Route path="/tenant/issue" element={<IssueTenant/>}/>
            <Route path="/tenant/setting" element={<Setting />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFound />}></Route>
      </Routes>
    </BrowserRouter>
  );
}
