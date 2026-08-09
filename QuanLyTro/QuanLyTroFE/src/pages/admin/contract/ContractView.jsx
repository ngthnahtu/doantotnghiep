import Modal from "../../../components/common/Modal";
import Button from "../../../components/common/Button";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";

const chargeTypeList = ["Cố định", "Theo chỉ số", "Theo đầu người"];

export default function ContractView({ contract, onClose }) {
  if (!contract) {
    return null;
  }

  let status = {
    text: "Đang hiệu lực",
    color: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-300",
  };

  if (Number(contract.status) === 1) {
    status = {
      text: "Đã thanh lý",
      color: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300",
    };
  } else if (Number(contract.status) === 2) {
    status = {
      text: "Đã hủy",
      color: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
    };
  } else {

    const today = new Date().toLocaleDateString("en-CA");
    const endDate = contract.end_date?.slice(0, 10);

    if (endDate && endDate < today) {
      status = {
        text: "Quá hạn - Chờ thanh lý",
        color: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-300",
      };
    }
  }

  return (
    <Modal title="Chi tiết hợp đồng" isOpen={true} onClose={onClose} className="max-w-4xl">
      <div className="max-h-[70vh] overflow-y-auto border rounded-xl p-4 dark:border-slate-700">

        <div className="border-b pb-3 text-center dark:border-slate-700">
          <h2 className="text-2xl font-bold">HỢP ĐỒNG THUÊ PHÒNG</h2>

          <p className="mt-1">
            Mã hợp đồng: <span className="font-semibold">{contract.contract_code}</span>
          </p>

          <span className={`mt-2 inline-block rounded-xl px-3 py-1 text-sm ${status.color}`}>{status.text}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="border rounded-xl p-3 dark:border-slate-700">
            <h3 className="border-b pb-2 font-semibold dark:border-slate-700">Thông tin phòng thuê</h3>

            <div className="mt-2 space-y-2 text-sm">
              <p>Tên phòng: <span className="font-medium">{contract.rooms?.room_name ?? "Không xác định"}</span></p>

              <p>Khách thuê: <span className="font-medium">{contract.tenants?.name ?? "Không xác định"}</span></p>

              <p>Số điện thoại: <span className="font-medium">{contract.tenants?.phone ?? "Chưa cập nhật"}</span></p>

              <p>CCCD/CMND: <span className="font-medium">{contract.tenants?.identity_number ?? "Chưa cập nhật"}</span></p>
            </div>
          </div>

          <div className="border rounded-xl p-3 dark:border-slate-700">
            <h3 className="border-b pb-2 font-semibold dark:border-slate-700">Thời hạn hợp đồng</h3>

            <div className="mt-2 space-y-2 text-sm">
              <p>Ngày bắt đầu: <span className="font-medium">{formatDate(contract.start_date)}</span></p>

              <p>Ngày hết hạn: <span className="font-medium">{formatDate(contract.end_date)}</span></p>

              <p>Ngày kết thúc thực tế:{" "}
                <span className="font-medium">
                  {contract.actual_end_date ? formatDate(contract.actual_end_date) : "Chưa thanh lý"}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="border rounded-xl p-3 dark:border-slate-700">
            <h3 className="border-b pb-2 font-semibold dark:border-slate-700">Giá thuê và tiền cọc</h3>

            <div className="mt-2 space-y-2 text-sm">
              <p>Giá thuê phòng: <span className="font-medium">{formatCurrency(contract.rent_price)}</span></p>

              <p>Tiền đặt cọc: <span className="font-medium">{formatCurrency(contract.deposit)}</span></p>

              <p>
                Tiền hoàn trả:{" "}
                <span className="font-medium">
                  {contract.returned_deposit !== null && contract.returned_deposit !== undefined
                    ? formatCurrency(contract.returned_deposit)
                    : "Chưa hoàn trả"}
                </span>
              </p>
            </div>
          </div>

          <div className="border rounded-xl p-3 dark:border-slate-700">
            <h3 className="border-b pb-2 font-semibold dark:border-slate-700">Thông tin khác</h3>

            <div className="mt-2 space-y-2 text-sm">
              <p>
                Ngày tạo:{" "}
                <span className="font-medium">
                  {contract.created_at ? formatDate(contract.created_at) : "Không xác định"}
                </span>
              </p>

              <p>
                Cập nhật gần nhất:{" "}
                <span className="font-medium">
                  {contract.updated_at ? formatDate(contract.updated_at) : "Không xác định"}
                </span>
              </p>

              <p>
                Trạng thái: <span className="font-medium">{status.text}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 border rounded-xl p-3 dark:border-slate-700">
          <h3 className="border-b pb-2 font-semibold dark:border-slate-700">Dịch vụ sử dụng</h3>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="border p-2 dark:border-slate-700">Dịch vụ</th>

                  <th className="border p-2 dark:border-slate-700">Cách tính</th>

                  <th className="border p-2 dark:border-slate-700">Đơn giá</th>
                </tr>
              </thead>

              <tbody>
                {contract.contract_services?.length > 0 ? (
                  contract.contract_services.map((contractService) => {
                    const service = contractService.services;

                    return (
                      <tr key={contractService.id ?? contractService.service_id}>
                        <td className="border p-2 dark:border-slate-700">{service?.name ?? "Không xác định"}</td>

                        <td className="border p-2 text-center dark:border-slate-700">
                          {chargeTypeList[Number(service?.charge_type)] ?? "Không xác định"}
                        </td>

                        <td className="border p-2 text-right dark:border-slate-700">
                          {service?.price !== null && service?.price !== undefined
                            ? formatCurrency(service.price)
                            : "Chưa có"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="border p-3 text-center dark:border-slate-700">
                      Hợp đồng chưa có dịch vụ.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 border rounded-xl p p-3 dark:border-slate-700">
          <h3 className="border-b pb-2 font-semibold dark:border-slate-700">Ghi chú và điều khoản bổ sung</h3>

          <p className="mt-2 text-sm">{contract.note || "Không có ghi chú hoặc điều khoản bổ sung."}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 border-t pt-4 text-center dark:border-slate-700">
          <div>
            <p className="font-semibold">Bên cho thuê</p>

            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">Ký và ghi rõ họ tên</p>
          </div>

          <div>
            <p className="font-semibold">Bên thuê</p>

            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              {contract.tenants?.name ?? "Ký và ghi rõ họ tên"}
            </p>
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
