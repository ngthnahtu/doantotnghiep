import { useEffect, useState } from "react";
import { Bell, Eye, List, Pencil, Trash2 } from "lucide-react";

import { deleteNotification, getNotifications, getNotificationsBell } from "../../../services/notificationService";

import Button from "../../../components/common/Button";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Loading from "../../../components/common/Loading";
import Paginate from "../../../components/common/Paginate";
import { TableLayout, Tbody, Td, Th, Thead, Tr } from "../../../components/common/TableLayout";
import Toast from "../../../components/common/Toast";
import ContentLayout from "../../../layouts/ContentLayout";
import { formatDate } from "../../../utils/formatDate";

import NotificationFormModal from "./NotificationFormModal";
import NotificationView from "./NotificationView";

const typeList = ["Chung", "Hợp đồng", "Hóa đơn", "Thanh toán"];

export default function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [view, setView] = useState("bell");

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);

  const [deleting, setDeleting] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [page, view]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);

      const response = view === "manage" ? await getNotifications(page) : await getNotificationsBell(page);

      setNotifications(response.data.data.data || []);
      setTotalPage(response.data.data.last_page || 1);
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể tải danh sách thông báo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const changeView = (selectedView) => {
    // Chuyển tab thì quay về trang đầu.
    setView(selectedView);
    setPage(1);
  };

  const openCreate = () => {
    setEditing(null);
    setIsFormOpen(true);
  };

  const openEdit = (notification) => {
    setEditing(notification);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditing(null);
  };

  const handleSaved = async (message) => {
    setToast({
      type: "success",
      message,
    });

    await fetchNotifications();
  };

  const handleDelete = async () => {
    if (!deleting) return;

    try {
      setIsDeleting(true);

      await deleteNotification(deleting.id);

      setToast({
        type: "success",
        message: "Xóa thông báo thành công.",
      });

      setDeleting(null);

      if (notifications.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await fetchNotifications();
      }
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể xóa thông báo.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {toast && <Toast title={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ConfirmDialog
        title="Xác nhận xóa?"
        message={deleting ? `Bạn có chắc muốn xóa thông báo "${deleting.title}" không?` : ""}
        isOpen={deleting !== null}
        onConfirm={handleDelete}
        onCancel={() => {
          if (!isDeleting) {
            setDeleting(null);
          }
        }}
        loading={isDeleting}
      />

      <ContentLayout
        title="Quản lý thông báo"
        action={view === "manage" ? <Button onClick={openCreate}>Thêm mới</Button> : null}
      >
        {/* Hai nút chuyển chế độ xem */}
        <div className="mb-4 flex gap-3 border-b pb-3 dark:border-slate-700">
          <button
            type="button"
            onClick={() => changeView("bell")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
              view === "bell" ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <Bell size={17} />
            Đã nhận
          </button>
          <button
            type="button"
            onClick={() => changeView("manage")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
              view === "manage" ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <List size={17} />
            Quản lý
          </button>
        </div>

        {isLoading ? (
          <Loading />
        ) : (
          <>
            <TableLayout>
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Tiêu đề</Th>
                  <Th>Loại</Th>
                  <Th>Đối tượng</Th>
                  <Th>Ngày tạo</Th>
                  <Th>#</Th>
                </Tr>
              </Thead>

              <Tbody>
                {notifications.length === 0 ? (
                  <Tr>
                    <Td colSpan={6} className="text-center">
                      Chưa có thông báo.
                    </Td>
                  </Tr>
                ) : (
                  notifications.map((notification) => (
                    <Tr key={notification.id}>
                      <Td>{notification.id}</Td>

                      <Td>
                        <p className="max-w-xs truncate font-medium" title={notification.title}>
                          {notification.title}
                        </p>
                      </Td>

                      <Td>{typeList[Number(notification.type)] || "Không xác định"}</Td>

                      <Td>{Number(notification.target_type) === 1 ? "Tất cả khách thuê" : "Người được chọn"}</Td>

                      <Td>{formatDate(notification.created_at)}</Td>

                      <Td>
                        <div className="flex justify-center gap-4">
                          <button
                            type="button"
                            className="text-blue-500 hover:text-blue-700"
                            onClick={() => setViewing(notification)}
                            title="Xem">
                            <Eye size={20} />
                          </button>

                          {/* Tab đã nhận chỉ được xem */}
                          {view === "manage" && (
                            <>
                              <button
                                type="button"
                                className="text-yellow-500 hover:text-yellow-700"
                                onClick={() => openEdit(notification)}
                                title="Sửa"
                              >
                                <Pencil size={18} />
                              </button>

                              <button
                                type="button"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => setDeleting(notification)}
                                title="Xóa"
                              >
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </TableLayout>

            
          </>
        )}
      </ContentLayout>
      
      <Paginate page={page} totalPage={totalPage} setPage={setPage} />

      {isFormOpen && (
        <NotificationFormModal
          isOpen={isFormOpen}
          editing={editing}
          onClose={closeForm}
          onSaved={handleSaved}
          setToast={setToast}
        />
      )}

      {viewing && <NotificationView notification={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
