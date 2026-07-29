import { useEffect, useState } from "react";
import {
  createContract,
  deleteContract,
  getContracts,
  terminateContract,
  updateContract,
} from "../../../services/contractService";
import Loading from "../../../components/common/Loading";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { formatCurrency } from "../../../utils/formatCurrency";
import Toast from "../../../components/common/Toast";
import ContentLayout from "../../../layouts/ContentLayout";
import Button from "../../../components/common/Button";
import { TableLayout, Tbody, Td, Th, Thead, Tr } from "../../../components/common/TableLayout";
import { formatDate } from "../../../utils/formatDate";
import Paginate from "../../../components/common/Paginate";
import { CircleXIcon, Eye, Pencil, Trash2, UserPlus} from "lucide-react";
import Modal from "../../../components/common/Modal";
import Label from "../../../components/common/Label";
import { roomOptions } from "../../../services/roomService";
import { tenantOptions } from "../../../services/tenantService";
import { serviceOptions } from "../../../services/serviceService";
import ContractView from "./ContractView";
import ContractModal from "./ContractModal";
import RoomMemBerList from "../room-member/RoomMemberList";

const initFormContract = {
  start_date: "",
  end_date: "",
  rent_price: 0,
  deposit: 0,
  note: "",
  room_id: "",
  tenant_id: "",
  services: [],
};
const initFormTerminate = {
  actual_end_date: "",
  returned_deposit: "",
};

