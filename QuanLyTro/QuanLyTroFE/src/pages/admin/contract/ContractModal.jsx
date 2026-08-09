import Button from "../../../components/common/Button";
import Label from "../../../components/common/Label";
import Modal from "../../../components/common/Modal";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDate } from "../../../utils/formatDate";

export default function ContractModal({
  editingContract,
  isOpen,
  isSaving,
  onClose,
  handleSaveContract,
  handleServiceCheck,
  handleIndexChange,
  contractForm,
  handleFormChange,
  rooms,
  tenants,
  services,
}) {
  if (!isOpen) return null;
  return (
    <Modal
      title={editingContract !== null ? "Chỉnh sửa hợp đồng" : "Thêm hợp đồng mới"}
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-4xl"
    >
      <form onSubmit={handleSaveContract}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              {editingContract === null ? (
                <>
                  <div>
                    <Label htmlFor="room_id">Phòng</Label>

                    <select id="room_id" name="room_id" value={contractForm.room_id} onChange={handleFormChange} required
                      className="w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <option value="">-- Chọn phòng --</option>

                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.room_name} - {formatCurrency(room.base_price)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="tenant_id">Khách thuê</Label>

                    <select  id="tenant_id" name="tenant_id" value={contractForm.tenant_id} onChange={handleFormChange} required
                      className="w-full rounded-xl border border-slate-300 bg-white p-2
                      text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100
                      outline-none focus:border-blue-500">
                      <option value="">-- Chọn khách thuê --</option>

                      {tenants.map((tenant) => (
                        <option key={tenant.id} value={tenant.id}>
                          {tenant.name} - {tenant.phone}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Phòng</p>
                    <p className="font-medium">{editingContract.rooms?.room_name ?? "Không xác định"}</p>
                  </div>

                  <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Khách thuê</p>
                    <p className="font-medium">{editingContract.tenants?.name ?? "Không xác định"}</p>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Ngày bắt đầu</Label>

                {editingContract === null ? (
                  <input id="start_date" name="start_date" type="date" value={contractForm.start_date}
                    onChange={handleFormChange}required
                    className="w-full rounded-xl border border-slate-300 p-2 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                ) : (
                  <div className="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
                    <p className="font-medium">{formatDate(contractForm.start_date)}</p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="end_date">Ngày hết hạn</Label>

                <input id="end_date" name="end_date" type="date" value={contractForm.end_date}
                  onChange={handleFormChange} required
                  className="w-full rounded-xl border border-slate-300 p-2 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rent_price">Giá thuê (VND)</Label>

                {editingContract === null ? (
                  <input
                    id="rent_price" name="rent_price" type="number" min="0"
                    value={contractForm.rent_price}
                    onChange={handleFormChange} required
                    className="w-full rounded-xl border border-slate-300 p-2 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                ) : (
                  <div className="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
                    <p className="font-medium">{formatCurrency(contractForm.rent_price)}</p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="deposit">Tiền cọc (VND)</Label>

                {editingContract === null ? (
                  <input
                    id="deposit" name="deposit" type="number" min="0"
                    value={contractForm.deposit}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-xl border border-slate-300 p-2 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                ) : (
                  <div className="rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
                    <p className="font-medium">{formatCurrency(contractForm.deposit)}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="note">Ghi chú</Label>

              <textarea id="note" name="note" rows="2"
                value={contractForm.note}
                onChange={handleFormChange}
                placeholder="Nhập ghi chú nếu có..."
                className="w-full rounded-xl border border-slate-300 p-2 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-300 p-2 dark:border-slate-700">
            <Label>Dịch vụ</Label>

            <div className="mt-2 max-h-[300px] space-y-2 overflow-y-auto pr-2">
              {services.map((service) => {
                const selectedService = contractForm.services.find((item) => {
                  return Number(item.service_id) === Number(service.id);
                });

                return (
                  <div key={service.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
                    <input
                      className="h-4 w-4 shrink-0"
                      type="checkbox" checked={selectedService !== undefined}
                      onChange={(event) => {
                        handleServiceCheck(service, event.target.checked);
                      }}/>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{service.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatCurrency(service.price)}-{" "}
                        {service.charge_type == 0 ? "Cố định" : service.charge_type == 1 ? "Theo số" : "Theo đầu người"}
                      </p>
                    </div>

                    {selectedService && Number(service.charge_type) === 1 && (
                      <input
                        type="number"
                        min="0"
                        value={selectedService.current_index}
                        onChange={(event) => {
                          handleIndexChange(service.id, event.target.value);
                        }}
                        placeholder="Chỉ số cũ"
                        required
                        className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" className="bg-slate-500 hover:bg-slate-700" onClick={onClose} disabled={isSaving}>
            Hủy bỏ
          </Button>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Đang lưu..." : editingContract !== null ? "Cập nhật" : "Tạo hợp đồng"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
