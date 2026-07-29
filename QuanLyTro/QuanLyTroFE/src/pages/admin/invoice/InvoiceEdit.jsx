import { useState } from "react";
import { MoveRight } from "lucide-react";

import Modal from "../../../components/common/Modal";
import Button from "../../../components/common/Button";
import Toast from "../../../components/common/Toast";
import { updateInvoice } from "../../../services/invoiceService";

export default function InvoiceEdit({
  editing,
  onClose,
}) {
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    note: editing.note ?? "",
    services: editing.invoice_details ?? [],
  });

  const handleChangeNote = (event) => {
    const { name, value } = event.target;

    setEditForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleChangeIndex = (index, value) => {
    const newServices = [...editForm.services];

    newServices[index] = {
      ...newServices[index],
      new_index: value,
    };

    setEditForm((previous) => ({
      ...previous,
      services: newServices,
    }));
  };

  const handleSave = async () => {
    const data = {
      note: editForm.note,

      services: editForm.services.map((service) => ({
        service_id: service.service_id,

        new_index:
          Number(service.services?.charge_type) === 1 &&
          service.new_index !== "" && service.new_index != null
            ? Number(service.new_index)
            : null,
      })),
    };

    try {
      setIsLoading(true);

      const response = await updateInvoice(
        editing.id,
        data
      );

      setToast({
        type: "success",
        message:
          response.data.message ||
          "Cập nhật hóa đơn thành công.",
      });

      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      setToast({
        type: "error",
        message:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Có lỗi xảy ra.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          type={toast.type}
          title={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <Modal
        title="Chỉnh sửa hóa đơn"
        isOpen={true}
        onClose={onClose}
      >
        <div className="flex flex-col gap-3 p-2">
          <div className="rounded-xl border border-slate-300 bg-slate-200 p-2 dark:border-slate-600 dark:bg-slate-800">
            <div>
              Mã hóa đơn:{" "}
              <span className="font-semibold">
                {editing.invoice_code}
              </span>
            </div>

            <div>
              Phòng:{" "}
              <span className="font-semibold">
                {editing.rooms?.room_name}
              </span>
            </div>

            <div>
              Khách hàng:{" "}
              <span className="font-semibold">
                {editing.contracts?.tenants?.name}
              </span>
            </div>

            <div>
              Kỳ hạn:{" "}
              <span className="font-semibold">
                {editing.bill_month}
              </span>
            </div>
          </div>

          <div className="rounded-xl border p-3 dark:border-slate-700">
            <p className="font-semibold">
              Chỉ số dịch vụ
            </p>

            <div className="grid grid-cols-4 gap-2 border-b p-2 text-center dark:border-slate-700">
              <span>Dịch vụ</span>
              <span>Số cũ</span>
              <span></span>
              <span>Số mới</span>
            </div>

            <div className="flex flex-col gap-2 p-2">
              {editForm.services.map((detail, index) =>
                Number(
                  detail.services?.charge_type
                ) === 1 ? (
                  <div
                    key={detail.id}
                    className="grid grid-cols-4 items-center gap-2"
                  >
                    <span className="font-medium">
                      {detail.service_name_snapshot}
                    </span>

                    <input
                      type="number"
                      value={detail.old_index ?? ""}
                      readOnly
                      className="w-full rounded-xl border bg-slate-100 p-1 text-center dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />

                    <div className="flex justify-center">
                      <MoveRight size={18} />
                    </div>

                    <input
                      type="number"
                      min={detail.old_index ?? 0}
                      value={detail.new_index ?? ""}
                      onChange={(event) =>
                        handleChangeIndex(
                          index,
                          event.target.value
                        )
                      }
                      className="w-full rounded-xl border p-1 text-center dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    />
                  </div>
                ) : null
              )}
            </div>
          </div>

          <div>
            <label
              htmlFor="note"
              className="font-semibold"
            >
              Ghi chú
            </label>

            <textarea
              id="note"
              name="note"
              rows={3}
              value={editForm.note}
              placeholder="Nhập ghi chú..."
              onChange={handleChangeNote}
              className="w-full rounded-xl border p-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              className="bg-slate-400 hover:bg-slate-600"
              onClick={onClose}
            >
              Hủy
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
            >
              {isLoading ? "Đang lưu..." : "Cập nhật"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
