import { useEffect, useState } from "react";
import {
  Bed,
  ChevronRight,
  CircleDollarSign,
  DoorOpen,
  Gauge,
  ReceiptText,
  TriangleAlert,
  Users,
  Wrench,
} from "lucide-react";

import { getDashboard } from "../../../services/dashboardService";
import ContentLayout from "../../../layouts/ContentLayout";
import Loading from "../../../components/common/Loading";
import Toast from "../../../components/common/Toast";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";
import { useNavigate } from "react-router-dom";

const issueStatus = ["Chờ tiếp nhận", "Đang xử lý", "Đã xử lý"];

const invoiceStatus = [
  "Chờ thanh toán",
  "Chờ duyệt",
  "Thanh toán một phần",
  "Hoàn thành",
  "Quá hạn"
];

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const navigate= useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setIsLoading(true);
      const response = await getDashboard();
      setDashboard(response.data?.data);
    } catch (error) {
      setToast({
        type: "error",
        message:
          error.response?.data?.message ||
          "Không thể tải dữ liệu tổng quan.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <Loading />;

  return (
    <>
      {toast && (
        <Toast
          title={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ContentLayout title="Tổng quan">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-4">
            <DashboardCard
              title="Tổng số phòng"
              value={dashboard?.total_room || 0}
              icon={Bed}
              color="bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
            />

            <DashboardCard
              title="Phòng đang thuê"
              value={dashboard?.rent_room || 0}
              icon={DoorOpen}
              color="bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"
            />

            <DashboardCard
              title="Phòng còn trống"
              value={dashboard?.empty_room || 0}
              icon={Bed}
              color="bg-sky-50 text-sky-600 dark:bg-sky-950 dark:text-sky-300"
            />

            <DashboardCard
              title="Tỷ lệ lấp đầy"
              value={`${dashboard?.room_rate || 0}%`}
              icon={Gauge}
              color="bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-300"
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <DashboardCard
              title="Doanh thu tháng"
              value={formatCurrency(dashboard?.revenue_month || 0)}
              icon={CircleDollarSign}
              color="bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300"
              onClick={()=>navigate("/admin/revenue")}
            />

            <DashboardCard
              title="Khách đang thuê"
              value={dashboard?.total_tenants || 0}
              icon={Users}
              color="bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300"
            />

            <DashboardCard
              title="Hóa đơn chưa thanh toán"
              value={dashboard?.unpaid_invoices || 0}
              icon={ReceiptText}
              color="bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-300"
            />

            <DashboardCard
              title="Sự cố chưa xử lý"
              value={dashboard?.open_issues || 0}
              icon={Wrench}
              color="bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <ReceiptText size={20} className="text-blue-500" />
                  <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                    Hóa đơn gần nhất
                  </h2>
                </div>

                <span className="text-sm text-slate-400">
                  Mới nhất
                </span>
              </div>

              <div className="px-4">
                {!dashboard?.invoice_recent?.length ? (
                  <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    Chưa có hóa đơn.
                  </p>
                ) : (
                  dashboard.invoice_recent.map((invoice) => (
                    <div
                      key={invoice.id}
                      className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0 dark:border-slate-700"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800 dark:text-slate-100">
                          {invoice.invoice_code}
                        </p>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {invoice.rooms?.room_name || "Không xác định"}
                        </p>
                      </div>

                      <div className="ml-4 text-right">
                        <p className="font-semibold text-green-600 dark:text-green-400">
                          {formatCurrency(invoice.total_amount)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {invoiceStatus[Number(invoice.status)] ||
                            "Không xác định"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <TriangleAlert
                    size={20}
                    className="text-orange-500"
                  />

                  <h2 className="font-semibold text-slate-800 dark:text-slate-100">
                    Sự cố gần nhất
                  </h2>
                </div>

                <span className="text-sm text-slate-400">
                  Mới nhất
                </span>
              </div>

              <div className="px-4">
                {!dashboard?.issue_recent?.length ? (
                  <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                    Chưa có sự cố.
                  </p>
                ) : (
                  dashboard.issue_recent.map((issue) => {
                    const status = Number(issue.status);

                    return (
                      <div
                        key={issue.id}
                        className="flex items-center justify-between border-b border-slate-100 py-3 last:border-0 dark:border-slate-700"
                      >
                        <div className="min-w-0">
                          <p
                            className="truncate font-medium text-slate-800 dark:text-slate-100"
                            title={issue.title}
                          >
                            {issue.title}
                          </p>

                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {issue.rooms?.room_name || "Không xác định"}
                            {" · "}
                            {formatDate(issue.created_at)}
                          </p>
                        </div>

                        <span
                          className={`ml-4 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                            status === 0
                              ? "bg-yellow-50 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-300"
                              : status === 1
                                ? "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
                                : "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-300"
                          }`}
                        >
                          {issueStatus[status] || "Không xác định"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </ContentLayout>
    </>
  );
}

function DashboardCard({ title, value, icon: Icon, color, onClick }) {
  return (
    <div className={`flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm 
    dark:border-slate-700 dark:bg-slate-900 ${onClick? "hover:shadow-md hover:bg-slate-100" : ""}`}
    onClick={onClick}>
      <div className="min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {title}
        </p>

        <p className="mt-1 truncate text-2xl font-semibold text-slate-800 dark:text-slate-100">
          {value}
        </p>
        {onClick && (
          <div className="mt-1 flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400">
            <span>Xem chi tiết</span>
            <ChevronRight size={14} />
          </div>
        )}
      </div>

      <div className={`ml-3 shrink-0 rounded-xl p-3 ${color}`}>
        <Icon size={25} />
      </div>
    </div>
  );
}