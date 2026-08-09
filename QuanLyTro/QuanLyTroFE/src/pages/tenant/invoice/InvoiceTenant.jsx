import { useEffect, useState } from "react";
import { Eye, Search, X } from "lucide-react";

import { getInvoices } from "../../../services/invoiceService";
import { createPayment } from "../../../services/paymentService";

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

import InvoiceView from "../../admin/invoice/InvoiceView";
import { getSettings } from "../../../services/settingService";

const initialPaymentForm = {
  amount: "",
  proof_image: null,
  note: "",
};

const statusList = [
  { text: "Chờ thanh toán", color: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300" },
  { text: "Chờ duyệt", color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-300" },
  { text: "Thanh toán một phần", color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300" },
  { text: "Hoàn thành", color: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-300" },
  { text: "Quá hạn", color: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-300" },
];

export default function InvoiceTenant() {
  const [invoices, setInvoices] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [viewing, setViewing] = useState(null);

  const [paying, setPaying] = useState(null);
  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [isPaying, setIsPaying] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [filter,setFilter]=useState("");

  const [homeInfor, setHomeInfor] = useState(null);

  useEffect(()=>{
    fetchHouseInfor();
  },[]);
  
  const fetchHouseInfor = async()=>{
    try{
      const response = await getSettings();
      setHomeInfor(response.data.data.system);
    }
    catch(error){
      setToast({
        type:"error",
        message: error?.response?.data?.message ?? "Có lỗi xảy ra."
      });
    }
  }

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
    fetchInvoices();
  }, [page, search, filter]);

  const fetchInvoices = async () => {
    try {
      setIsLoading(true);

      const response = await getInvoices(page, search, filter);

      setInvoices(response.data.data.data || []);
      setTotalPage(response.data.data.last_page || 1);
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể tải danh sách hóa đơn.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = (invoice) => {
    return (
      statusList[Number(invoice.status)] || {
        text: "Không xác định",
        color: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
      }
    );
  };

  const openPayment = (invoice) => {
    setPaying(invoice);
    setPaymentForm({
      amount: invoice.remain_amount ?? "",
      proof_image: null,
      note: "",
    });
  };

  const closePayment = () => {
    if (isPaying) return;

    setPaying(null);
    setPaymentForm(initialPaymentForm);
  };

  const handlePaymentChange = (event) => {
    const { name, value, files } = event.target;

    setPaymentForm((previous) => ({
      ...previous,
      [name]: name === "proof_image" ? (files[0] ?? null) : value,
    }));
  };

  const handlePayment = async (event) => {
    event.preventDefault();

    const amount = Number(paymentForm.amount);
    const remainAmount = Number(paying.remain_amount);

    if (!amount || amount <= 0) {
      setToast({
        type: "error",
        message: "Vui lòng nhập số tiền hợp lệ.",
      });
      return;
    }

    if (amount > remainAmount) {
      setToast({
        type: "error",
        message: "Số tiền vượt quá số tiền còn phải trả.",
      });
      return;
    }

    if (!paymentForm.proof_image) {
      setToast({
        type: "error",
        message: "Vui lòng chọn ảnh minh chứng.",
      });
      return;
    }

    if (paymentForm.proof_image.size > 5 * 1024 * 1024) {
      setToast({
        type: "error",
        message: "Ảnh minh chứng không được vượt quá 5MB.",
      });
      return;
    }

    const data = new FormData();

    data.append("invoice_id", paying.id);
    data.append("amount", amount);
    data.append("payment_method", 1);
    data.append("proof_image", paymentForm.proof_image);

    if (paymentForm.note) {
      data.append("note", paymentForm.note);
    }

    try {
      setIsPaying(true);

      const response = await createPayment(data);

      setPaying(null);
      setPaymentForm(initialPaymentForm);

      setToast({
        type: "success",
        message: response.data.message || "Gửi thông tin thanh toán thành công.",
      });

      await fetchInvoices();
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.error || error.response?.data?.message || "Không thể tạo giao dịch thanh toán.",
      });
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <>
      {toast && <Toast title={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ContentLayout
        title="Hóa đơn của tôi"
        toolbar={
          <div
            className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 w-50 h-8
            dark:border-slate-600 dark:bg-slate-800">
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
          <select name="filter" id="filter"
            onChange={(event) => {
              setFilter(event.target.value);
              setPage(1);
            }}
            value={filter}
            className="text-center border border-slate-300 rounded-lg
            dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Toàn bộ</option>
            <option value="0">Chưa thanh toán</option>
            <option value="1">Chờ duyệt</option>
            <option value="2">Một phần</option>
            <option value="3">Hoàn thành</option>
            <option value="4">Quá hạn</option>
          </select>
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
              <Th>Hạn thanh toán</Th>
              <Th>Trạng thái</Th>
              <Th>#</Th>
              <Th>Thanh toán</Th>
            </Tr>
          </Thead>

          <Tbody>
            {isLoading ? (
              <Tr>
                <td className="text-center" colSpan={10}>
                  <Loading />
                </td>
              </Tr>
            ) : invoices.length === 0 ? (
              <Tr>
                <td colSpan={10} className="text-center p-4 text-lg">
                  Chưa có hóa đơn
                </td>
              </Tr>
            ) : (
              invoices.map((invoice) => {
                const status = getStatus(invoice);

                return (
                  <Tr key={invoice.id}>
                    <Td>{invoice.invoice_code}</Td>

                    <Td>{invoice.bill_month}</Td>

                    <Td>{invoice.rooms?.room_name || "Không xác định"}</Td>

                    <Td>{formatCurrency(invoice.total_amount)}</Td>

                    <Td className="text-green-600 dark:text-green-400">{formatCurrency(invoice.paid_amount)}</Td>

                    <Td className="text-red-600 dark:text-red-400">{formatCurrency(invoice.remain_amount)}</Td>

                    <Td>{formatDate(invoice.due_date)}</Td>

                    <Td>
                      <span className={`inline-block rounded-xl px-3 py-1 text-sm font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </Td>

                    <Td>
                      <button
                        type="button"
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => setViewing(invoice)}
                        title="Xem chi tiết"
                      >
                        <Eye size={20} />
                      </button>
                    </Td>

                    <Td>
                      {invoice.status !== 3 && (
                        <Button
                          type="button"
                          onClick={() => openPayment(invoice)}
                          disabled={Number(invoice.status) === 1 || Number(invoice.status) === 3}
                          className="font-semibold disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600"
                        >
                          {Number(invoice.status) === 1
                            ? "Chờ duyệt"
                            : Number(invoice.status) === 3
                              ? "Đã xong"
                              : "Thanh toán"}
                        </Button>
                      )}
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </TableLayout>
      </ContentLayout>
      <Paginate page={page} totalPage={totalPage} setPage={setPage} />

      {viewing && <InvoiceView invoice={viewing} isOpen={viewing !== null} onClose={() => setViewing(null)} />}

      {paying && (
        <Modal title="Thanh toán hóa đơn" isOpen={paying !== null} onClose={closePayment} className="max-w-xl">
          <form onSubmit={handlePayment} className="flex flex-col gap-4">
            <div className="flex rounded-xl bg-slate-100 p-3 dark:bg-slate-800 gap-5">
              <div>
                <p>
                  Mã hóa đơn: <span className="font-semibold">{paying.invoice_code}</span>
                </p>

                <p>
                  Phòng: <span className="font-semibold">{paying.rooms?.room_name || "Không xác định"}</span>
                </p>

                <p>
                  Còn phải trả:{" "}
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    {formatCurrency(paying.remain_amount)}
                  </span>
                </p>
              </div>

              <div>
                <p>
                  Số Tài Khoản: <span className="font-semibold">{homeInfor?.bank_number ?? "Chưa cập nhật"}</span>
                </p>
                <p>
                  Ngân hàng: <span className="font-semibold">{homeInfor?.bank_name ?? "Chưa cập nhật"}</span>
                </p>
                <p>
                  Chủ tài khoản: <span className="font-semibold">{homeInfor?.bank_owner ?? "Chưa cập nhật"}</span>
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="amount">Số tiền chuyển khoản</Label>

              <input
                id="amount"
                name="amount"
                type="number"
                min={1}
                max={Number(paying.remain_amount)}
                value={paymentForm.amount}
                onChange={handlePaymentChange}
                className="w-full rounded-xl border p-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <Label htmlFor="proof_image">Ảnh minh chứng</Label>

              <input
                id="proof_image"
                name="proof_image"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePaymentChange}
                className="w-full rounded-xl border p-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                required
              />

              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Chấp nhận JPG, PNG, WEBP; tối đa 5MB.</p>
            </div>

            <div>
              <Label htmlFor="note">Ghi chú</Label>

              <textarea
                id="note"
                name="note"
                rows={2}
                value={paymentForm.note}
                onChange={handlePaymentChange}
                placeholder="Nhập nội dung chuyển khoản nếu có..."
                className="w-full rounded-xl border p-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              ></textarea>
            </div>

            <div className="flex justify-end gap-3 border-t pt-4 dark:border-slate-700">
              <Button
                type="button"
                className="bg-slate-500 hover:bg-slate-700"
                onClick={closePayment}
                disabled={isPaying}
              >
                Hủy
              </Button>

              <Button type="submit" disabled={isPaying}>
                {isPaying ? "Đang gửi..." : "Xác nhận thanh toán"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
