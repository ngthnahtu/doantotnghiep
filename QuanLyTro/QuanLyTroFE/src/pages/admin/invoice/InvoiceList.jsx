import { useState, useEffect } from "react";
import {
  deleteInvoice,
  getInvoices,
} from "../../../services/invoiceService";
import Toast from "../../../components/common/Toast";
import Loading from "../../../components/common/Loading";
import ContentLayout from "../../../layouts/ContentLayout";
import Button from "../../../components/common/Button";
import { useNavigate } from "react-router-dom";
import {
  TableLayout,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "../../../components/common/TableLayout";
import { formatDate } from "../../../utils/formatDate";
import { formatCurrency } from "../../../utils/formatCurrency";
import { Eye, Pencil, Trash2 } from "lucide-react";
import InvoiceView from "./InvoiceView";
import Paginate from "../../../components/common/Paginate";
import InvoiceEdit from "./InvoiceEdit";
import Modal from "../../../components/common/Modal";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { createPayment } from "../../../services/paymentService";

const initForm = {
  invoice_id: "",
  amount: "",
  payment_method: 0,
  note: "",
};

export default function InvoiceList() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [invoices, setInvoices] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [viewing, setIsViewing] = useState(null);
  const [editing, setEditing] = useState(null);

  const [deleting, setDeleting] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isPayment, setIsPayment] = useState(null);
  const [formPayment, setFormPayment] = useState(initForm);

  useEffect(() => {
    fetchInvoices();
  }, [page]);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);

      const response = await getInvoices(page);
      const invoiceData = response.data.data;

      setInvoices(invoiceData.data);
      setTotalPage(invoiceData.last_page);
    } catch (error) {
      setToast({
        type: "error",
        message:
          error.response?.data?.message || "Không thể tải danh sách hóa đơn.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;

    try {
      setIsDeleting(true);

      const response = await deleteInvoice(deleting.id);

      setDeleting(null);

      if (invoices.length === 1 && page > 1) {
        setPage((previous) => previous - 1);
      } else {
        await fetchInvoices();
      }

      setToast({
        type: "success",
        message: response.data.message || "Xóa hóa đơn thành công.",
      });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error.response?.data?.message || "Không thể xóa hóa đơn.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChangePayment = (event) => {
    const { name, value } = event.target;

    setFormPayment((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSavePayment = async () => {
    const amount = Number(formPayment.amount);
    const remainAmount = Number(isPayment.remain_amount);

    if (!amount || amount <= 0) {
      setToast({
        type: "error",
        message: "Vui lòng nhập số tiền thanh toán hợp lệ.",
      });
      return;
    }

    if (amount > remainAmount) {
      setToast({
        type: "error",
        message: "Số tiền thanh toán lớn hơn số tiền còn lại.",
      });
      return;
    }

    const data = {
      invoice_id: isPayment.id,
      amount,
      payment_method: 0,
      note: formPayment.note || null,
    };

    try {
      const response = await createPayment(data);

      setIsPayment(null);
      setFormPayment(initForm);

      await fetchInvoices();

      setToast({
        type: "success",
        message:
          response.data.message || "Ghi nhận thanh toán thành công.",
      });
    } catch (error) {
      setToast({
        type: "error",
        message:
          error.response?.data?.message || "Không thể tạo thanh toán.",
      });
    }
  };

  if (isLoading && invoices.length === 0) {
    return <Loading />;
  }

  return (
    <>
      {toast && (
        <Toast
          title={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {viewing && (
        <InvoiceView
          invoice={viewing}
          isOpen={viewing !== null}
          onClose={() => setIsViewing(null)}
        />
      )}

      {editing && (
        <InvoiceEdit
          editing={editing}
          onClose={() => {
            setEditing(null);
            fetchInvoices();
          }}
        />
      )}

      <ConfirmDialog
        title="Xóa hóa đơn"
        message={`Bạn có chắc muốn xóa hóa đơn ${
          deleting?.invoice_code || ""
        } không?`}
        isOpen={deleting !== null}
        loading={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setDeleting(null);
          }
        }}
        onConfirm={handleDelete}
      />

      <ContentLayout
        title="Quản lý hóa đơn"
        action={
          <Button onClick={() => navigate("/admin/invoice/create")}>
            Thêm mới
          </Button>
        }
      >
        <TableLayout>
          <Thead>
            <Tr>
              <Th>Mã hóa đơn</Th>
              <Th>Tháng</Th>
              <Th>Phòng</Th>
              <Th>Tổng tiền</Th>
              <Th>Đã thanh toán</Th>
              <Th>Còn lại</Th>
              <Th>Trạng thái</Th>
              <Th>Ngày hết hạn</Th>
              <Th>#</Th>
              <Th>Thanh toán</Th>
            </Tr>
          </Thead>

          <Tbody>
            {invoices.length === 0 ? (
              <Tr>
                <Td colSpan={10}>Chưa có dữ liệu</Td>
              </Tr>
            ) : (
              invoices.map((invoice) => {
                const status = getStatus(invoice);
                const canEditOrDelete = Number(invoice.status) === 0;

                return (
                  <Tr key={invoice.id}>
                    <Td>{invoice.invoice_code}</Td>
                    <Td>{invoice.bill_month}</Td>
                    <Td>{invoice.rooms?.room_name}</Td>
                    <Td>{formatCurrency(invoice.total_amount)}</Td>
                    <Td>{formatCurrency(invoice.paid_amount)}</Td>
                    <Td>{formatCurrency(invoice.remain_amount)}</Td>

                    <Td>
                      <span
                        className={`inline-block rounded-xl px-3 py-1 text-sm font-medium ${status.color}`}
                      >
                        {status.text}
                      </span>
                    </Td>

                    <Td>{formatDate(invoice.due_date)}</Td>

                    <Td>
                      <div className="flex items-center justify-center gap-5">
                        <button
                          className="text-blue-500 hover:text-blue-700"
                          type="button"
                          title="Xem chi tiết"
                          onClick={() => setIsViewing(invoice)}
                        >
                          <Eye size={20} />
                        </button>

                        <button
                          className="text-yellow-500 hover:text-yellow-700 disabled:cursor-not-allowed disabled:opacity-40"
                          type="button"
                          title="Cập nhật"
                          disabled={!canEditOrDelete}
                          onClick={() => setEditing(invoice)}
                        >
                          <Pencil size={20} />
                        </button>

                        <button
                          className="text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                          type="button"
                          title="Xóa"
                          disabled={!canEditOrDelete}
                          onClick={() => setDeleting(invoice)}
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </Td>

                    <Td>
                      <Button
                        onClick={() => setIsPayment(invoice)}
                        disabled={
                          Number(invoice.status) === 1 ||
                          Number(invoice.status) === 3
                        }
                      >
                        Thanh toán
                      </Button>
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </TableLayout>

        {isPayment && (
          <Modal
            title="Thanh toán hóa đơn"
            isOpen={true}
            onClose={() => {
              setIsPayment(null);
              setFormPayment(initForm);
            }}
          >
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border bg-slate-100 p-3 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex flex-col items-center border-b pb-3 dark:border-slate-700">
                  <span className="text-xl font-semibold">
                    THANH TOÁN HÓA ĐƠN
                  </span>

                  <span>
                    Số hóa đơn:{" "}
                    <span className="font-semibold">
                      {isPayment.invoice_code}
                    </span>
                  </span>
                </div>

                <div className="mt-3">
                  <p>
                    Tên khách hàng:{" "}
                    <span className="font-semibold">
                      {isPayment.contracts?.tenants?.name}
                    </span>
                  </p>

                  <p>
                    Phòng:{" "}
                    <span className="font-semibold">
                      {isPayment.rooms?.room_name}
                    </span>
                  </p>

                  <p>
                    Tháng hóa đơn:{" "}
                    <span className="font-semibold">
                      {isPayment.bill_month}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-xl border p-3 dark:border-slate-700">
                <span>Tổng hóa đơn:</span>
                <span className="text-right font-semibold">
                  {formatCurrency(isPayment.total_amount)}
                </span>

                <span>Đã thanh toán:</span>
                <span className="text-right font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(isPayment.paid_amount)}
                </span>

                <span>Còn phải trả:</span>
                <span className="text-right font-semibold text-red-600 dark:text-red-400">
                  {formatCurrency(isPayment.remain_amount)}
                </span>
              </div>

              <div>
                <label
                  htmlFor="amount"
                  className="mb-1 block font-semibold"
                >
                  Số tiền nhận
                </label>

                <input
                  id="amount"
                  name="amount"
                  type="number"
                  max={Number(isPayment.remain_amount)}
                  value={formPayment.amount}
                  onChange={handleChangePayment}
                  placeholder="Nhập số tiền đã nhận"
                  className="w-full rounded-xl border p-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="payment_note"
                  className="mb-1 block font-semibold"
                >
                  Ghi chú
                </label>

                <textarea
                  id="payment_note"
                  name="note"
                  rows={2}
                  value={formPayment.note}
                  onChange={handleChangePayment}
                  placeholder="Nhập ghi chú..."
                  className="w-full rounded-xl border p-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  className="bg-slate-400 hover:bg-slate-600"
                  onClick={() => {
                    setIsPayment(null);
                    setFormPayment(initForm);
                  }}
                >
                  Hủy
                </Button>

                <Button type="button" onClick={handleSavePayment}>
                  Xác nhận thanh toán
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </ContentLayout>

      <Paginate
        page={page}
        setPage={setPage}
        totalPage={totalPage}
      />
    </>
  );
}

const getStatus = (invoice) => {
  const status = Number(invoice.status);

  if (status === 0) {
    return {
      text: "Chờ thanh toán",
      color:
        "bg-red-100 text-red-500 dark:bg-red-950 dark:text-red-300",
    };
  }

  if (status === 1) {
    return {
      text: "Chờ duyệt",
      color:
        "bg-yellow-100 text-yellow-500 dark:bg-yellow-950 dark:text-yellow-300",
    };
  }

  if (status === 2) {
    return {
      text: "Một phần",
      color:
        "bg-blue-100 text-blue-500 dark:bg-blue-950 dark:text-blue-300",
    };
  }

  return {
    text: "Hoàn thành",
    color:
      "bg-green-100 text-green-500 dark:bg-green-950 dark:text-green-300",
  };
};