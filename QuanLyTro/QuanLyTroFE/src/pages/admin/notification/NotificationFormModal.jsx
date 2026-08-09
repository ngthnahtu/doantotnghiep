import { useEffect, useState } from "react";

import { createNotification, getNotificationUsers, updateNotification } from "../../../services/notificationService";

import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import Label from "../../../components/common/Label";
import Modal from "../../../components/common/Modal";

const initialForm = { title: "", content: "", type: 0, target_type: true, user_id: [] };

export default function NotificationFormModal({ isOpen, editing, onClose, onSaved, setToast }) {
  const [form, setForm] = useState(initialForm);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title || "",
        content: editing.content || "",
        type: editing.type || 0,
        target_type: Boolean(editing.target_type),
        user_id: [],
      });
    } else {
      setForm(initialForm);
    }
  }, [editing, isOpen]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await getNotificationUsers();
        setUsers(response.data.data);
      } catch (error) {
        setToast({
          type: "error",
          message: "Không thể tải danh sách người dùng.",
        });
      }
    };
    if (form.target_type === false && users.length === 0) {
      loadUser();
    }
  }, [form.target_type]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm({
      ...form,
      [name]: name === "target_type" ? value === "true" : value,
    });
  };

  const handleUserCheck = (userId) => {
    const userIds = form.user_id.includes(userId)
      ? 
      form.user_id.filter((id) => id !== userId)
      : 
      [...form.user_id, userId];

    setForm({
      ...form,
      user_id: userIds,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!editing && form.target_type === false && form.user_id.length === 0) {
      setToast({
        type: "error",
        message: "Vui lòng chọn người nhận.",
      });

      return;
    }

    const data = {
      title: form.title,
      content: form.content,
      type: Number(form.type),
      target_type: form.target_type,
    };
    if (form.target_type === false) {
      data.user_id = form.user_id;
    }

    try {
      setLoading(true);

      if (editing) {
        await updateNotification(editing.id, data);

        onSaved("Cập nhật thông báo thành công.");
      } else {
        await createNotification(data);

        onSaved("Thêm thông báo thành công.");
      }
      onClose();
    } catch (error) {
      let message = "Không thể lưu thông báo.";

      if (error.response && error.response.data) {
        if (error.response.data.message) {
          message = error.response.data.message;
        }
      }

      setToast({
        type: "error",
        message: message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={editing ? "Chỉnh sửa thông báo" : "Thêm thông báo"}
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <Label htmlFor="title">Tiêu đề</Label>

          <Input
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Nhập tiêu đề"
            required
          />
        </div>

        <div>
          <Label htmlFor="content">Nội dung</Label>

          <textarea
            id="content"
            name="content"
            value={form.content}
            onChange={handleChange}
            placeholder="Nhập nội dung"
            rows={3}
            className="w-full rounded-lg border p-2 dark:bg-slate-800"
            required
          />
        </div>

        <div>
          <Label htmlFor="type">Loại thông báo</Label>

          <select
            id="type"
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full rounded-lg border p-2 dark:bg-slate-800"
          >
            <option value={0}>Thông báo chung</option>
            <option value={1}>Hợp đồng</option>
            <option value={2}>Hóa đơn</option>
            <option value={3}>Thanh toán</option>
            <option value={4}>Sự cố</option>
          </select>
        </div>

        <div>
          <Label htmlFor="target_type">Đối tượng nhận</Label>

          <select
            id="target_type"
            name="target_type"
            value={String(form.target_type)}
            onChange={handleChange}
            disabled={editing ? true : false}
            className="w-full rounded-lg border p-2 dark:bg-slate-800"
          >
            <option value="true">Tất cả khách thuê</option>
            <option value="false">Chọn người nhận</option>
          </select>
        </div>

        {form.target_type === false && !editing && (
          <div className="max-h-40 overflow-y-auto border p-2">
            {users.length === 0 && <p className="text-sm text-gray-500">Không có người nhận.</p>}

            {users.map((user) => {
              return (
                <label key={user.id} className="flex items-center gap-2 py-1 textx-center">
                  <input
                    type="checkbox"
                    checked={form.user_id.includes(user.id)}
                    onChange={() => handleUserCheck(user.id)}
                  />

                  <span>
                    {user.tenants && user.tenants.name ? user.tenants.name : user.email}
                    {" - "}
                    {user.email}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button className="bg-slate-500 hover:bg-slate-700" type="button" onClick={onClose}>
            Hủy
          </Button>

          <Button type="submit" disabled={loading}>
            {loading ? "Đang lưu..." : editing ? "Cập nhật" : "Thêm mới"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
