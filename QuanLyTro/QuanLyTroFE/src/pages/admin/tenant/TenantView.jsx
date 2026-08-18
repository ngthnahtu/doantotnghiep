  import Modal from "../../../components/common/Modal";
  import { formatDate } from "../../../utils/formatDate";

  const genderList = ["Nam", "Nữ"];

  export default function TenantView({ viewingTenant, onClose }) {
      if(!viewingTenant) return null;
    return (
      <Modal title="Chi tiết khách thuê" isOpen={true} onClose={onClose}>
        <div className="flex max-h-[75vh] flex-col gap-6 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* <TenantInfo label="Mã khách thuê (ID)" value={`#${viewingTenant.id}`} /> */}

            <TenantInfo label="Họ và tên" value={viewingTenant.name} />

            <TenantInfo label="Ngày sinh" value={formatDate(viewingTenant.birth)} />

            <TenantInfo label="Giới tính" value={genderList[Number(viewingTenant.gender)] || "Chưa xác định"} />

            <TenantInfo label="Số điện thoại" value={viewingTenant.phone || "Chưa cập nhật"} />

            <TenantInfo label="Số CCCD/CMND" value={viewingTenant.identity_number || "Chưa cập nhật"} />

            <TenantInfo label="Địa chỉ email" value={viewingTenant.users?.email || "Chưa đăng ký email"} />

            <div>
              <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">Trạng thái tài khoản</p>
              <span
                className={`inline-block rounded-xl px-3 py-1 ${
                  Number(viewingTenant.users?.is_active) === 1 ? "bg-green-100 text-green-500 dark:bg-green-950 dark:text-green-300" : "bg-red-100 text-red-500 dark:bg-red-950 dark:text-red-300"
                }`}
              >
                {Number(viewingTenant.users?.is_active) === 1 ? "Đang hoạt động" : "Đã khóa"}
              </span>
            </div>

            <div>
              <p className="mb-1 text-sm text-slate-500 dark:text-slate-400">Trạng thái thuê</p>

              <span
                className={`inline-block rounded-xl px-3 py-1 ${
                  Number(viewingTenant.status) === 0
                    ? "bg-green-100 text-green-500 dark:bg-green-950 dark:text-green-300"
                    : Number(viewingTenant.status) === 1
                      ? "bg-blue-100 text-blue-500 dark:bg-blue-950 dark:text-blue-300"
                      : "bg-red-100 text-red-500 dark:bg-red-950 dark:text-red-300"
                }`}
              >
                {Number(viewingTenant.status) === 0
                  ? "Chưa thuê"
                  : Number(viewingTenant.status) === 1
                    ? "Đang thuê"
                    : "Đã chuyển đi"}
              </span>
            </div>
          </div>

          <div className="border-t pt-4 dark:border-slate-700">
            <TenantInfo label="Địa chỉ thường trú" value={viewingTenant.address || "Chưa cập nhật"} />
          </div>
        </div>
      </Modal>
    );
  }
  function TenantInfo({ label, value }) {
    return (
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>

        <p className="whitespace-pre-wrap font-medium">{value}</p>
      </div>
    );
  }
