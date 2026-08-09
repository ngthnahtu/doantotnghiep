import { useEffect, useState } from "react";
import { Eye, Search, X } from "lucide-react";

import { getNotificationsBell } from "../../../services/notificationService";
import { updateNotificationUser } from "../../../services/notificationUserService";

import ContentLayout from "../../../layouts/ContentLayout";
import Loading from "../../../components/common/Loading";
import Paginate from "../../../components/common/Paginate";
import { TableLayout, Tbody, Td, Th, Thead, Tr } from "../../../components/common/TableLayout";
import Toast from "../../../components/common/Toast";

import { formatDate } from "../../../utils/formatDate";

import NotificationView from "../../admin/notification/NotificationView";

const typeList = ["Chung", "Hợp đồng", "Hóa đơn", "Thanh toán", "Sự cố"];

export default function NotificationTenant() {
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [viewing, setViewing] = useState(null);

  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter]= useState("");

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
  }, [page, search, filter]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);

      const response = await getNotificationsBell(page, search, filter);

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
    //vi hasmany nen notification_users la mang, du no chi tra ve 1 ptu
    return Number(notification?.notification_users?.[0]?.is_read) === 1;
  };

  const handleView = async (notification) => {
    if (checkIsRead(notification)) {
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

      <ContentLayout
        title="Thông báo của tôi"
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
            {isLoading ? (
              <Tr>
                <td className="text-center" colSpan={5}>
                  <Loading />
                </td>
              </Tr>
            ) : notifications.length === 0 ? (
              <Tr>
                <td colSpan={5} className="text-center text-lg p-3">
                  Bạn chưa có thông báo.
                </td>
              </Tr>
            ) : (
              notifications.map((notification) => {
                const isRead = checkIsRead(notification);

                return (
                  <Tr key={notification.id}>
                    <Td>
                      <div className="flex items-center gap-2 pl-4">
                        {!isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-red-500"></span>}
                        <p className={isRead ? "truncate font-normal" : "truncate font-bold"}>{notification.title}</p>
                      </div>
                    </Td>

                    <Td>{typeList[Number(notification.type)] || "Không xác định"}</Td>

                    <Td>{formatDate(notification.created_at)}</Td>

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

      <Paginate page={page} totalPage={totalPage} setPage={setPage} />

      {viewing && <NotificationView notification={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
