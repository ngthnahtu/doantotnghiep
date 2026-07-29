import { useEffect, useState } from "react";
import { createTenant, deleteTenant, getTenants, updateTenant } from "../../../services/tenantService";
import Loading from "../../../components/common/Loading";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Toast from "../../../components/common/Toast";
import ContentLayout from "../../../layouts/ContentLayout";
import Button from "../../../components/common/Button";
import { TableLayout, Tbody, Td, Th, Thead, Tr } from "../../../components/common/TableLayout";
import { formatDate } from "../../../utils/formatDate";
import { Eye, Pencil, Trash2 } from "lucide-react";
import Paginate from "../../../components/common/Paginate";
import Modal from "../../../components/common/Modal";
import Label from "../../../components/common/Label";
import Input from "../../../components/common/Input";
import TenantView from "./TenantView";

const initialTenantForm = {
  name: "",
  birth: "",
  gender: 0,
  address: "",
  phone: "",
  identity_number: "",
  status: 0,
  email: "",
  password: "",
  is_active: "1",
};

const genderList = ["Nam", "Nữ"];

const statusList = ["Chưa thuê", "Đang thuê", "Đã chuyển đi"];

export default function TenantList() {
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [tenants, setTenants] = useState([]);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [tenantForm, setTenantForm] = useState(initialTenantForm);
  const [editingTenantId, setEditingTenantId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deletingTenant, setDeletingTenant] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [viewingTenant, setViewingTenant] = useState(null);

  useEffect(() => {
    fetchTenant();
  }, [page]);

  const fetchTenant = async () => {
    try {
      setIsLoading(true);
      const response = await getTenants(page);

      setTenants(response.data.data.data);
      setTotalPage(response.data.data.last_page);
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể tải danh sách khách thuê.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setTenantForm((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingTenantId(null);
    setTenantForm(initialTenantForm);
    setIsFormModalOpen(true);
  };

  const openEditModal = (selectedTenant) => {
    setEditingTenantId(selectedTenant.id);

    setTenantForm({
      name: selectedTenant.name ?? "",
      birth: selectedTenant.birth ? selectedTenant.birth.slice(0, 10) : "",
      gender: selectedTenant.gender ?? 0,
      address: selectedTenant.address ?? "",
      phone: selectedTenant.phone ?? "",
      identity_number: selectedTenant.identity_number ?? "",
      email: selectedTenant.users?.email ?? "",
      password: "",
      status: Number(selectedTenant.status ?? 0),
      is_active: String(Number(selectedTenant.users?.is_active ?? 1)),
    });

    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    if (isSaving) return;

    setTenantForm(initialTenantForm);
    setEditingTenantId(null);
    setIsFormModalOpen(false);
  };

  const handleSaveTenant = async (event) => {
    event.preventDefault();

    const isEdit = editingTenantId !== null;

    try {
      setIsSaving(true);

      const data = {
        name: tenantForm.name,
        birth: tenantForm.birth,
        gender: Number(tenantForm.gender),
        address: tenantForm.address,
        phone: tenantForm.phone,
        identity_number: tenantForm.identity_number,
        email: tenantForm.email,
        status: Number(tenantForm.status),
        is_active: Number(tenantForm.is_active),
      };

      if (!isEdit || tenantForm.password) {
        data.password = tenantForm.password;
      }

      if (isEdit) {
        await updateTenant(editingTenantId, data);
      } else {
        await createTenant(data);
      }

      setToast({
        type: "success",
        message: isEdit
          ? `Cập nhật khách thuê ${tenantForm.name} thành công.`
          : `Thêm khách thuê ${tenantForm.name} thành công.`,
      });

      setEditingTenantId(null);
      setIsFormModalOpen(false);
      setTenantForm(initialTenantForm);

      await fetchTenant();
    } catch (error) {
      setToast({
        type: "error",
        message:
          error.response?.data?.message || (isEdit ? "Không thể cập nhật khách thuê." : "Không thể thêm khách thuê."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTenant = async () => {
    if (!deletingTenant) return;

    try {
      setIsDeleting(true);

      await deleteTenant(deletingTenant.id);

      setToast({
        type: "success",
        message: `Xóa khách thuê ${deletingTenant.name} thành công.`,
      });

      setDeletingTenant(null);

      if (tenants.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        await fetchTenant();
      }
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể xóa khách thuê.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <ConfirmDialog
        title="Xác nhận xóa?"
        message={deletingTenant ? `Bạn có chắc muốn xóa khách thuê ${deletingTenant.name} không?` : ""}
        isOpen={deletingTenant !== null}
        onCancel={() => {
          if (!isDeleting) {
            setDeletingTenant(null);
          }
        }}
        onConfirm={handleDeleteTenant}
        loading={isDeleting}
      />

      {toast && <Toast title={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ContentLayout title="Quản lý khách thuê" action={<Button onClick={openCreateModal}>Thêm mới</Button>}>
        <TableLayout>
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Tên</Th>
              <Th>Ngày sinh</Th>
              <Th>Giới tính</Th>
              <Th>Số điện thoại</Th>
              <Th>Trạng thái</Th>
              <Th>#</Th>
            </Tr>
          </Thead>

          <Tbody>
            {tenants.length === 0 ? (
              <Tr>
                <Td colSpan={7}>Chưa có dữ liệu</Td>
              </Tr>
            ) : (
              tenants.map((tenant) => (
                <Tr key={tenant.id}>
                  <Td>{tenant.id}</Td>

                  <Td>{tenant.name}</Td>

                  <Td>{formatDate(tenant.birth)}</Td>

                  <Td>{genderList[Number(tenant.gender)] || "Khác"}</Td>

                  <Td>{tenant.phone}</Td>

                  <Td>
                    <span
                      className={`inline-block rounded-xl px-3 py-1 ${
                        tenant.status === 0
                          ? "bg-green-100 text-green-500 font-medium dark:bg-green-950 dark:text-green-300"
                          : tenant.status === 1
                            ? "bg-blue-100 text-blue-500 font-medium dark:bg-blue-950 dark:text-blue-300"
                            : "bg-red-100 text-red-500 font-medium dark:bg-red-950 dark:text-red-300"
                      }`}
                    >
                      {tenant.status === 0 ? "Chưa thuê" : tenant.status === 1 ? "Đang thuê" : "Đã chuyển đi"}
                    </span>
                  </Td>

                  <Td>
                    <div className="flex justify-center gap-8">
                      <button
                        type="button"
                        title="Xem chi tiết"
                        className="text-blue-500 hover:text-blue-700"
                        onClick={() => setViewingTenant(tenant)}
                      >
                        <Eye size={20} />
                      </button>

                      <button
                        type="button"
                        title="Chỉnh sửa"
                        className="text-yellow-500 hover:text-yellow-700"
                        onClick={() => openEditModal(tenant)}
                      >
                        <Pencil size={20} />
                      </button>

                      <button
                        type="button"
                        title="Xóa"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setDeletingTenant(tenant)}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </TableLayout>
      </ContentLayout>

      <Paginate page={page} totalPage={totalPage} setPage={setPage}></Paginate>

      {isFormModalOpen && (
        <Modal
          title={editingTenantId !== null ? "Chỉnh sửa khách thuê" : "Thêm khách thuê mới"}
          isOpen={isFormModalOpen}
          onClose={closeFormModal}
          className="max-w-3xl"
        >
          <form onSubmit={handleSaveTenant}>
            <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-2">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="name">Họ và tên</Label>

                  <Input
                    id="name"
                    name="name"
                    value={tenantForm.name}
                    onChange={handleFormChange}
                    placeholder="Ví dụ: Nguyễn Văn A"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="birth">Ngày sinh</Label>

                  <Input
                    id="birth"
                    name="birth"
                    type="date"
                    value={tenantForm.birth}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Giới tính</Label>

                  <select
                    id="gender"
                    name="gender"
                    value={tenantForm.gender}
                    onChange={handleFormChange}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value={0}>Nam</option>

                    <option value={1}>Nữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="identity_number">CCCD/CMND</Label>

                  <Input
                    id="identity_number"
                    name="identity_number"
                    value={tenantForm.identity_number}
                    onChange={handleFormChange}
                    placeholder="Nhập số CCCD"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>

                  <Input
                    id="phone"
                    name="phone"
                    value={tenantForm.phone}
                    onChange={handleFormChange}
                    placeholder="Ví dụ: 0901234567"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>

                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={tenantForm.email}
                    onChange={handleFormChange}
                    placeholder="Ví dụ: nguyenvana@gmail.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="password">{editingTenantId === null ? "Mật khẩu đăng nhập" : "Mật khẩu mới"}</Label>

                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={tenantForm.password}
                    onChange={handleFormChange}
                    placeholder={editingTenantId === null ? "Nhập tối thiểu 6 ký tự" : "Chỉ nhập khi cần đổi"}
                    required={editingTenantId === null}
                  />
                </div>

                {editingTenantId !== null && (
                  <>
                    <div>
                      <Label htmlFor="status">Trạng thái thuê</Label>

                      <select
                        id="status"
                        name="status"
                        value={tenantForm.status}
                        onChange={handleFormChange}
                        required
                        className="w-full rounded-xl border border-slate-300 p-2 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value={0}>Chưa thuê</option>
                        <option value={1}>Đang thuê</option>
                        <option value={2}>Đã chuyển đi</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="is_active">Trạng thái tài khoản</Label>

                      <select
                        id="is_active"
                        name="is_active"
                        value={tenantForm.is_active}
                        onChange={handleFormChange}
                        required
                        className="w-full rounded-xl border border-slate-300 p-2 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <option value="1">Đang hoạt động</option>
                        <option value="0">Khóa tài khoản</option>
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div>
                <Label htmlFor="address">Địa chỉ</Label>

                <textarea
                  id="address"
                  name="address"
                  value={tenantForm.address}
                  onChange={handleFormChange}
                  placeholder="Nhập địa chỉ thường trú"
                  rows={2}
                  required
                  className="w-full rounded-xl border border-slate-300 p-2 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" className="bg-slate-500 hover:bg-slate-700" onClick={closeFormModal}>
                  Hủy bỏ
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Đang lưu..." : editingTenantId === null ? "Thêm khách thuê" : "Cập nhật"}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {viewingTenant && <TenantView viewingTenant={viewingTenant} onClose={() => setViewingTenant(null)} />}
    </>
  );
}
