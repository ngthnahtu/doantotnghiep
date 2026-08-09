import { useEffect, useState } from "react";
import { getPayments, updatePayment } from "../../../services/paymentService";
import ContentLayout from "../../../layouts/ContentLayout";
import { TableLayout, Tbody, Td, Th, Thead, Tr } from "../../../components/common/TableLayout";
import { formatDate } from "../../../utils/formatDate";
import { formatCurrency } from "../../../utils/formatCurrency";
import { Eye, Search, X } from "lucide-react";
import Modal from "../../../components/common/Modal";
import Button from "../../../components/common/Button";
import Loading from "../../../components/common/Loading";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Toast from "../../../components/common/Toast";
import { BACKEND_URL } from "../../../services/api";
import Paginate from "../../../components/common/Paginate";

export default function PaymentList() {
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [payments, setPayments] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [isApproved, setIsApproved] = useState(null);
  const [confirmStatus, setIsConfirmStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [search, setSearch] = useState("");
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(keyword.trim());
      setPage(1);
    }, 500);
    return () => clearTimeout(timeout);
  }, [keyword]);

  useEffect(() => {
    fetchPayment();
  }, [page, search, filter]);

  const clearSearch = () => {
    setKeyword("");
    setSearch("");
    if (page !== 1) {
      setPage(1);
    }
  };

  const fetchPayment = async () => {
    try {
      setIsLoading(true);
      const response = await getPayments(page, search, filter);
      setPayments(response.data?.data?.data);
      setTotalPage(response.data?.data?.last_page);
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Có lỗi xảy ra.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (isProcessing) {
      return;
    }
    if (!isApproved || confirmStatus === null) {
      return;
    }
    try {
      setIsProcessing(true);
      const response = await updatePayment(isApproved.id, {
        status: confirmStatus,
      });

      setToast({
        type: "success",
        message: response.data?.message || "Xử lý giao dịch thành công.",
      });

      setIsConfirmStatus(null);
      setIsApproved(null);
      await fetchPayment();
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.error || error.response?.data?.message || "Không thể xử lý giao dịch.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {confirmStatus !== null && isApproved && (
        <ConfirmDialog
          title={confirmStatus === 1 ? "Xác nhận phê duyệt" : "Xác nhận từ chối"}
          message={
            confirmStatus === 1
              ? `Bạn có chắc muốn phê duyệt giao dịch ${formatCurrency(isApproved.amount)} của khách hàng ${
                  isApproved.invoices?.contracts?.tenants?.name ?? "-"
                } không?`
              : `Bạn có chắc muốn từ chối giao dịch ${formatCurrency(isApproved.amount)} của khách hàng ${
                  isApproved.invoices?.contracts?.tenants?.name ?? "-"
                } không?`
          }
          isOpen={true}
          loading={isProcessing}
          onCancel={() => setIsConfirmStatus(null)}
          onConfirm={handleConfirm}
        />
      )}

      {toast && <Toast type={toast.type} title={toast.message} onClose={() => setToast(null)} />}
      <ContentLayout
        title="Quản lý thanh toán"
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
              <Th>Tên khách thuê</Th>
              <Th>Ngày lập</Th>
              <Th>Ngày duyệt</Th>
              <Th>Số tiền</Th>
              <Th>Trạng thái</Th>
              <Th>#</Th>
            </Tr>
          </Thead>

          <Tbody>
            {isLoading ? (
              <Tr>
                <td className="text-center" colSpan={7}>
                  <Loading />
                </td>
              </Tr>
            ) : payments.length === 0 ? (
              <Tr>
                <td className="text-center text-lg p-4" colSpan={7}>
                  Chưa có giao dịch nào.
                </td>
              </Tr>
            ) : (
              payments.map((payment) => {
                const status = statusList(payment);
                return (
                  <Tr key={payment.id}>
                    <Td>{payment.payment_code}</Td>
                    <Td>{payment?.invoices?.contracts?.tenants?.name}</Td>
                    <Td>{formatDate(payment.payment_date)}</Td>
                    <Td>{formatDate(payment.approved_at)}</Td>
                    <Td>{formatCurrency(payment.amount)}</Td>
                    <Td>
                      <span className={`inline-block rounded-full px-2 py-1 text-sm font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </Td>
                    <Td>
                      <button
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => setIsApproved(payment)}
                        title="Xem/Duyệt hóa đơn"
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

      <Paginate page={page} setPage={setPage} totalPage={totalPage} />

      {isApproved &&
        (() => {
          const status = statusList(isApproved);

          return (
            <Modal
              title="Chi tiết giao dịch"
              isOpen={true}
              onClose={() => {
                setIsApproved(null);
                setIsConfirmStatus(null);
              }}
              className="max-w-4xl"
            >
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border bg-slate-100 p-3 dark:border-slate-700 dark:bg-slate-800">
                    <div className="flex items-center justify-between border-b pb-2 dark:border-slate-700">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Mã giao dịch</p>

                        <p className="font-semibold">{isApproved.payment_code}</p>
                      </div>

                      <span className={`rounded-full px-3 py-1 text-sm font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Ngày tạo</p>

                        <p className="font-medium">{formatDate(isApproved.payment_date)}</p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Ngày duyệt</p>

                        <p className="font-medium">
                          {isApproved.approved_at ? formatDate(isApproved.approved_at) : "Chưa duyệt"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Phương thức</p>

                        <p className="font-medium">
                          {Number(isApproved.payment_method) === 0 ? "Tiền mặt" : "Chuyển khoản"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Mã hóa đơn</p>

                        <p className="font-medium">{isApproved.invoices?.invoice_code || "Không xác định"}</p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Khách hàng</p>

                        <p className="font-medium">
                          {isApproved.invoices?.contracts?.tenants?.name || "Không xác định"}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Phòng</p>

                        <p className="font-medium">{isApproved.invoices?.rooms?.room_name || "Không xác định"}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border p-3 text-center dark:border-slate-700">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Số tiền thanh toán</p>

                    <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(isApproved.amount)}
                    </p>
                  </div>

                  <div>
                    <label htmlFor="payment_note" className="mb-1 block font-semibold">
                      Ghi chú
                    </label>

                    <textarea
                      id="payment_note"
                      rows={3}
                      value={isApproved.note ?? ""}
                      readOnly
                      className="w-full rounded-xl border p-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      placeholder="Không có ghi chú"
                    />
                  </div>
                </div>

                <div className="rounded-xl border dark:border-slate-700">
                  {isApproved.proof_image ? (
                    <div className="flex h-120 items-center justify-center rounded-xl p-2 dark:bg-slate-800">
                      <img
                        src={getImageUrl(isApproved.proof_image)}
                        alt="Ảnh minh chứng thanh toán"
                        className="max-h-full max-w-full rounded-lg object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex h-80 items-center justify-center rounded-xl text-slate-500 dark:text-slate-400">
                      Không có ảnh minh chứng.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3 border-t pt-4 dark:border-slate-700">
                <Button
                  type="button"
                  className="bg-slate-500 hover:bg-slate-700"
                  onClick={() => {
                    setIsApproved(null);
                    setIsConfirmStatus(null);
                  }}
                >
                  Đóng
                </Button>

                {Number(isApproved.status) === 0 && (
                  <>
                    <Button type="button" className="bg-red-500 hover:bg-red-600" onClick={() => setIsConfirmStatus(2)}>
                      Từ chối
                    </Button>

                    <Button type="button" onClick={() => setIsConfirmStatus(1)}>
                      Phê duyệt
                    </Button>
                  </>
                )}
              </div>
            </Modal>
          );
        })()}
    </>
  );
}
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const cleanPath = imagePath.replace(/^\/+/, "");
  if (cleanPath.startsWith("storage/")) {
    return `${BACKEND_URL}/${cleanPath}`;
  }
  return `${BACKEND_URL}/storage/${cleanPath}`;
};

const statusList = (payment) => {
  const status = Number(payment.status);
  if (status === 0) {
    return {
      text: "Chờ duyệt",
      color: "bg-yellow-100 text-yellow-500 dark:bg-yellow-950 dark:text-yellow-300",
    };
  }
  if (status === 1) {
    return {
      text: "Thành công",
      color: "bg-green-100 text-green-500 dark:bg-green-950 dark:text-green-300",
    };
  }
  if (status === 2) {
    return {
      text: "Từ chối",
      color: "bg-red-200 text-red-500 dark:bg-red-950 dark:text-red-300",
    };
  }
};
