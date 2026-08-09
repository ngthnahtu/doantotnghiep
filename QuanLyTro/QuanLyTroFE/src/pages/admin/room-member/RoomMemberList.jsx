import { useEffect, useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import Modal from "../../../components/common/Modal";
import Toast from "../../../components/common/Toast";
import Loading from "../../../components/common/Loading";
import Button from "../../../components/common/Button";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import Label from "../../../components/common/Label";
import Input from "../../../components/common/Input";
import { formatDate } from "../../../utils/formatDate";
import {
  createRoomMember,
  deleteRoomMember,
  getRoomMembers,
  updateRoomMember,
} from "../../../services/roomMemberService";

const initialMemberForm = {
  name: "",
  birth: "",
  gender: 0,
  address: "",
  phone: "",
  identity_number: "",
  relationship: "",
};

const genderList = ["Nam", "Nữ"];

export default function RoomMemberList({ contract, onClose }) {
  const [members, setMembers] = useState([]);
  const [toast, setToast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [viewingMember, setViewingMember] = useState(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [memberForm, setMemberForm] = useState(initialMemberForm);
  const [isSaving, setIsSaving] = useState(false);

  const [deletingMember, setDeletingMember] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (contract) {
      fetchMembers();
    }
  }, [contract?.id]);

  const fetchMembers = async () => {
    try {
      setIsLoading(true);

      const response = await getRoomMembers(contract.id);

      setMembers(response.data.data);
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể tải danh sách người ở cùng.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setMemberForm((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingMemberId(null);
    setMemberForm(initialMemberForm);
    setIsFormOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMemberId(member.id);

    setMemberForm({
      name: member.name ?? "",
      birth: member.birth ? member.birth.slice(0, 10) : "",
      gender: member.gender ?? 0,
      address: member.address ?? "",
      phone: member.phone ?? "",
      identity_number: member.identity_number ?? "",
      relationship: member.relationship ?? "",
    });

    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    if (isSaving) return;

    setIsFormOpen(false);
    setEditingMemberId(null);
    setMemberForm(initialMemberForm);
  };

  const handleSaveMember = async (event) => {
    event.preventDefault();

    const isEditing = editingMemberId !== null;

    try {
      setIsSaving(true);

      const data = {
        name: memberForm.name,
        birth: memberForm.birth,
        gender: Number(memberForm.gender),
        address: memberForm.address,
        phone: memberForm.phone,
        identity_number: memberForm.identity_number,
        relationship: memberForm.relationship,
      };

      if (isEditing) {
        await updateRoomMember(editingMemberId, data);
      } else {
        await createRoomMember({
          ...data,
          contract_id: contract.id,
        });
      }

      setToast({
        type: "success",
        message: isEditing
          ? `Cập nhật thành viên ${memberForm.name} thành công.`
          : `Thêm thành viên ${memberForm.name} thành công.`,
      });

      closeFormModal();
      await fetchMembers();
    } catch (error) {
      setToast({
        type: "error",
        message:
          error.response?.data?.message ||
          (isEditing ? "Không thể cập nhật thành viên." : "Không thể thêm thành viên."),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;

    try {
      setIsDeleting(true);

      await deleteRoomMember(deletingMember.id);

      setToast({
        type: "success",
        message: `Xóa thành viên ${deletingMember.name} thành công.`,
      });

      setDeletingMember(null);
      await fetchMembers();
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể xóa thành viên.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!contract) return null;
  const isActiveContract = Number(contract.status) === 0;

  return (
    <>
      {toast && <Toast title={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <ConfirmDialog
        title="Xác nhận xóa thành viên?"
        message={deletingMember ? `Bạn có chắc muốn xóa thành viên ${deletingMember.name} không?` : ""}
        isOpen={deletingMember !== null}
        onCancel={() => {
          if (!isDeleting) {
            setDeletingMember(null);
          }
        }}
        onConfirm={handleDeleteMember}
        loading={isDeleting}
      />

      <Modal
        title={`Người ở cùng - ${contract.rooms?.room_name ?? ""}`}
        isOpen={!isFormOpen && !viewingMember && !deletingMember}
        onClose={onClose}
        className="max-w-3xl"
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-4 rounded-xl bg-slate-100 p-3 dark:bg-slate-800">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Mã hợp đồng</p>
              <p className="font-medium">{contract.contract_code}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Khách thuê chính</p>
              <p className="font-medium">{contract.tenants?.name ?? "Không xác định"}</p>
            </div>

            <Button type="button" onClick={openCreateModal} disabled={!isActiveContract} 
            className="disabled:cursor-not-allowed disabled:opacity-40">
              <span className="flex items-center gap-2">
                Thêm mới
                </span>
            </Button>
          </div>

          {isLoading ? (
            <Loading />
          ) : (
            <div className="max-h-[350px] overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="w-full table-fixed">
                <colgroup>
                  <col />
                  <col />
                  <col className="w-36" />
                </colgroup>

                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="p-3 text-center">Họ và tên</th>
                    <th className="p-3 text-center">Mối quan hệ</th>
                    <th className="p-3 text-center">#</th>
                  </tr>
                </thead>

                <tbody>
                  {members.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-slate-500 dark:text-slate-400">
                        Chưa có người ở cùng.
                      </td>
                    </tr>
                  ) : (
                    members.map((member) => (
                      <tr key={member.id} className="border-t border-slate-200 dark:border-slate-700">

                        <td className="p-3 text-center">{member.name}</td>

                        <td className="p-3 text-center">{member.relationship || "Chưa cập nhật"}</td>

                        <td className="p-3">
                          <div className="flex items-center justify-center gap-4">
                            <button
                              type="button"
                              title="Xem chi tiết"
                              className="text-blue-500 hover:text-blue-700"
                              onClick={() => setViewingMember(member)}>
                              <Eye size={20} />
                            </button>

                            <button
                              type="button"
                              title="Chỉnh sửa"
                              className="text-yellow-500 hover:text-yellow-700 disabled:cursor-not-allowed disabled:opacity-40"
                              onClick={() => openEditModal(member)}
                              disabled={!isActiveContract}>
                              <Pencil size={20} />
                            </button>

                            <button
                              type="button"
                              title="Xóa"
                              className="text-red-500 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                              onClick={() => setDeletingMember(member)}
                              disabled={!isActiveContract}>
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {isFormOpen && (
        <Modal
          title={editingMemberId !== null ? "Chỉnh sửa thành viên" : "Thêm người ở cùng"}
          isOpen={true}
          onClose={closeFormModal}
          className="max-w-2xl"
        >
          <form onSubmit={handleSaveMember}>
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="member_name">Họ và tên</Label>

                  <Input id="member_name" name="name" value={memberForm.name} onChange={handleFormChange} required />
                </div>

                <div>
                  <Label htmlFor="relationship">Mối quan hệ</Label>

                  <Input
                    id="relationship"
                    name="relationship"
                    value={memberForm.relationship}
                    onChange={handleFormChange}
                    placeholder="Ví dụ: Anh/chị/em"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="member_birth">Ngày sinh</Label>

                  <Input
                    id="member_birth"
                    name="birth"
                    type="date"
                    value={memberForm.birth}
                    onChange={handleFormChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="member_gender">Giới tính</Label>

                  <select
                    id="member_gender"
                    name="gender"
                    value={memberForm.gender}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2 text-slate-900 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                    required
                  >
                    <option value={0}>Nam</option>
                    <option value={1}>Nữ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="member_phone">Số điện thoại</Label>

                  <Input id="member_phone" name="phone" value={memberForm.phone} onChange={handleFormChange} />
                </div>

                <div>
                  <Label htmlFor="member_identity_number">CCCD/CMND</Label>

                  <Input
                    id="member_identity_number"
                    name="identity_number"
                    value={memberForm.identity_number}
                    onChange={handleFormChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="member_address">Địa chỉ</Label>

                <textarea
                  id="member_address"
                  name="address"
                  rows={2}
                  value={memberForm.address}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-slate-300 p-2 outline-none focus:border-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  className="bg-slate-500 hover:bg-slate-700"
                  onClick={closeFormModal}
                  disabled={isSaving}
                >
                  Hủy bỏ
                </Button>

                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Đang lưu..." : editingMemberId !== null ? "Cập nhật" : "Thêm thành viên"}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {viewingMember && (
        <Modal title="Chi tiết người ở cùng" isOpen={true} onClose={() => setViewingMember(null)}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <MemberInfo label="Họ và tên" value={viewingMember.name} />
            <MemberInfo label="Ngày sinh" value={formatDate(viewingMember.birth)} />
            <MemberInfo label="Giới tính" value={genderList[Number(viewingMember.gender)] || "Không xác định"} />
            <MemberInfo label="Số điện thoại" value={viewingMember.phone || "Chưa cập nhật"} />
            <MemberInfo label="CCCD/CMND" value={viewingMember.identity_number || "Chưa cập nhật"} />
            <MemberInfo label="Mối quan hệ" value={viewingMember.relationship || "Chưa cập nhật"} />
            <div className="col-span-2 border-t pt-4 dark:border-slate-700">
              <MemberInfo label="Địa chỉ" value={viewingMember.address || "Chưa cập nhật"} />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function MemberInfo({ label, value }) {
  return (
    <div>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="whitespace-pre-wrap font-medium">{value ?? "Không xác định"}</p>
    </div>
  );
}
