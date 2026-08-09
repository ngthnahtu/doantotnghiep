import Modal from "../../../components/common/Modal";
import Button from "../../../components/common/Button";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";

const statusList = [
  {
    text: "Chờ thanh toán",
    color: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300",
  },
  {
    text: "Chờ duyệt",
    color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-300",
  },
  {
    text: "Thanh toán một phần",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    text: "Hoàn thành",
    color: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-300",
  },
  {
    text: "Quá hạn",
    color: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-300",
  },
];

const chargeTypeList = ["Cố định", "Theo chỉ số", "Theo đầu người"];

export default function InvoiceView({ invoice, isOpen, onClose }) {
  if (!invoice) {
    return null;
  }

  const status = statusList[Number(invoice.status)] ?? {
    text: "Không xác định",
    color: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
  };

  const [year, month] = invoice.bill_month?.split("-") ?? [];

  const serviceTotal = invoice.invoice_details?.reduce((total, detail) => total + Number(detail.subtotal), 0) || 0;

  return (
    <Modal title="Chi tiết hóa đơn" isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="max-h-[70vh] overflow-y-auto border rounded-xl p-4 dark:border-slate-700">
        <div className="border-b pb-3 text-center dark:border-slate-700">
          <h2 className="text-2xl font-bold">HÓA ĐƠN TIỀN PHÒNG</h2>

          <p className="mt-1">
            Mã hóa đơn: <span className="font-semibold">{invoice.invoice_code}</span>
          </p>

          <span className={`mt-2 inline-block rounded px-3 py-1 text-sm ${status.color}`}>{status.text}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="border rounded-xl p-3 dark:border-slate-700">
            <h3 className="border-b pb-2 font-semibold dark:border-slate-700">Thông tin khách thuê</h3>

            <div className="mt-2 space-y-2 text-sm">
              <p>
                Tên khách: <span className="font-medium">{invoice.contracts?.tenants?.name ?? "Không xác định"}</span>
              </p>

              <p>
                Số điện thoại:{" "}
                <span className="font-medium">{invoice.contracts?.tenants?.phone ?? "Chưa cập nhật"}</span>
              </p>

              <p>
                CCCD/CMND:{" "}
                <span className="font-medium">{invoice.contracts?.tenants?.identity_number ?? "Chưa cập nhật"}</span>
              </p>
            </div>
          </div>

          <div className="border rounded-xl p-3 dark:border-slate-700">
            <h3 className="border-b pb-2 font-semibold dark:border-slate-700">Thông tin phòng</h3>

            <div className="mt-2 space-y-2 text-sm">
              <p>
                Tên phòng: <span className="font-medium">{invoice.rooms?.room_name ?? "Không xác định"}</span>
              </p>

              <p>
                Tháng hóa đơn:{" "}
                <span className="font-medium">{month && year ? `${month}/${year}` : "Không xác định"}</span>
              </p>

              <p>
                Hạn thanh toán: <span className="font-medium">{formatDate(invoice.due_date)}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 border rounded-xl p-3 dark:border-slate-700">
          <h3 className="border-b pb-2 font-semibold dark:border-slate-700">Thông tin thanh toán</h3>

          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <p>
              Tiền phòng: <span className="font-medium">{formatCurrency(invoice.room_price_snapshot)}</span>
            </p>

            <p>
              Tiền dịch vụ: <span className="font-medium">{formatCurrency(serviceTotal)}</span>
            </p>

            <p>
              Đã thanh toán:{" "}
              <span className="font-medium text-green-600 dark:text-green-400">
                {formatCurrency(invoice.paid_amount)}
              </span>
            </p>

            <p>
              Còn lại:{" "}
              <span className="font-medium text-red-600 dark:text-red-400">
                {formatCurrency(invoice.remain_amount)}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-4 border rounded-xl p-3 dark:border-slate-700">
          <h3 className="border-b pb-2 font-semibold dark:border-slate-700">Chi tiết dịch vụ</h3>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border p-2 dark:border-slate-700">Dịch vụ</th>

                  <th className="border p-2 dark:border-slate-700">Chỉ số cũ</th>

                  <th className="border p-2 dark:border-slate-700">Chỉ số mới</th>

                  <th className="border p-2 dark:border-slate-700">Đơn giá</th>

                  <th className="border p-2 dark:border-slate-700">Thành tiền</th>
                </tr>
              </thead>

              <tbody>
                {invoice.invoice_details?.length > 0 ? (
                  invoice.invoice_details.map((detail) => (
                    <tr key={detail.id}>
                      <td className="border p-2 dark:border-slate-700">
                        <p className="font-medium">{detail.service_name_snapshot}</p>

                        <p className="text-xs text-gray-500 dark:text-slate-400">
                          {chargeTypeList[Number(detail.services?.charge_type)] ?? "Không xác định"}
                        </p>
                      </td>

                      <td className="border p-2 text-center dark:border-slate-700">{detail.old_index ?? "—"}</td>

                      <td className="border p-2 text-center dark:border-slate-700">{detail.new_index ?? "—"}</td>

                      <td className="border p-2 text-right dark:border-slate-700">
                        {formatCurrency(detail.unit_price_snapshot)}
                      </td>

                      <td className="border p-2 text-right dark:border-slate-700">{formatCurrency(detail.subtotal)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="border p-3 text-center dark:border-slate-700">
                      Chưa có chi tiết dịch vụ.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 border rounded-xl p-3 dark:border-slate-700">
          <h3 className="border-b pb-2 font-semibold dark:border-slate-700">Ghi chú</h3>

          <p className="mt-2 text-sm">{invoice.note || "Không có ghi chú."}</p>
        </div>

        <div className="mt-4 rounded bg-gray-100 p-3 dark:bg-slate-800">
          <div className="flex justify-between">
            <span>Tiền phòng</span>

            <span>{formatCurrency(invoice.room_price_snapshot)}</span>
          </div>

          <div className="mt-2 flex justify-between">
            <span>Tiền dịch vụ</span>

            <span>{formatCurrency(serviceTotal)}</span>
          </div>

          <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold dark:border-slate-700">
            <span>Tổng cộng</span>

            <span>{formatCurrency(invoice.total_amount)}</span>
          </div>

          <div className="mt-2 flex justify-between font-semibold text-red-600 dark:text-red-400">
            <span>Còn phải trả</span>

            <span>{formatCurrency(invoice.remain_amount)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-600">
          Đóng
        </Button>
      </div>
    </Modal>
  );
}
