import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../../components/common/Button";
import Label from "../../../components/common/Label";
import { TableLayout, Tbody, Td, Th, Thead, Tr } from "../../../components/common/TableLayout";
import ContentLayout from "../../../layouts/ContentLayout";
import Toast from "../../../components/common/Toast";
import Loading from "../../../components/common/Loading";

import { createInvoice, prepareInvoice } from "../../../services/invoiceService";
import { formatCurrency } from "../../../utils/formatCurrency";
import { MoveRight } from "lucide-react";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

export default function InvoiceCreate() {
  const navigate = useNavigate();

  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [billMonth, setBillMonth] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [invoiceRooms, setInvoiceRooms] = useState([]); 

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const handleLoadData = async (event) => {
    const month = event.target.value;

    setBillMonth(month);
    if (!month) {
      setInvoiceRooms([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await prepareInvoice(month);
      setInvoiceRooms(response.data.data ?? []);
    } catch (error) {
      setInvoiceRooms([]);
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể tải danh sách phòng.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [year, month] = billMonth.split("-");

  const handleNewIndexChange = (roomIndex, serviceIndex, value) => {
    const newRooms = [...invoiceRooms];
    newRooms[roomIndex].services[serviceIndex].new_index = value;
    setInvoiceRooms(newRooms);
  };

  const handleSaveInvoice = async () => {
    setIsConfirmDialogOpen(false);
    if (!billMonth) {
      setToast({ type: "error", message: "Vui lòng chọn tháng hóa đơn.", }); return;
    }

    if (!dueDate) {
      setToast({ type: "error", message: "Vui lòng chọn hạn thanh toán.",}); return;
    }

    if (invoiceRooms.length === 0) {
      setToast({ type: "error", message: "Không có phòng để lập hóa đơn.", }); return;
    }

    const newData = {
      bill_month: billMonth,
      due_date: dueDate,
      data: invoiceRooms.map((invoice) => ({
        contract_id: invoice.contract_id,
        room_id: invoice.room_id,
        services: invoice.services.map((service) => ({
          service_id: service.service_id,
          new_index: Number(service.charge_type) === 1 && service.new_index !== "" ? Number(service.new_index) : null,
        })),
      })),
    };

    try {
      setIsLoading(true);
      await createInvoice(newData);

      setToast({
        type: "success",
        message: "Phát hành hóa đơn hàng loạt thành công.",
      });

      setTimeout(() => {
        navigate("/admin/invoice");
      }, 300);
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.error || error.response?.data?.message || "Không thể lập hóa đơn.",
      });
      setIsLoading(false);
    }
  };

  return (
    <>
      {toast && <Toast type={toast.type} title={toast.message} onClose={() => setToast(null)} />}

      {isConfirmDialogOpen && (
        <ConfirmDialog
          title="Xác nhận lập hóa đơn."
          message={`Bạn có chắc muốn lập hóa đơn Tháng ${month}-${year} không?`}
          isOpen={true}
          onCancel={() => setIsConfirmDialogOpen(false)}
          onConfirm={handleSaveInvoice}
        />
      )}

      <ContentLayout title="Lập hóa đơn hàng loạt">
        <div className="flex flex-col gap-3">
          <div className="flex w-fit items-center gap-2 rounded-lg border p-2 dark:border-slate-700">
            <Label htmlFor="bill_month">Tháng:</Label>

            <input
              id="bill_month"
              type="month"
              value={billMonth}
              onChange={handleLoadData}
              className="rounded-lg border p-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            <TableLayout>
              <Thead>
                <Tr>
                  <Th>Phòng</Th>
                  <Th>Số người</Th>
                  <Th>Dịch vụ</Th>
                  <Th>Tiền phòng</Th>
                  <Th>Tạm tính</Th>
                </Tr>
              </Thead>

              <Tbody>
                {isLoading ? (
                  <Tr>
                    <td className="text-center" colSpan={5}>
                      <Loading />
                    </td>
                  </Tr>
                ) : invoiceRooms.length === 0 ? (
                  <Tr>
                    <td className="text-center p-3 text-lg" colSpan={5}>
                      {billMonth ? "Không có phòng cần lập hóa đơn." : "Vui lòng chọn tháng."}
                    </td>
                  </Tr>
                ) : (
                  invoiceRooms.map((room, roomIndex) => (
                    <Tr key={room.contract_id}>
                      <Td>{room.room_name}</Td>
                      <Td>{room.member_count} người</Td>

                      <Td>
                        <div className="mx-auto w-fit space-y-2">
                          {room.services.map((service, serviceIndex) => (
                            <div key={service.service_id} className="flex items-center gap-2">
                              <span className="w-16 text-left font-medium">{service.service_name}</span>

                              {Number(service.charge_type) === 0 && <span>{formatCurrency(service.unit_price)}</span>}

                              {Number(service.charge_type) === 2 && (
                                <span> {formatCurrency(service.unit_price)} x {room.member_count} </span>
                              )}

                              {Number(service.charge_type) === 1 && (
                                <div className="flex items-center gap-2">
                                  <input type="number" value={service.old_index ?? ""} readOnly
                                    className="h-8 w-16 rounded-lg border bg-gray-100 text-center dark:text-black"/>

                                  <MoveRight size={18} />

                                  <input type="number" value={service.new_index ?? ""} placeholder="Mới"
                                    onChange={(event) =>
                                      handleNewIndexChange(roomIndex, serviceIndex, event.target.value)
                                    }
                                    className="h-8 w-16 rounded-lg border text-center"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </Td>

                      <Td>{formatCurrency(room.room_price)}</Td>

                      <Td className="font-semibold text-blue-600 dark:text-blue-400">
                          {formatCurrency(
                          Number(room.room_price) +
                            room.services.reduce((total, service) => {
                              const type = Number(service.charge_type);
                              const price = Number(service.unit_price);

                              if (type === 0) {
                                return total + price;
                              }

                              if (type === 2) {
                                return total + price * Number(room.member_count);
                              }

                              if (type === 1 && service.new_index !== "" && service.new_index != null &&
                                Number(service.new_index) >= Number(service.old_index)
                              ) {
                                return total + ((Number(service.new_index) - Number(service.old_index)) * price);
                              }
                              return total;
                            }, 0),
                        )}
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </TableLayout>
          </div>

          <div className="flex items-end justify-between bg-white py-2 dark:bg-slate-900">
            <Button type="button" className="h-9 bg-gray-500 hover:bg-gray-600"
              onClick={() => navigate("/admin/invoice")}>
              Quay lại
            </Button>

            {invoiceRooms.length > 0 && (
              <div className="flex items-end gap-2">
                <div>
                  <Label htmlFor="due_date">Hạn thanh toán</Label>

                  <input id="due_date" type="date" value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="h-9 rounded-lg border px-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>

                <Button type="button" className="h-9" onClick={() => setIsConfirmDialogOpen(true)}>
                  Lưu hóa đơn
                </Button>
              </div>
            )}
          </div>
        </div>
      </ContentLayout>
    </>
  );
}
