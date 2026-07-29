import { useEffect, useState } from "react";
import { createService, deleteService, getServices, updateService } from "../../../services/serviceService";
import Toast from "../../../components/common/Toast";
import ContentLayout from "../../../layouts/ContentLayout";
import Button from "../../../components/common/Button";
import { TableLayout, Tbody, Td, Th, Thead, Tr } from "../../../components/common/TableLayout";
import { formatCurrency } from "../../../utils/formatCurrency";
import { Pencil, Trash2 } from "lucide-react";
import Loading from "../../../components/common/Loading";
import Paginate from "../../../components/common/Paginate";
import Modal from "../../../components/common/Modal";
import Label from "../../../components/common/Label";
import Input from "../../../components/common/Input";
import ConfirmDialog from "../../../components/common/ConfirmDialog";

const initialServiceForm = {
  name: "",
  price: "",
  charge_type: "",
};
const chargeType = ["Cố định", "Theo số", "Theo đầu người"];

export default function ServiceList() {
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [services, setServices] = useState([]);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [serviceForm, setServiceForm] = useState(initialServiceForm);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deletingService, setDeletingService] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchServices();
  }, [page]);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const response = await getServices(page);
      setServices(response.data.data.data);
      setTotalPage(response.data.data.last_page);
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể tải lúc này.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const handleFormChange = (event) => {
    event.preventDefault();
    const { name, value } = event.target;
    setServiceForm((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setServiceForm(initialServiceForm);
    setEditingServiceId(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (selectedService) => {
    setEditingServiceId(selectedService.id);
    setServiceForm({
      name: selectedService.name ?? "",
      price: selectedService.price ?? 0,
      charge_type: selectedService.charge_type ?? 0,
    });
    setIsFormModalOpen(true);
  };
  const closeFormModal = () => {
    if (isSaving) return;

    setIsFormModalOpen(false);
    setEditingServiceId(null);
    setServiceForm(initialServiceForm);
  };

  const handleSaveService = async (event) => {
    event.preventDefault();
    const isEdit = editingServiceId !== null;
    try {
      setIsSaving(true);
      const data = {
        name: serviceForm.name,
        price: serviceForm.price,
        charge_type: serviceForm.charge_type,
      };

      if (isEdit) {
        await updateService(editingServiceId, data);
      } else await createService(data);
      setToast({
        type: "success",
        message: isEdit
          ? `Cập nhật dịch vụ ${serviceForm.name} thành công.`
          : `Thêm dịch vụ ${serviceForm.name} thành công.`,
      });

      setEditingServiceId(null);
      setIsFormModalOpen(false);
      setServiceForm(initialServiceForm);

      await fetchServices();
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Có lỗi xảy ra",
      });
    } finally {
      setIsSaving(false);
    }
  };
  const handleDeleteService = async () => {
    if (!deletingService) return;
    try {
      setIsDeleting(true);
      await deleteService(deletingService.id);
      setToast({
        type: "success",
        message: `Xóa dịch vụ ${deletingService.name} thành công.`,
      });

      setDeletingService(null);

      if (services.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        await fetchServices();
      }
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể xóa.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <ConfirmDialog
        title="Xác nhận xóa?"
        message={deletingService ? `Bạn có chắc muốn xóa dịch vụ ${deletingService.name} không?` : ""}
        isOpen={deletingService !== null}
        onConfirm={handleDeleteService}
        onCancel={() => {
          if (!isDeleting) {
            setDeletingService(null);
          }
        }}
        loading={isDeleting}
      ></ConfirmDialog>

      {toast && <Toast title={toast.message} type={toast.type} onClose={() => setToast(null)}></Toast>}

      <ContentLayout title="Quản lý dịch vụ" action={<Button onClick={openCreateModal}>Thêm mới</Button>}>
        <TableLayout>
          <Thead>
            <Tr>
              <Th>ID</Th>
              <Th>Tên dịch vụ</Th>
              <Th>Đơn giá</Th>
              <Th>Phân loại</Th>
              <Th>#</Th>
            </Tr>
          </Thead>
          <Tbody>
            {services.length === 0 ? (
              <Tr>
                <Td className="text-center" colSpan={5}>
                  Chưa có dữ liệu
                </Td>
              </Tr>
            ) : (
              services.map((service) => (
                <Tr key={service.id}>
                  <Td>{service.id}</Td>
                  <Td>{service.name}</Td>
                  <Td>{formatCurrency(service.price)}</Td>
                  <Td>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                        Number(service.charge_type) === 0
                          ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                          : Number(service.charge_type) === 1
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                      }`}
                    >
                      {chargeType[Number(service.charge_type)] || "Không xác định"}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-center gap-10">
                      <button
                        type="button"
                        className="text-yellow-500 hover:text-yellow-700"
                        onClick={() => {
                          openEditModal(service);
                        }}
                        title="Chỉnh sửa"
                      >
                        <Pencil size={20}></Pencil>
                      </button>

                      <button
                        type="button"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          setDeletingService(service);
                        }}
                        title="Xóa"
                      >
                        <Trash2 size={20}></Trash2>
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
          title={editingServiceId === null ? "Thêm dịch vụ mới" : `Cập nhật dịch vụ`}
          isOpen={isFormModalOpen}
          onClose={closeFormModal}
        >
          <form onSubmit={handleSaveService}>
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Tên dịch vụ</Label>

                  <Input
                    id="name"
                    name="name"
                    value={serviceForm.name}
                    onChange={handleFormChange}
                    placeholder="Ví dụ: Điện..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="price">Giá dịch vụ</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    value={serviceForm.price}
                    onChange={handleFormChange}
                    placeholder="Ví dụ: 500000"
                    required
                  />
                </div>
              </div>

              <div className="gap-4">
                <div>
                  <Label htmlFor="charge_type">Hình thức tính phí</Label>

                  <select
                    id="charge_type"
                    name="charge_type"
                    value={serviceForm.charge_type}
                    onChange={handleFormChange}
                    className="w-full text-center rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option>---Chọn---</option>
                    <option value={0}>Cố định</option>
                    <option value={1}>Theo số</option>
                    <option value={2}>Theo đầu người</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" className="bg-slate-500 hover:bg-slate-700" onClick={closeFormModal}>
                  Hủy bỏ
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Đang lưu..." : editingServiceId == null ? "Thêm mới" : "Cập nhật"}
                </Button>
              </div>
              
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
