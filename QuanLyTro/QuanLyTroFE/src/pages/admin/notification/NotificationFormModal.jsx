import { useEffect, useState } from "react";

import { createNotification, getNotificationUsers, updateNotification } from "../../../services/notificationService";

import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import Label from "../../../components/common/Label";
import Modal from "../../../components/common/Modal";

const initialForm = {
  title: "",
  content: "",
  type: 0,
  target_type: true,
  user_id: [],
};

export default function NotificationFormModal({ isOpen, editing, onClose, onSaved, setToast }) {
  const [form, setForm] = useState(initialForm);
  const [users, setUsers] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const isEdit = editing !== null;

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title || "",
        content: editing.content || "",
        type: Number(editing.type),
        target_type: Number(editing.target_type) === 1,
        user_id: [],
      });
    } else {
      setForm(initialForm);
    }
  }, [editing, isOpen]);

  useEffect(() => {
    if (!form.target_type && users.length === 0) {
      fetchUsers();
    }
  }, [form.target_type]);

  const fetchUsers = async () => {
    try {
      const response = await getNotificationUsers();

      setUsers(response.data.data || []);
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể tải danh sách người nhận.",
      });
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: name === "target_type" ? value === "true" : value,
    }));
  };

  const handleUserCheck = (userId) => {
    setForm((previous) => {
      const isSelected = previous.user_id.includes(userId);

      return {
        ...previous,
        user_id: isSelected ? previous.user_id.filter((id) => id !== userId) : [...previous.user_id, userId],
      };
    });
  };

  const getTenantName = (user) => {
    if (Array.isArray(user.tenants)) {
      return user.tenants[0]?.name || user.email;
    }

    return user.tenants?.name || user.email;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isEdit && !form.target_type && form.user_id.length === 0) {
      setToast({
        type: "error",
        message: "Vui lòng chọn người nhận.",
      });

      return;
    }

    try {
      setIsSaving(true);

      if (isEdit) {
        // Backend update chỉ nhận ba trường.
        await updateNotification(editing.id, {
          title: form.title,
          content: form.content,
          type: Number(form.type),
        });
      } else {
        const data = {
          title: form.title,
          content: form.content,
          type: Number(form.type),
          target_type: form.target_type,
        };

        if (!form.target_type) {
          data.user_id = form.user_id;
        }

        await createNotification(data);
      }

      onClose();

      await onSaved(isEdit ? "Cập nhật thông báo thành công." : "Thêm thông báo thành công.");
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể lưu thông báo.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? "Chỉnh sửa thông báo" : "Thêm thông báo mới"}
      isOpen={isOpen}
      onClose={() => {
        if (!isSaving) {
          onClose();
        }
      }}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Hàng 1: Tiêu đề và loại thông báo */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="title">Tiêu đề</Label>

            <Input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Nhập tiêu đề"
              maxLength={191}
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
              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value={0}>Thông báo chung</option>
              <option value={1}>Hợp đồng</option>
              <option value={2}>Hóa đơn</option>
              <option value={3}>Thanh toán</option>
            </select>
          </div>
        </div>

        {/* Hàng 2: Nội dung */}
        <div>
          <Label htmlFor="content">Nội dung</Label>

          <textarea
            id="content"
            name="content"
            value={form.content}
            onChange={handleChange}
            placeholder="Nhập nội dung"
            maxLength={255}
            rows={1}
            className="w-full rounded-lg border border-slate-300 p-2 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          ></textarea>
        </div>

        {/* Hàng 3: Đối tượng nhận */}
        <div>
          <Label htmlFor="target_type">Đối tượng nhận</Label>

          <select
            id="target_type"
            name="target_type"
            value={String(form.target_type)}
            onChange={handleChange}
            disabled={isEdit}
            className="w-full rounded-lg border border-slate-300 bg-white p-2 disabled:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:disabled:bg-slate-700"
          >
            <option value="true">Tất cả khách thuê</option>

            <option value="false">Chọn người nhận</option>
          </select>
        </div>

        {/* Danh sách hiện ra khi chọn gửi riêng */}
        {!form.target_type && !isEdit && (
          <div className="rounded-lg border p-2 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <Label>Người nhận</Label>

              <span className="text-xs text-slate-500 dark:text-slate-400">Đã chọn: {form.user_id.length}</span>
            </div>

            <div className="mt-1 max-h-32 overflow-y-auto">
              {users.length === 0 ? (
                <p className="py-2 text-sm text-slate-500 dark:text-slate-400">Không có khách thuê.</p>
              ) : (
                users.map((user) => (
                  <label key={user.id} className="flex cursor-pointer items-center gap-2 border-b py-1 last:border-0 dark:border-slate-700">
                    <input
                      type="checkbox"
                      checked={form.user_id.includes(user.id)}
                      onChange={() => handleUserCheck(user.id)}
                    />

                    <span className="truncate text-sm">
                      {getTenantName(user)} - {user.email}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 border-t pt-3 dark:border-slate-700">
          <Button type="button" className="bg-slate-500 hover:bg-slate-700" onClick={onClose} disabled={isSaving}>
            Hủy
          </Button>

          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Đang lưu..." : isEdit ? "Cập nhật" : "Thêm mới"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
