import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import Label from "../../../components/common/Label";
import Modal from "../../../components/common/Modal";

export default function RoomModal({
  editingRoomId,
  onClose,
  onSubmit,
  onChange,
  roomForm,
  isSaving,
  isOpen,
  handleImageChange,
}) {
  if (!isOpen) return null;

  return (
    <Modal title={editingRoomId === null ? "Thêm phòng mới" : `Chỉnh sửa phòng`} isOpen={true} onClose={onClose}>
      <form onSubmit={onSubmit}>
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="room_name">Tên phòng</Label>

              <Input
                id="room_name"
                name="room_name"
                value={roomForm.room_name}
                onChange={onChange}
                placeholder="Ví dụ: P101"
                required
              />
            </div>

            <div>
              <Label htmlFor="floor">Tầng</Label>
              <Input
                id="floor"
                name="floor"
                type="number"
                value={roomForm.floor}
                onChange={onChange}
                placeholder="Ví dụ: 1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label htmlFor="area">
                Diện tích (m<sup>2</sup>)
              </Label>

              <Input
                id="area"
                name="area"
                type="number"
                value={roomForm.area}
                onChange={onChange}
                placeholder="Ví dụ: 22"
                required
              />
            </div>

            <div>
              <Label htmlFor="base_price">Giá thuê</Label>

              <Input
                id="base_price"
                name="base_price"
                type="number"
                value={roomForm.base_price}
                onChange={onChange}
                placeholder="Ví dụ: 2000000"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Trạng thái</Label>

              <select
                id="status"
                name="status"
                value={roomForm.status}
                onChange={onChange}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value={0}>Trống</option>
                <option value={1}>Đang thuê</option>
                <option value={2}>Bảo trì</option>
              </select>
            </div>

            <div>
              <Label htmlFor="image">Hình ảnh</Label>

              <Input id="image" name="image" type="file" onChange={handleImageChange} accept="image/*" />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Mô tả</Label>

            <textarea
              id="description"
              name="description"
              value={roomForm.description}
              onChange={onChange}
              className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" className="bg-slate-500 hover:bg-slate-700" onClick={onClose}>
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Đang lưu..." : editingRoomId === null ? "Thêm phòng mới" : "Cập nhật"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
