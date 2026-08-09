import { useEffect, useState } from "react";
import { Bell, Eye, List, Pencil, Search, Trash2, X } from "lucide-react";

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
import { updateNotificationUser } from "../../../services/notificationUserService";

const typeList = ["Chung", "Hợp đồng", "Hóa đơn", "Thanh toán", "Sự cố"];

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

  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(keyword.trim());
      setPage(1);
    }, 500);
    return () => clearTimeout(timeout);
  }, [keyword]);

  const clearSearch = () => {
    setKeyword("");
    setSearch("");
    if (page !== 1) {
      setPage(1);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, search, view, filter]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response =
        view === "manage"
          ? await getNotifications(page, search, filter)
          : await getNotificationsBell(page, search, filter);
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

  const checkRead = (notification) => {
    return Number(notification?.notification_users?.[0]?.is_read) === 1;
  };

  const handleView = async (notification) => {
    if (view === "manage") {
      setViewing(notification);
      return;
    }
    if (checkRead(notification)) {
      setViewing(notification);
      return;
    }
    try {
      await updateNotificationUser(notification.id);
      await fetchNotifications();
      setViewing(notification);
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể đánh dấu đã đọc.",
      });
      setViewing(notification);
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
        toolbar={
          <div
            className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 w-50 h-8
          dark:border-slate-600 dark:bg-slate-800"
          >
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full text-sm outline-none dark:bg-slate-800 dark:text-slate-100"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            {keyword && (
              <button onClick={clearSearch}>
                <X />
              </button>
            )}
          </div>
        }
        filter={
          <select
            name="filter"
            id="filter"
            onChange={(event) => {
              setFilter(event.target.value);
              setPage(1);
            }}
            value={filter}
            className="text-center border border-slate-300 rounded-lg
            dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="">Toàn bộ</option>
            <option value="0">Chung</option>
            <option value="1">Hợp đồng</option>
            <option value="2">Hóa đơn</option>
            <option value="3">Thanh toán</option>
            <option value="4">Sự cố</option>
          </select>
        }
      >
        <div className="mb-4 flex gap-3 border-b pb-3 dark:border-slate-700">
          <button
            type="button"
            onClick={() => {
              setFilter("");
              changeView("bell");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
              view === "bell"
                ? "bg-blue-500 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            <Bell size={17} />
            Đã nhận
          </button>

          <button
            type="button"
            onClick={() => {
              setFilter("");
              changeView("manage");
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 ${
              view === "manage"
                ? "bg-blue-500 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
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
                  <Th>Tiêu đề</Th>
                  <Th>Loại</Th>
                  <Th>Đối tượng</Th>
                  <Th>Ngày tạo</Th>
                  {view === "bell" && <Th>Trạng thái</Th>}
                  <Th>#</Th>
                </Tr>
              </Thead>

              <Tbody>
                {notifications.length === 0 ? (
                  <Tr>
                    <td colSpan={5} className="text-center text-lg p-3">
                      Chưa có thông báo.
                    </td>
                  </Tr>
                ) : (
                  notifications.map((notification) => {
                    const isRead = checkRead(notification);
                    return (
                      <Tr key={notification.id}>
                        <Td>
                          <div className="flex items-center gap-2 pl-4">
                            {view === "bell" && !isRead && (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-red-500"></span>
                            )}
                            <p
                              className={
                                view === "manage"
                                  ? "truncate font-normal"
                                  : isRead
                                    ? "truncate font-normal"
                                    : "truncate font-bold"
                              }
                            >
                              {notification.title}
                            </p>
                          </div>
                        </Td>

                        <Td>{typeList[Number(notification.type)] || "Không xác định"}</Td>

                        <Td>{Number(notification.target_type) === 1 ? "Tất cả khách thuê" : "Tùy chọn"}</Td>

                        <Td>{formatDate(notification.created_at)}</Td>

                        {view === "bell" && (
                          <Td>
                            <span
                              className={`inline-block rounded-full px-3 py-1 text-sm ${
                                isRead
                                  ? "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300"
                                  : "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
                              }`}
                            >
                              {isRead ? "Đã đọc" : "Chưa đọc"}
                            </span>
                          </Td>
                        )}

                        <Td>
                          <div className="flex justify-center gap-4">
                            <button
                              type="button"
                              className="text-blue-500 hover:text-blue-700"
                              onClick={() => handleView(notification)}
                              title="Xem"
                            >
                              <Eye size={20} />
                            </button>

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
                    );
                  })
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