export default function ContractList() {
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [contracts, setContracts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);

  const [isModalContractOpen, setIsModalContractOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [contractForm, setContractForm] = useState(initFormContract);
  const [isSaving, setIsSaving] = useState(false);

  const [viewingContract, setViewingContract] = useState(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingContract, setDeletingContract] = useState(null);

  const [isTerminating, setIsTerminating] = useState(false);
  const [terminatingContract, setTerminatingContract] = useState(null);
  const [terminateForm, setTerminateForm] = useState(initFormTerminate);
  const [isTerminateConfirmOpen, setIsTerminateConfirmOpen] = useState(false);

  const [rooms, setRooms] = useState([]);
  const [services, setServices] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [memberContract, setMemberContract] = useState(null);

  useEffect(() => {
    fetchContracts();
  }, [page]);

  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      const response = await getContracts(page);
      setContracts(response.data.data.data);
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

  const fetchOption = async () => {
    try {
      const [room, tenant, service] = await Promise.all([roomOptions(), tenantOptions(), serviceOptions()]);

      setRooms(room.data.data);
      setTenants(tenant.data.data);
      setServices(service.data.data);
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể tải dữ liệu.",
      });
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setContractForm((previoutData) => ({
      ...previoutData,
      [name]: value,
    }));
  };

  const openCreateModal = async () => {
    setEditingContract(null);
    setIsModalContractOpen(true);
    setContractForm(initFormContract);
    await fetchOption();
  };

  const openEditModal = async (selectedContract) => {
    setEditingContract(selectedContract);
    setContractForm({
      ...initFormContract,
      start_date: selectedContract.start_date ? selectedContract.start_date.slice(0, 10) : "",
      end_date: selectedContract.end_date ? selectedContract.end_date.slice(0, 10) : "",
      rent_price: selectedContract.rent_price ?? 0,
      deposit: selectedContract.deposit ?? 0,
      note: selectedContract.note ?? "",
      room_id: selectedContract.room_id ?? "",
      tenant_id: selectedContract.tenant_id ?? "",
      services:
        selectedContract.contract_services?.map((service) => ({
          service_id: service.service_id ?? "",
          current_index: service.current_index ?? "",
        })) ?? [],
    });
    setIsModalContractOpen(true);
    await fetchOption();
  };

  const closeFormModal = () => {
    if(isSaving) return;
    setContractForm(initFormContract);
    setIsModalContractOpen(false);
    setEditingContract(null);
  };

  const handleSaveContract = async (event) => {
    event.preventDefault();
    if (contractForm.services.length === 0) {
      setToast({
        type: "error",
        message: "Vui lòng chọn ít nhất một dịch vụ.",
      });
      return;
    }
    try {
      setIsSaving(true);

      const isEdit = editingContract !== null;

      const serviceData = contractForm.services.map((service) => ({
        service_id: Number(service.service_id),
        current_index: service.current_index === "" ? null : Number(service.current_index),
      }));

      const updateData = {
        end_date: contractForm.end_date,
        note: contractForm.note,
        services: serviceData,
      };
      const data = {
        start_date: contractForm.start_date,
        end_date: contractForm.end_date,
        rent_price: Number(contractForm.rent_price),
        deposit: Number(contractForm.deposit),
        note: contractForm.note,
        room_id: Number(contractForm.room_id),
        tenant_id: Number(contractForm.tenant_id),
        services: serviceData,
      };

      if (isEdit) {
        await updateContract(editingContract.id, updateData);
      } else {
        await createContract(data);
      }
      setToast({
        type: "success",
        message: isEdit ? "Cập nhật hợp đồng thành công" : " Thêm hợp đồng mới thành công.",
      });

      setIsModalContractOpen(false);
      setEditingContract(null);
      setContractForm(initFormContract);

      await fetchContracts();
      
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Có lỗi xảy ra.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!deletingContract) return;
    try {
      setIsDeleting(true);

      await deleteContract(deletingContract.id);

      setToast({
        type: "success",
        message: "Hủy hợp đồng thành công.",
      });

      setDeletingContract(null);

      if (contracts.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        await fetchContracts();
      }
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Có lỗi xảy ra.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const openTerminate = (selectedContract) => {
    setTerminatingContract(selectedContract);
    setTerminateForm({
      actual_end_date: "",
      returned_deposit: selectedContract.deposit ? Number(selectedContract.deposit) : "",
    });
  };
  const handleTerminateChange = (event) => {
    const { name, value } = event.target;
    setTerminateForm((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleRequestTerminate = (event) => {
    event.preventDefault();
    if (!terminatingContract) return;
    setIsTerminateConfirmOpen(true);
  };

  const handleSubmitTerminate = async () => {
    if (!terminatingContract) return;

    try {
      setIsTerminating(true);
      const data = {
        actual_end_date: terminateForm.actual_end_date,
        returned_deposit: Number(terminateForm.returned_deposit),
      };
      await terminateContract(terminatingContract.id, data);
      setToast({
        type: "success",
        message: "Thanh lý hợp đồng thành công.",
      });
      closeTerminateConfirm();
      await fetchContracts();
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Có lỗi xảy ra.",
      });
    } finally {
      setIsTerminating(false);
    }
  };

  const closeTerminateConfirm = () => {
    setIsTerminateConfirmOpen(false);
    setTerminateForm(initFormTerminate);
    setTerminatingContract(null);
  };

  const handleServiceCheck = (selectedService, checked) => {
    let newServices = [...contractForm.services];

    if (checked === true) {
      const newService = {
        service_id: selectedService.id,
        current_index: "",
      };
      newServices.push(newService);
    } else {
      newServices = newServices.filter((service) => {
        return Number(service.service_id) !== Number(selectedService.id);
      });
    }
    setContractForm({
      ...contractForm,
      services: newServices,
    });
  };

  const handleIndexChange = (serviceId, value) => {
    const newServices = [];

    for (const currentService of contractForm.services) {
      if (Number(currentService.service_id) === Number(serviceId)) {
        const updateService = {
          ...currentService,
          current_index: value,
        };
        newServices.push(updateService);
      } else {
        newServices.push(currentService);
      }
    }
    setContractForm({
      ...contractForm,
      services: newServices,
    });
  };

  if (isLoading) {
    return <Loading />;
  }
  return (
    <>
      {toast && <Toast title={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ConfirmDialog
        title="Xác nhận hủy hợp đồng"
        message={`Bạn có chắc chắn muốn hủy hợp đồng ${deletingContract?.contract_code ?? ""} không?`}
        isOpen={deletingContract !== null}
        onCancel={() => setDeletingContract(null)}
        onConfirm={handleDeleteContract}
        loading={isDeleting}
      />

      {memberContract && (
        <RoomMemBerList contract={memberContract}
        onClose={()=>setMemberContract(null)}/>
      )}

      {viewingContract && (
        <ContractView contract={viewingContract} onClose={() => setViewingContract(null)} />
      )}

      {terminatingContract && (
        <Modal
          title="Thanh lý hợp đồng"
          isOpen={terminatingContract !== null}
          onClose={() => setTerminatingContract(null)}
          className="max-w-xl"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-3 rounded-xl bg-slate-200 dark:bg-slate-800">
              <div className="grid grid-cols-3 gap-4 rounded-xl p-3">
                <div className="col-span-2">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Số hợp đồng</p>
                  <p className="font-medium">{terminatingContract?.contract_code}</p>
                </div>

                <div className="col-span-1">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tên phòng</p>
                  <p className="font-medium">{terminatingContract?.rooms?.room_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 rounded-xl p-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tên khách thuê</p>
                  <p className="font-medium">{terminatingContract?.tenants?.name}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Căn cước</p>
                  <p className="font-medium">{terminatingContract?.tenants?.identity_number}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Số điện thoại</p>
                  <p className="font-medium">{terminatingContract?.tenants?.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 rounded-xl p-3">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Ngày bắt đầu</p>
                  <p className="font-medium">{formatDate(terminatingContract?.start_date)}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Ngày kết thúc</p>
                  <p className="font-medium">{formatDate(terminatingContract?.end_date)}</p>
                </div>

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tiền đã cọc</p>
                  <p className="font-medium">{formatCurrency(terminatingContract?.deposit)}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-6">
              <div className="p-2">
                <Label htmlFor="actual_end_date">Ngày kết thúc thực tế</Label>
                <input
                  id="actual_end_date"
                  name="actual_end_date"
                  type="date"
                  onChange={handleTerminateChange}
                  value={terminateForm.actual_end_date}
                  className="border border-slate-500 rounded-xl p-2 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
              <div className="p-2">
                <Label htmlFor="returned_deposit">Số tiền hoàn trả</Label>
                <input
                  id="returned_deposit"
                  name="returned_deposit"
                  type="number"
                  min="0"
                  onChange={handleTerminateChange}
                  value={terminateForm.returned_deposit}
                  className="border border-slate-500 rounded-xl p-2 dark:bg-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-5 p-2">
              <Button
                onClick={() => {
                  setTerminatingContract(null);
                }}
                className="bg-slate-400 hover:bg-slate-700"
              >
                Hủy
              </Button>
              <Button onClick={handleRequestTerminate} className="bg-blue-500 hover:bg-blue-700">
                Thanh lý
              </Button>
            </div>
          </div>
        </Modal>
      )}
      <ConfirmDialog
        title="Xác nhận thanh lý hợp đồng"
        message={`Bạn có chắc chắn muốn thanh lý hợp đồng ${terminatingContract?.contract_code ?? ""} 
            và hoàn lại số tiền ${formatCurrency(terminateForm?.returned_deposit) ?? ""} không?`}
        isOpen={isTerminateConfirmOpen}
        onCancel={() => setIsTerminateConfirmOpen(false)}
        onConfirm={handleSubmitTerminate}
        loading={isTerminating}
      />

      

      <ContentLayout title="Quản lý hợp đồng" action={<Button onClick={openCreateModal}>Thêm mới</Button>}>
        <TableLayout>
          <Thead>
            <Tr>
              <Th>Mã Hợp Đồng</Th>
              <Th>Ngày bắt đầu</Th>
              <Th>Ngày hết hạn</Th>
              <Th>Tiền cọc</Th>
              <Th>Phòng</Th>
              <Th>Trạng Thái</Th>
              <Th>#</Th>
              <Th>Thanh lý</Th>
            </Tr>
          </Thead>
          <Tbody>
            {contracts.length === 0 ? (
              <Tr>
                <Td colSpan={8}>Chưa có dữ liệu</Td>
              </Tr>
            ) : (
              contracts.map((contract) => {
                const status = getStatus(contract);
                return (
                  <Tr key={contract.id}>
                    <Td>{contract.contract_code}</Td>
                    <Td>{formatDate(contract.start_date)}</Td>
                    <Td>{formatDate(contract.end_date)}</Td>
                    <Td>{formatCurrency(contract.deposit)}</Td>
                    <Td>{contract.rooms.room_name}</Td>
                    <Td>
                      <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </Td>

                    <Td>
                      <div className="flex items-center justify-center gap-8">

                        <button className="text-green-500 hover:text-green-700"
                        title="Người ở cùng"
                        onClick={()=>setMemberContract(contract)}>
                          <UserPlus size={20}></UserPlus>
                        </button>

                        <button
                          className="text-blue-500 hover:text-blue-700"
                          title="Xem chi tiết"
                          onClick={() => setViewingContract(contract)}
                        >
                          <Eye size={20} />
                        </button>

                        <button
                          className="text-yellow-500 hover:text-yellow-700"
                          onClick={() => openEditModal(contract)}
                          title="Chỉnh sửa"
                        >
                          <Pencil size={20} />
                        </button>

                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => setDeletingContract(contract)}
                          title="Hủy hợp đồng"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </Td>
                    <Td>
                      <div className="flex items-center justify-center">
                        {Number(contract.status) === 0 && (
                          <button
                            className="text-center text-red-500 hover:text-red-700"
                            title="Thanh lý hợp đồng"
                            onClick={() => openTerminate(contract)}
                          >
                            <CircleXIcon size={20} />
                          </button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                );
              })
            )}
          </Tbody>
        </TableLayout>

        {isModalContractOpen && (
          <ContractModal
            editingContract={editingContract}
            isOpen={isModalContractOpen}
            isSaving={isSaving}
            onClose={closeFormModal}
            handleSaveContract={handleSaveContract}
            contractForm={contractForm}
            handleFormChange={handleFormChange}
            rooms={rooms}
            tenants={tenants}
            services={services}
            handleServiceCheck={handleServiceCheck}
            handleIndexChange={handleIndexChange}
          />
        )}
      </ContentLayout>
      <Paginate page={page} setPage={setPage} totalPage={totalPage} />
    </>
  );
}
const getStatus = (contract) => {
    if (Number(contract.status) === 1) {
      return {
        text: "Đã thanh lý",
        color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
      };
    }
    if (Number(contract.status) === 2) {
      return {
        text: "Đã hủy",
        color: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
      };
    }
    const today = new Date().toLocaleDateString("en-CA");
    const endDate = contract.end_date.slice(0, 10);

    if (endDate < today) {
      return {
        text: "Quá hạn - Chờ thanh lý",
        color: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
      };
    }
    return {
      text: "Đang hiệu lực",
      color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    };
  };