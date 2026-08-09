import { useEffect, useState } from "react";
import { Eye, Pencil, Search, Trash2, X } from "lucide-react";

import { deleteIssue, getIssues, updateIssue } from "../../../services/issueService";

import { BACKEND_URL } from "../../../services/api";

import Button from "../../../components/common/Button";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import ContentLayout from "../../../layouts/ContentLayout";
import Label from "../../../components/common/Label";
import Loading from "../../../components/common/Loading";
import Modal from "../../../components/common/Modal";
import Paginate from "../../../components/common/Paginate";
import Toast from "../../../components/common/Toast";
import { TableLayout, Tbody, Td, Th, Thead, Tr } from "../../../components/common/TableLayout";

import { formatDate } from "../../../utils/formatDate";

const statusList = [
  {
    text: "Chờ tiếp nhận",
    color: "bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-300",
  },
  {
    text: "Đang xử lý",
    color: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    text: "Đã xử lý",
    color: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-300",
  },
];

export default function IssueList() {
  const [issues, setIssues] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);

  const [editForm, setEditForm] = useState({status: 0, note: "",});

  const [isSaving, setIsSaving] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [search, setSearch]= useState("");
  const [filter, setFilter]= useState("");

  useEffect(()=>{
    const timeout = setTimeout(()=>{
      setSearch(keyword.trim());
      setPage(1);
    },500);
    return ()=>clearTimeout(timeout);
  },[keyword]);

  const clearSearch = ()=>{
    setKeyword("");
    setSearch("");
    if(page!==1){
      setPage(1);
    }
  }

  useEffect(() => {
    fetchIssues();
  }, [page,search, filter]);

  const fetchIssues = async () => {
    try {
      setIsLoading(true);

      const response = await getIssues(page,search, filter);

      setIssues(response.data.data.data || []);
      setTotalPage(response.data.data.last_page || 1);
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể tải danh sách sự cố.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatus = (issue) => {
    return (
      statusList[Number(issue.status)] || {
        text: "Không xác định",
        color: "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
      }
    );
  };

  const getImageUrl = (imagePath) => {
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

  const openEdit = (issue) => {
    setEditing(issue);

    setEditForm({
      status: Number(issue.status),
      note: issue.note || "",
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setIsSaving(true);

      const response = await updateIssue(editing.id, {
        status: Number(editForm.status),
        note: editForm.note,
      });

      setToast({
        type: "success",
        message: response.data.message || "Cập nhật sự cố thành công.",
      });

      setEditing(null);

      await fetchIssues();
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể cập nhật sự cố.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;

    try {
      setIsDeleting(true);

      const response = await deleteIssue(deleting.id);

      setToast({
        type: "success",
        message: response.data.message || "Xóa sự cố thành công.",
      });

      setDeleting(null);

      if (issues.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await fetchIssues();
      }
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể xóa sự cố.",
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
        message={deleting ? `Bạn có chắc muốn xóa sự cố ${deleting.title} không?` : ""}
        isOpen={deleting !== null}
        loading={isDeleting}
        onCancel={() => {
          if (!isDeleting) {
            setDeleting(null);
          }
        }}
        onConfirm={handleDelete}
      />

      <ContentLayout
        title="Quản lý sự cố"
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
            <option value="0">Chờ tiếp nhận</option>
            <option value="1">Đang xử lý</option>
            <option value="2">Đã xử lý</option>
          </select>
        }
      >
        <TableLayout>
          <Thead>
            <Tr>
              <Th>Tiêu đề</Th>
              <Th>Phòng</Th>
              <Th>Khách thuê</Th>
              <Th>Ngày gửi</Th>
              <Th>Trạng thái</Th>
              <Th>#</Th>
            </Tr>
          </Thead>

          <Tbody>
            {isLoading ? (
              <Tr>
                <td className="text-center" colSpan={6}>
                  <Loading />
                </td>
              </Tr>
            ) : issues.length === 0 ? (
              <Tr>
                <td className="text-center p-4 text-lg" colSpan={6}>Chưa có sự cố</td>
              </Tr>
            ) : (
              issues.map((issue) => {
                const status = getStatus(issue);

                return (
                  <Tr key={issue.id}>
                    <Td>{issue.title}</Td>

                    <Td>{issue.rooms?.room_name || issue.room_id}</Td>

                    <Td>{issue.tenants?.name || issue.tenant_id}</Td>

                    <Td>{formatDate(issue.created_at)}</Td>

                    <Td>
                      <span className={`inline-block rounded-xl px-3 py-1 text-sm font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </Td>

                    <Td>
                      <div className="flex justify-center gap-6">
                        <button
                          type="button"
                          title="Xem chi tiết"
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => setViewing(issue)}
                        >
                          <Eye size={20} />
                        </button>

                        <button
                          type="button"
                          title="Cập nhật"
                          className="text-yellow-500 hover:text-yellow-700"
                          onClick={() => openEdit(issue)}
                        >
                          <Pencil size={20} />
                        </button>

                        <button
                          type="button"
                          title="Xóa"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => setDeleting(issue)}
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
      </ContentLayout>

      <Paginate page={page} totalPage={totalPage} setPage={setPage} />

      {viewing && (
        <Modal title="Chi tiết sự cố" isOpen={viewing !== null} onClose={() => setViewing(null)} className="max-w-4xl">
          <div className="flex gap-5">
            {viewing.proof_image ? (
              <img
                src={getImageUrl(viewing.proof_image)}
                alt="Hình ảnh sự cố"
                className="h-60 w-60 shrink-0 rounded-xl object-cover dark:border-slate-700"
              />
            ) : (
              <div className="flex h-60 w-60 shrink-0 items-center justify-center rounded-xl border bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                Sự cố chưa có hình ảnh
              </div>
            )}

            <div className="grid min-w-0 flex-1 grid-cols-2 gap-4">
              <div className="min-w-0">
                <Label>Tiêu đề</Label>
                <p className="break-words">{viewing.title}</p>
              </div>

              <div>
                <Label>Trạng thái</Label>
                <p>{getStatus(viewing).text}</p>
              </div>

              <div>
                <Label>Phòng</Label>
                <p>{viewing.rooms?.room_name || viewing.room_id}</p>
              </div>

              <div>
                <Label>Khách thuê</Label>
                <p>{viewing.tenants?.name || viewing.tenant_id}</p>
              </div>

              <div className="col-span-2 min-w-0">
                <Label>Mô tả</Label>
                <p className="whitespace-pre-wrap break-words">{viewing.description || "Không có mô tả."}</p>
              </div>

              <div className="col-span-2 min-w-0">
                <Label>Ghi chú</Label>
                <p className="whitespace-pre-wrap break-words">{viewing.note || "Chưa có ghi chú."}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" className="bg-slate-500 hover:bg-slate-700" onClick={() => setViewing(null)}>
              Đóng
            </Button>
          </div>
        </Modal>
      )}

      {editing && (
        <Modal
          title="Cập nhật sự cố"
          isOpen={editing !== null}
          onClose={() => {
            if (!isSaving) {
              setEditing(null);
            }
          }}
          className="max-w-xl"
        >
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <Label>Tiêu đề</Label>
              <p>{editing.title}</p>
            </div>

            <div>
              <Label htmlFor="status">Trạng thái</Label>

              <select
                id="status"
                value={editForm.status}
                onChange={(event) =>
                  setEditForm((previous) => ({
                    ...previous,
                    status: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value={0}>Chờ tiếp nhận</option>
                <option value={1}>Đang xử lý</option>
                <option value={2}>Đã xử lý</option>
              </select>
            </div>

            <div>
              <Label htmlFor="note">Ghi chú</Label>

              <textarea
                id="note"
                value={editForm.note}
                onChange={(event) =>
                  setEditForm((previous) => ({
                    ...previous,
                    note: event.target.value,
                  }))
                }
                rows={3}
                maxLength={255}
                placeholder="Nhập ghi chú xử lý..."
                className="w-full rounded-xl border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                className="bg-slate-500 hover:bg-slate-700"
                onClick={() => setEditing(null)}
                disabled={isSaving}
              >
                Hủy
              </Button>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Cập nhật"}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
