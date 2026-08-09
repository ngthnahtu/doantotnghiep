import { useEffect, useState } from "react";
import { Eye, Pencil, Search, Trash2, X } from "lucide-react";
import Toast from "../../../components/common/Toast";
import Loading from "../../../components/common/Loading";
import Paginate from "../../../components/common/Paginate";
import Button from "../../../components/common/Button";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { TableLayout, Tbody, Td, Th, Thead, Tr } from "../../../components/common/TableLayout";
import ContentLayout from "../../../layouts/ContentLayout";
import { createRoom, deleteRoom, getRooms, updateRoom } from "../../../services/roomService";
import { formatCurrency } from "../../../utils/formatCurrency";
import RoomView from "./RoomView";
import RoomModal from "./RoomModal";
import { formatNumber } from "../../../utils/formatNumber";

const statusList = ["Trống", "Đang thuê", "Bảo trì"];

const initialRoomForm = { room_name: "", floor: "", base_price: "", area: "", status: 0, image: null, description: "" };

export default function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [roomForm, setRoomForm] = useState(initialRoomForm);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [viewingRoom, setViewingRoom] = useState(null);

  const [deletingRoom, setDeletingRoom] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setSearch(keyword.trim());
    }, 500);
    return () => clearTimeout(timeout);
  }, [keyword]);

  useEffect(() => {
    fetchRooms();
  }, [page, search, filter]);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);

      const response = await getRooms(page, search, filter);

      setRooms(response.data.data.data);
      setTotalPage(response.data.data.last_page);
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể tải danh sách phòng.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setKeyword("");
    if (page !== 1) {
      setPage(1);
    }
    setSearch("");
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setRoomForm((previousRoomForm) => ({
      ...previousRoomForm,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingRoomId(null);
    setRoomForm(initialRoomForm);
    setIsFormModalOpen(true);
  };

  const openEditModal = (selectedRoom) => {
    setEditingRoomId(selectedRoom.id);

    setRoomForm({
      room_name: selectedRoom.room_name ?? "",
      floor: selectedRoom.floor ?? "",
      base_price: selectedRoom.base_price ?? "",
      area: selectedRoom.area ?? "",
      status: selectedRoom.status ?? 0,
      image: null,
      description: selectedRoom.description ?? "",
    });

    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    if (isSaving) return;

    setIsFormModalOpen(false);
    setEditingRoomId(null);
    setRoomForm(initialRoomForm);
  };

  const handleSaveRoom = async (event) => {
    event.preventDefault();

    const isEditing = editingRoomId !== null;

    try {
      setIsSaving(true);

      const data = new FormData();

      data.append("room_name", roomForm.room_name);
      data.append("floor", roomForm.floor);
      data.append("base_price", roomForm.base_price);
      data.append("area", roomForm.area);
      data.append("status", roomForm.status);
      data.append("description", roomForm.description);

      if (roomForm.image) {
        data.append("image", roomForm.image);
      }

      if (isEditing) {
        await updateRoom(editingRoomId, data);
      } else {
        await createRoom(data);
      }

      setToast({
        type: "success",
        message: isEditing
          ? `Cập nhật phòng ${roomForm.room_name} thành công.`
          : `Thêm phòng ${roomForm.room_name} thành công.`,
      });

      setIsFormModalOpen(false);
      setEditingRoomId(null);
      setRoomForm(initialRoomForm);

      await fetchRooms();
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || (isEditing ? "Không thể cập nhật phòng." : "Không thể thêm phòng."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!deletingRoom) return;

    try {
      setIsDeleting(true);

      await deleteRoom(deletingRoom.id);

      setToast({
        type: "success",
        message: `Xóa phòng ${deletingRoom.room_name} thành công.`,
      });

      setDeletingRoom(null);

      if (rooms.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        await fetchRooms();
      }
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể xóa phòng.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setToast({
        type: "error",
        message: "Ảnh không được vượt quá 5 MB.",
      });
      event.target.value = "";
      return;
    }
    setRoomForm((previousRoomForm) => ({
      ...previousRoomForm,
      image: file,
    }));
  };

  return (
    <>
      <ConfirmDialog
        title="Xác nhận xóa phòng?"
        message={deletingRoom ? `Bạn có chắc muốn xóa phòng "${deletingRoom.room_name}" không?` : ""}
        isOpen={deletingRoom !== null}
        onCancel={() => {
          if (!isDeleting) {
            setDeletingRoom(null);
          }
        }}
        onConfirm={handleDeleteRoom}
        loading={isDeleting}
      />

      {toast && <Toast title={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {viewingRoom && <RoomView viewingRoom={viewingRoom} onClose={() => setViewingRoom(null)} />}

      <ContentLayout
        title="Quản lý phòng"
        action={<Button onClick={openCreateModal}>Thêm mới</Button>}
        toolbar={
          <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 w-50 dark:border-slate-600 dark:bg-slate-800">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full text-sm outline-none dark:bg-slate-800 dark:text-slate-100"
              value={keyword}
              onChange={(event) => {
                setKeyword(event.target.value);
              }}
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
            <option value="0">Trống</option>
            <option value="1">Đang thuê</option>
            <option value="2">Bảo trì</option>
          </select>
        }
      >
        <TableLayout>
          <Thead>
            <Tr>
              <Th>Tên phòng</Th>
              <Th>Tầng</Th>
              <Th>Diện tích (m²)</Th>
              <Th>Giá thuê</Th>
              <Th>Trạng thái</Th>
              <Th>#</Th>
            </Tr>
          </Thead>

          <Tbody>
            {isLoading ? (
              <Tr>
                <td className="text-center p-3" colSpan={6}>
                  <Loading />
                </td>
              </Tr>
            ) : rooms.length === 0 ? (
              <Tr>
                <td className="text-center p-3 text-lg" colSpan={6}>
                  Chưa có dữ liệu
                </td>
              </Tr>
            ) : (
              rooms.map((roomItem) => {
                const canDelete = roomItem.status !== 1;
                return (
                  <Tr key={roomItem.id}>
                    <Td>{roomItem.room_name}</Td>

                    <Td className="text-center">{roomItem.floor}</Td>

                    <Td className="text-center">{formatNumber(roomItem.area)}</Td>

                    <Td>{formatCurrency(roomItem.base_price)}</Td>

                    <Td>
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                          Number(roomItem.status) === 0
                            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : Number(roomItem.status) === 1
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                        }`}
                      >
                        {statusList[Number(roomItem.status)] || "Không xác định"}
                      </span>
                    </Td>

                    <Td>
                      <div className="flex items-center justify-center gap-10">
                        <button
                          type="button"
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => setViewingRoom(roomItem)}
                          title="Xem chi tiết"
                        >
                          <Eye size={20} />
                        </button>

                        <button
                          type="button"
                          className="text-yellow-500 hover:text-yellow-700"
                          onClick={() => openEditModal(roomItem)}
                          title="Chỉnh sửa"
                        >
                          <Pencil size={20} />
                        </button>

                        <button
                          type="button"
                          className="text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => setDeletingRoom(roomItem)}
                          disabled={!canDelete}
                          title="Xóa"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </TableLayout>

        {isFormModalOpen && (
          <RoomModal
            editingRoomId={editingRoomId}
            onClose={closeFormModal}
            onSubmit={handleSaveRoom}
            handleImageChange={handleImageChange}
            onChange={handleFormChange}
            roomForm={roomForm}
            isSaving={isSaving}
            isOpen={isFormModalOpen}
          />
        )}
      </ContentLayout>
      <Paginate page={page} totalPage={totalPage} setPage={setPage}></Paginate>
    </>
  );
}
