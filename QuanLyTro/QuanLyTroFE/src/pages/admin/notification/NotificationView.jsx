import Button from "../../../components/common/Button";
import Label from "../../../components/common/Label";
import Modal from "../../../components/common/Modal";
import { formatDate } from "../../../utils/formatDate";

const typeList = ["Chung", "Hợp đồng", "Hóa đơn", "Thanh toán","Sự cố"];

export default function NotificationView({ notification, onClose }) {
  if (!notification) {
    return null;
  }

  return (
    <Modal title="Chi tiết thông báo" isOpen={notification !== null} onClose={onClose} className="max-w-xl">
      <div className="flex flex-col gap-4">
        <div>
          <Label>Tiêu đề</Label>
          <p>{notification.title}</p>
        </div>

        <div>
          <Label>Nội dung</Label>

          <p className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">{notification.content || "Không có nội dung"}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Loại thông báo</Label>

            <p>{typeList[Number(notification.type)] || "Không xác định"}</p>
          </div>

          <div>
            <Label>Đối tượng nhận</Label>

            <p>{Number(notification.target_type) === 1 ? "Tất cả khách thuê" : "Người được chọn"}</p>
          </div>
        </div>

        <div>
          <Label>Ngày tạo</Label>
          <p>{formatDate(notification.created_at)}</p>
        </div>

        <div className="flex justify-end">
          <Button type="button" className="bg-slate-500 hover:bg-slate-700" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
