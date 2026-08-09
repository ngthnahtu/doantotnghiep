import { useEffect, useState } from "react";
import { Eye, Search, X } from "lucide-react";

import { createIssue, getIssues } from "../../../services/issueService";

import { BACKEND_URL } from "../../../services/api";

import Button from "../../../components/common/Button";
import ContentLayout from "../../../layouts/ContentLayout";
import Input from "../../../components/common/Input";
import Label from "../../../components/common/Label";
import Loading from "../../../components/common/Loading";
import Modal from "../../../components/common/Modal";
import Paginate from "../../../components/common/Paginate";
import Toast from "../../../components/common/Toast";
import { TableLayout, Tbody, Td, Th, Thead, Tr } from "../../../components/common/TableLayout";

import { formatDate } from "../../../utils/formatDate";

const initialForm = {
  title: "",
  description: "",
  proof_image: null,
};

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

export default function IssueTenant() {
  const [issues, setIssues] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [viewing, setViewing] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [isSaving, setIsSaving] = useState(false);

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
    fetchIssues();
  }, [page, search, filter]);

  const fetchIssues = async () => {
    try {
      setIsLoading(true);

      const response = await getIssues(page, keyword, filter);

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

  const handleChange = (event) => {
    const { name, value, files } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: files ? files[0] : value,
    }));
  };

  const closeForm = () => {
    if (isSaving) return;

    setForm(initialForm);
    setIsFormOpen(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setIsSaving(true);

      const data = new FormData();
      data.append("title", form.title);
      data.append("description", form.description);

      if (form.proof_image) {
        data.append("proof_image", form.proof_image);
      }

      const response = await createIssue(data);

      setToast({
        type: "success",
        message: response.data.message || "Gửi báo cáo sự cố thành công.",
      });

      setForm(initialForm);
      setIsFormOpen(false);

      await fetchIssues();
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.error || error.response?.data?.message || "Không thể gửi báo cáo sự cố.",
      });
    } finally {
      setIsSaving(false);
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

  return (
    <>
      {toast && <Toast title={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ContentLayout
        title="Sự cố của tôi"
        action={<Button onClick={() => setIsFormOpen(true)}>Báo sự cố</Button>}
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
              <Th>Ngày gửi</Th>
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
            ) : issues.length === 0 ? (
              <Tr>
                <td className="text-center text-lg p-3" colSpan={5}>
                  Bạn chưa báo cáo sự cố nào.
                </td>
              </Tr>
            ) : (
              issues.map((issue) => {
                const status = getStatus(issue);

                return (
                  <Tr key={issue.id}>
                    <Td>{issue.title}</Td>

                    <Td>{formatDate(issue.created_at)}</Td>

                    <Td>
                      <span className={`inline-block rounded-xl px-3 py-1 text-sm font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </Td>

                    <Td>
                      <button
                        type="button"
                        title="Xem chi tiết"
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => setViewing(issue)}
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

      {isFormOpen && (
        <Modal title="Báo cáo sự cố" isOpen={isFormOpen} onClose={closeForm} className="max-w-xl">
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="title">Tiêu đề</Label>

              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Ví dụ: Hỏng bóng đèn"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>

              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                maxLength={255}
                placeholder="Mô tả sự cố..."
                className="w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div>
              <Label htmlFor="proof_image">Hình ảnh</Label>

              <input
                id="proof_image"
                name="proof_image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-300 p-2 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" className="bg-slate-500 hover:bg-slate-700" onClick={closeForm} disabled={isSaving}>
                Hủy
              </Button>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Đang gửi..." : "Gửi báo cáo"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {viewing && (
        <Modal title="Chi tiết sự cố" isOpen={viewing !== null} onClose={() => setViewing(null)} className="max-w-xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tiêu đề</Label>
              <p>{viewing.title}</p>
            </div>

            <div>
              <Label>Mô tả</Label>
              <p>{viewing.description || "Không có mô tả."}</p>
            </div>

            <div>
              <Label>Trạng thái</Label>
              <p>{getStatus(viewing).text}</p>
            </div>

            <div>
              <Label>Ghi chú của quản trị viên</Label>
              <p>{viewing.note || "Chưa có ghi chú."}</p>
            </div>

            {viewing.proof_image && (
              <div className="col-span-2">
                <Label>Hình ảnh</Label>

                <img
                  src={getImageUrl(viewing.proof_image)}
                  alt="Hình ảnh sự cố"
                  className="mt-1 max-h-64 rounded-xl object-contain dark:border-slate-700"
                />
              </div>
            )}

            <div className="col-span-2 flex justify-end border-t pt-4 dark:border-slate-700">
              <Button type="button" className="bg-slate-500 hover:bg-slate-700" onClick={() => setViewing(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
