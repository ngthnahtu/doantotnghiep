import Modal from "../../../components/common/Modal";
import { BACKEND_URL } from "../../../services/api";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDateTime } from "../../../utils/formatDateTime";

const statusList = ["Trống", "Đang thuê", "Bảo trì"];

export default function RoomView({ viewingRoom, onClose }) {
  if (!viewingRoom) return null;

  return (
    <Modal title={`Chi tiết phòng ${viewingRoom.room_name}`} isOpen={true} onClose={onClose} className="max-w-4xl">
      <div className="flex gap-5">
        {viewingRoom.image ? (
          <img
            src={getRoomImageUrl(viewingRoom.image)}
            alt={`Phòng ${viewingRoom.room_name}`}
            className="h-60 w-60 shrink-0 rounded-lg border object-cover dark:border-slate-700"
          />
        ) : (
          <div className="flex h-60 w-60 shrink-0 items-center justify-center rounded-lg border bg-slate-100 p-4 text-center text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            Phòng chưa có hình ảnh
          </div>
        )}

        <div className="grid flex-1 grid-cols-2 gap-4">
          <RoomInfo label="ID" value={viewingRoom.id} />

          <RoomInfo label="Tên phòng" value={viewingRoom.room_name} />

          <RoomInfo label="Tầng" value={viewingRoom.floor ?? "Chưa cập nhật"} />

          <RoomInfo
            label="Diện tích"
            value={
              viewingRoom.area !== null && viewingRoom.area !== undefined ? `${viewingRoom.area} m²` : "Chưa cập nhật"
            }
          />

          <RoomInfo label="Giá thuê" value={formatCurrency(viewingRoom.base_price)} />

          <RoomInfo label="Trạng thái" value={statusList[Number(viewingRoom.status)] || "Không xác định"} />

          <RoomInfo label="Ngày tạo" value={formatDateTime(viewingRoom.created_at)} />

          <RoomInfo label="Cập nhật lần cuối" value={formatDateTime(viewingRoom.updated_at)} />
        </div>
      </div>

      <div className="border-t pt-3 dark:border-slate-700">
        <RoomInfo label="Mô tả" value={viewingRoom.description || "Không có mô tả"} />
      </div>
    </Modal>
  );
}

function RoomInfo({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>

      <p className="whitespace-pre-wrap break-words font-medium">{value}</p>
    </div>
  );
}

const getRoomImageUrl = (imagePath) => {
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
