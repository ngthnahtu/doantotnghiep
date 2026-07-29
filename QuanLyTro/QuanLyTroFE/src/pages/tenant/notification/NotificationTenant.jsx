import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

import { getNotificationsBell } from "../../../services/notificationService";
import { updateNotificationUser } from "../../../services/notificationUserService";

import ContentLayout from "../../../layouts/ContentLayout";
import Loading from "../../../components/common/Loading";
import Paginate from "../../../components/common/Paginate";
import { TableLayout, Tbody, Td, Th, Thead, Tr } from "../../../components/common/TableLayout";
import Toast from "../../../components/common/Toast";

import { formatDate } from "../../../utils/formatDate";

import NotificationView from "../../admin/notification/NotificationView";

const typeList = ["Chung", "Hợp đồng", "Hóa đơn", "Thanh toán"];

export default function NotificationTenant() {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);

      const response = await getNotificationsBell(page);

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

  const checkIsRead = (notification) => {
    return Number(notification.notification_users?.[0]?.is_read) === 1;
  };

  const handleView = async (notification) => {
    if (checkIsRead(notification)) {
      setViewing(notification);
      return;
    }

    try {
      await updateNotificationUser(notification.id);

      const updatedNotification = {
        ...notification,
        notification_users: [
          {
            notification_id: notification.id,
            is_read: true,
          },
        ],
      };

      setNotifications((previous) =>
        previous.map((item) => (item.id === notification.id ? updatedNotification : item)),
      );

      setViewing(updatedNotification);
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể đánh dấu đã đọc.",
      });

      setViewing(notification);
    }
  };

  if (isLoading && notifications.length === 0) {
    return <Loading />;
  }

  return (
    <>
      {toast && <Toast title={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ContentLayout title="Thông báo của tôi">
        <TableLayout>
          <Thead>
            <Tr>
              <Th>Tiêu đề</Th>
              <Th>Loại</Th>
              <Th>Ngày nhận</Th>
              <Th>Trạng thái</Th>
              <Th>#</Th>
            </Tr>
          </Thead>

          <Tbody>
            {notifications.length === 0 ? (
              <Tr>
                <Td colSpan={5} className="text-center">
                  Bạn chưa có thông báo.
                </Td>
              </Tr>
            ) : (
              notifications.map((notification) => {
                const isRead = checkIsRead(notification);

                return (
                  <Tr key={notification.id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        {!isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500"></span>}

                        <div className="min-w-0">
                          <p className={isRead ? "truncate font-normal" : "truncate font-semibold"}>
                            {notification.title}
                          </p>

                          <p className="max-w-md truncate text-xs text-slate-500 dark:text-slate-400">
                            {notification.content || "Không có nội dung"}
                          </p>
                        </div>
                      </div>
                    </Td>

                    <Td>{typeList[Number(notification.type)] || "Không xác định"}</Td>

                    <Td>{formatDate(notification.created_at)}</Td>

                    <Td>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-sm ${
                          isRead ? "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300" : "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300"
                        }`}
                      >
                        {isRead ? "Đã đọc" : "Chưa đọc"}
                      </span>
                    </Td>

                    <Td>
                      <button
                        type="button"
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => handleView(notification)}
                        title="Xem thông báo"
                      >
                        <Eye size={20} />
                      </button>
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </TableLayout>
      </ContentLayout>

      {/* Nằm ngoài ContentLayout để được đẩy xuống cuối */}
      <Paginate page={page} totalPage={totalPage} setPage={setPage} />

      {viewing && <NotificationView notification={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
