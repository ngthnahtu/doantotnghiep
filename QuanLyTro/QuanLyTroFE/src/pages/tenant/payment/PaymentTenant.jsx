import { useEffect, useState } from "react";
import { Eye, Search, X } from "lucide-react";

import { getPayments } from "../../../services/paymentService";

import Button from "../../../components/common/Button";
import ContentLayout from "../../../layouts/ContentLayout";
import Label from "../../../components/common/Label";
import Loading from "../../../components/common/Loading";
import Modal from "../../../components/common/Modal";
import Paginate from "../../../components/common/Paginate";
import { TableLayout, Tbody, Td, Th, Thead, Tr } from "../../../components/common/TableLayout";
import Toast from "../../../components/common/Toast";

import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";

const statusList = [
  {
    text: "Chờ duyệt",
    color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-300",
  },
  {
    text: "Đã duyệt",
    color: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-300",
  },
  {
    text: "Từ chối",
    color: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300",
  },
];

export default function PaymentTenant() {
  const [payments, setPayments] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [viewing, setViewing] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(keyword.trim());
      setPage(1);
    }, 500);
    return () => clearTimeout(timeout);
  }, [keyword]);

  const clearSearch = () => {
    setKeyword("");
    setSearch("");
    if (page !== 1) {
      setPage(1);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, search, filter]);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);

      const response = await getPayments(page, search, filter);

      setPayments(response.data.data.data || []);
      setTotalPage(response.data.data.last_page || 1);
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể tải lịch sử thanh toán.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = (payment) => {
    return (
      statusList[Number(payment.status)] || {
        text: "Không xác định",
        color: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
      }
    );
  };

  return (
    <>
      {toast && <Toast title={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ContentLayout
        title="Lịch sử thanh toán"
        toolbar={
          <div
            className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 w-50 h-8
          dark:border-slate-600 dark:bg-slate-800"
          >
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full text-sm outline-none dark:bg-slate-800 dark:text-slate-100"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            {keyword && (
              <button onClick={clearSearch}>
                <X />
              </button>
            )}
          </div>
        }
        filter={
          <select
            name="filter"
            id="filter"
            className="text-center border border-slate-300 rounded-lg
            dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            onChange={(event) => {
              setFilter(event.target.value);
              setPage(1);
            }}
            value={filter}
          >
            <option value="">Toàn bộ</option>
            <option value="0">Chờ duyệt</option>
            <option value="1">Thành công</option>
            <option value="2">Từ chối</option>
          </select>
        }
      >
        <TableLayout>
          <Thead>
            <Tr>
              <Th>Mã giao dịch</Th>
              <Th>Mã hóa đơn</Th>
              <Th>Ngày thanh toán</Th>
              <Th>Phương thức</Th>
              <Th>Số tiền</Th>
              <Th>Trạng thái</Th>
              <Th>Ngày duyệt</Th>
              <Th>#</Th>
            </Tr>
          </Thead>

          <Tbody>
            {isLoading ? (
              <Tr>
                <td className="text-center" colSpan={8}>
                  <Loading />
                </td>
              </Tr>
            ) : payments.length === 0 ? (
              <Tr>
                <td colSpan={8} className="text-center p-3 text-lg">
                   Chưa có giao dịch.
                </td>
              </Tr>
            ) : (
              payments.map((payment) => {
                const status = getStatus(payment);

                return (
                  <Tr key={payment.id}>
                    <Td>{payment.payment_code}</Td>

                    <Td>{payment.invoices?.invoice_code || "Không xác định"}</Td>

                    <Td>{formatDate(payment.payment_date)}</Td>

                    <Td>{Number(payment.payment_method) === 0 ? "Tiền mặt" : "Chuyển khoản"}</Td>

                    <Td>{formatCurrency(payment.amount)}</Td>

                    <Td>
                      <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </Td>

                    <Td>{payment.approved_at ? formatDate(payment.approved_at) : "Chưa duyệt"}</Td>

                    <Td>
                      <button
                        type="button"
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => setViewing(payment)}
                        title="Xem chi tiết"
                      >
                        <Eye size={20} />
                      </button>
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </TableLayout>
      </ContentLayout>

      <Paginate page={page} totalPage={totalPage} setPage={setPage} />

      {viewing &&
        (() => {
          const status = getStatus(viewing);

          return (
            <Modal
              title="Chi tiết giao dịch"
              isOpen={viewing !== null}
              onClose={() => setViewing(null)}
              className="max-w-xl"
            >
              <div className="flex flex-col gap-4">
                <div className="rounded-xl border bg-slate-100 p-3 dark:border-slate-700 dark:bg-slate-800">
                  <div className="flex items-center justify-between border-b pb-2 dark:border-slate-700">
                    <div>
                      <Label>Mã giao dịch</Label>

                      <p className="font-semibold">{viewing.payment_code}</p>
                    </div>

                    <span className={`rounded-full px-3 py-1 text-sm font-medium ${status.color}`}>{status.text}</span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <Label>Mã hóa đơn</Label>

                      <p>{viewing.invoices?.invoice_code || "Không xác định"}</p>
                    </div>

                    <div>
                      <Label>Phòng</Label>

                      <p>{viewing.invoices?.rooms?.room_name || "Không xác định"}</p>
                    </div>

                    <div>
                      <Label>Ngày thanh toán</Label>

                      <p>{formatDate(viewing.payment_date)}</p>
                    </div>

                    <div>
                      <Label>Ngày duyệt</Label>

                      <p>{viewing.approved_at ? formatDate(viewing.approved_at) : "Chưa duyệt"}</p>
                    </div>

                    <div>
                      <Label>Phương thức</Label>

                      <p>{Number(viewing.payment_method) === 0 ? "Tiền mặt" : "Chuyển khoản"}</p>
                    </div>

                    <div>
                      <Label>Số tiền</Label>

                      <p className="font-semibold text-blue-600 dark:text-blue-400">{formatCurrency(viewing.amount)}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Ghi chú</Label>

                  <p className="rounded-xl border p-3 dark:border-slate-700">{viewing.note || "Không có ghi chú."}</p>
                </div>

                <div className="flex justify-end">
                  <Button type="button" className="bg-slate-500 hover:bg-slate-700" onClick={() => setViewing(null)}>
                    Đóng
                  </Button>
                </div>
              </div>
            </Modal>
          );
        })()}
    </>
  );
}
