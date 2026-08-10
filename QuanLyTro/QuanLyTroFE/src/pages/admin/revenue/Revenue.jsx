// src/pages/admin/revenue/Revenue.jsx

import { useEffect, useState } from "react";

import { getRevenue, getRevenueHistory } from "../../../services/dashboardService";

import ContentLayout from "../../../layouts/ContentLayout";
import Loading from "../../../components/common/Loading";
import Toast from "../../../components/common/Toast";
import Paginate from "../../../components/common/Paginate";

import { TableLayout, Tbody, Td, Th, Thead, Tr } from "../../../components/common/TableLayout";

import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";

export default function Revenue() {
  const currentYear = new Date().getFullYear();

  const [view, setView] = useState("summary");

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState("");

  const [revenue, setRevenue] = useState(null);
  const [history, setHistory] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchRevenue();
  }, [year]);

  useEffect(() => {
    fetchHistory();
  }, [page, year, month]);

  const fetchRevenue = async () => {
    try {
      const response = await getRevenue(year);
      setRevenue(response.data.data);
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể tải dữ liệu doanh thu.",
      });
    }
  };

  const fetchHistory = async () => {
    try {
      setIsLoading(true);

      const response = await getRevenueHistory(page, year, month);
      setHistory(response.data.data.data || []);
      setTotalPage(response.data.data.last_page || 1);
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể tải lịch sử doanh thu.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRevenueByMonth = (month) => {
    const item = revenue?.monthly_revenue?.find((item) => Number(item.month) === month);
    return item?.revenue || 0;
  };

  return (
    <>
      {toast && <Toast title={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ContentLayout title="Doanh thu">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setView("summary")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              view === "summary"
                ? "bg-blue-500 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Doanh thu
          </button>

          <button
            type="button"
            onClick={() => setView("history")}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              view === "history"
                ? "bg-blue-500 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            Lịch sử doanh thu
          </button>

          <select
            value={year}
            onChange={(event) => {
              setYear(Number(event.target.value));
              setPage(1);
            }}
            className="text-center border border-slate-300 rounded-lg bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value={currentYear}>{currentYear}</option>
            <option value={currentYear - 1}>{currentYear - 1}</option>
            <option value={currentYear - 2}>{currentYear - 2}</option>
          </select>

          {view === "history" && (
            <select
              value={month}
              onChange={(event) => {
                setMonth(event.target.value);
                setPage(1);
              }}
              className="text-center border border-slate-300 rounded-lg bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">Tất cả tháng</option>
              <option value="1">Tháng 1</option>
              <option value="2">Tháng 2</option>
              <option value="3">Tháng 3</option>
              <option value="4">Tháng 4</option>
              <option value="5">Tháng 5</option>
              <option value="6">Tháng 6</option>
              <option value="7">Tháng 7</option>
              <option value="8">Tháng 8</option>
              <option value="9">Tháng 9</option>
              <option value="10">Tháng 10</option>
              <option value="11">Tháng 11</option>
              <option value="12">Tháng 12</option>
            </select>
          )}
        </div>

        {view === "summary" ? (
          <>
            <div className="mb-4 rounded-xl border border-slate-200 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <p className="text-sm text-slate-500 dark:text-slate-400">Tổng doanh thu năm {year}</p>

              <p className="mt-1 text-2xl font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(revenue?.total_revenue || 0)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="p-3 text-center">Tháng</th>
                      <th className="p-3 text-center">Doanh thu</th>
                    </tr>
                  </thead>

                  <tbody>
                    {[1, 2, 3, 4, 5, 6].map((month) => (
                      <tr key={month} className="border-t border-slate-200 dark:border-slate-700">
                        <td className="p-3 text-center">
                          {String(month).padStart(2, "0")}/{year}
                        </td>

                        <td className="p-3 text-center">{formatCurrency(getRevenueByMonth(month))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-800">
                    <tr>
                      <th className="p-3 text-center">Tháng</th>
                      <th className="p-3 text-center">Doanh thu</th>
                    </tr>
                  </thead>

                  <tbody>
                    {[7, 8, 9, 10, 11, 12].map((month) => (
                      <tr key={month} className="border-t border-slate-200 dark:border-slate-700">
                        <td className="p-3 text-center">
                          {String(month).padStart(2, "0")}/{year}
                        </td>

                        <td className="p-3 text-center">{formatCurrency(getRevenueByMonth(month))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <TableLayout>
            <Thead>
              <Tr>
                <Th>Mã thanh toán</Th>
                <Th>Ngày thu</Th>
                <Th>Phòng</Th>
                <Th>Khách thuê</Th>
                <Th>Hình thức</Th>
                <Th>Số tiền</Th>
              </Tr>
            </Thead>

            <Tbody>
              {isLoading ? (
                <Tr>
                  <td colSpan={6} className="text-center">
                    <Loading />
                  </td>
                </Tr>
              ) : history.length === 0 ? (
                <Tr>
                  <td colSpan={6} className="text-center text-lg p-3">
                    Chưa có dữ liệu
                  </td>
                </Tr>
              ) : (
                history.map((payment) => (
                  <Tr key={payment.id}>
                    <Td>{payment.payment_code}</Td>

                    <Td>{formatDate(payment.approved_at)}</Td>

                    <Td>{payment.invoices?.rooms?.room_name || "Không xác định"}</Td>

                    <Td>{payment.invoices?.contracts?.tenants?.name || "Không xác định"}</Td>

                    <Td>{Number(payment.payment_method) === 0 ? "Tiền mặt" : "Chuyển khoản"}</Td>

                    <Td>{formatCurrency(payment.amount)}</Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </TableLayout>
        )}
      </ContentLayout>

      {view === "history" && <Paginate page={page} setPage={setPage} totalPage={totalPage} />}
    </>
  );
}
