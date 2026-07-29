import { useEffect, useState } from "react";
import { getSettings, updateAccount, updatePassword, updateSystem } from "../../../services/settingService";

import Button from "../../../components/common/Button";
import Input from "../../../components/common/Input";
import Label from "../../../components/common/Label";
import Loading from "../../../components/common/Loading";
import Toast from "../../../components/common/Toast";
import ContentLayout from "../../../layouts/ContentLayout";

const initialAccountForm = { phone: "", email: "", role: 1 };

const initialPasswordForm = {
  current_password: "",
  password: "",
  password_confirmation: "",
};

const initialSystemForm = {
  house_name: "",
  house_address: "",
  house_phone: "",
  bank_name: "",
  bank_number: "",
  bank_owner: "",
};

export default function Setting() {
  const [accountForm, setAccountForm] = useState(initialAccountForm);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [systemForm, setSystemForm] = useState(initialSystemForm);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [toast, setToast] = useState(null);

  const isAdmin = Number(accountForm.role) === 0;

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);

      const response = await getSettings();
      const data = response.data.data;

      setAccountForm({
        phone: data?.account?.phone ?? "",
        email: data?.account?.email ?? "",
        role: Number(data?.account?.role ?? 1),
      });

      if (data?.system) {
        setSystemForm({
          house_name: data.system.house_name ?? "",
          house_address: data.system.house_address ?? "",
          house_phone: data.system.house_phone ?? "",
          bank_name: data.system.bank_name ?? "",
          bank_number: data.system.bank_number ?? "",
          bank_owner: data.system.bank_owner ?? "",
        });
      }
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Không thể tải thông tin cài đặt.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountChange = (event) => {
    const { name, value } = event.target;
    setAccountForm((previous) => ({ ...previous, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSystemChange = (event) => {
    const { name, value } = event.target;
    setSystemForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleUpdateAccount = async (event) => {
    event.preventDefault();

    try {
      setSaving("account");

      const data = {
        email: accountForm.email || null,
        ...(isAdmin && { phone: accountForm.phone }),
      };

      const response = await updateAccount(data);
      const updatedAccount = response.data.data;

      setAccountForm((previous) => ({
        ...previous,
        phone: updatedAccount?.phone ?? previous.phone,
        email: updatedAccount?.email ?? "",
      }));

      const savedUser = localStorage.getItem("user");

      if (savedUser) {
        const localUser = JSON.parse(savedUser);

        localStorage.setItem(
          "user",
          JSON.stringify({
            ...localUser,
            phone: updatedAccount?.phone ?? localUser.phone,
            email: updatedAccount?.email ?? localUser.email,
          }),
        );
      }

      setToast({
        type: "success",
        message: response.data.message || "Cập nhật tài khoản thành công.",
      });
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Cập nhật tài khoản thất bại.",
      });
    } finally {
      setSaving("");
    }
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();

    if (passwordForm.password !== passwordForm.password_confirmation) {
      setToast({
        type: "error",
        message: "Xác nhận mật khẩu không khớp.",
      });
      return;
    }

    try {
      setSaving("password");

      const response = await updatePassword(passwordForm);

      setPasswordForm(initialPasswordForm);
      setToast({
        type: "success",
        message: response.data.message || "Đổi mật khẩu thành công.",
      });
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Đổi mật khẩu thất bại.",
      });
    } finally {
      setSaving("");
    }
  };

  const handleUpdateSystem = async (event) => {
    event.preventDefault();

    try {
      setSaving("system");

      const response = await updateSystem(systemForm);
      const updatedSystem = response.data.data;

      if (updatedSystem) {
        setSystemForm({
          house_name: updatedSystem.house_name ?? "",
          house_address: updatedSystem.house_address ?? "",
          house_phone: updatedSystem.house_phone ?? "",
          bank_name: updatedSystem.bank_name ?? "",
          bank_number: updatedSystem.bank_number ?? "",
          bank_owner: updatedSystem.bank_owner ?? "",
        });
      }

      setToast({
        type: "success",
        message: response.data.message || "Cập nhật hệ thống thành công.",
      });
      window.location.reload();
    } catch (error) {
      setToast({
        type: "error",
        message: error.response?.data?.message || "Cập nhật hệ thống thất bại.",
      });
    } finally {
      setSaving("");
    }
  };

  if (isLoading) return <Loading />;

  return (
    <>
      {toast && (
        <Toast
          title={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ContentLayout title="Cài đặt">
        <div className="flex flex-col gap-4 p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* THÔNG TIN TÀI KHOẢN */}
            <form
              onSubmit={handleUpdateAccount}
              className="rounded-xl border border-slate-300 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <div className="mb-4 flex items-center gap-2 border-b pb-2 dark:border-slate-700">
                <h2 className="font-semibold">Thông tin tài khoản</h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    name="phone"
                    readOnly
                    value={accountForm.phone}
                    onChange={handleAccountChange}
                    disabled={!isAdmin}
                    required={isAdmin}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={accountForm.email}
                    onChange={handleAccountChange}
                    placeholder="Nhập email"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button type="submit" disabled={saving !== ""}>
                  {saving === "account" ? "Đang lưu..." : "Cập nhật"}
                </Button>
              </div>
            </form>

            {/* ĐỔI MẬT KHẨU */}
            <form
              onSubmit={handleUpdatePassword}
              className="rounded-xl border border-slate-300 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <div className="mb-4 flex items-center gap-2 border-b pb-2 dark:border-slate-700">
                <h2 className="font-semibold">Đổi mật khẩu</h2>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="current_password">Mật khẩu cũ</Label>
                  <Input
                    id="current_password"
                    name="current_password"
                    type="password"
                    value={passwordForm.current_password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="password">Mật khẩu mới</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={passwordForm.password}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="password_confirmation">Xác nhận lại</Label>
                  <Input
                    id="password_confirmation"
                    name="password_confirmation"
                    type="password"
                    value={passwordForm.password_confirmation}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button type="submit" disabled={saving !== ""}>
                  {saving === "password" ? "Đang lưu..." : "Cập nhật"}
                </Button>
              </div>
            </form>
          </div>

          {/* CÀI ĐẶT HỆ THỐNG */}
          {isAdmin && (
            <form
              onSubmit={handleUpdateSystem}
              className="rounded-xl border border-slate-300 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <div className="mb-4 flex items-center gap-2 border-b pb-2 dark:border-slate-700">
                <h2 className="font-semibold">Cài đặt hệ thống</h2>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="house_name">Tên nhà trọ</Label>
                  <Input
                    id="house_name"
                    name="house_name"
                    value={systemForm.house_name}
                    onChange={handleSystemChange}
                    placeholder="Simple Home"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="house_phone">Số điện thoại</Label>
                  <Input
                    id="house_phone"
                    name="house_phone"
                    value={systemForm.house_phone}
                    onChange={handleSystemChange}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="house_address">Địa chỉ</Label>
                  <Input
                    id="house_address"
                    name="house_address"
                    value={systemForm.house_address}
                    onChange={handleSystemChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="bank_name">Tên ngân hàng</Label>
                  <Input
                    id="bank_name"
                    name="bank_name"
                    value={systemForm.bank_name}
                    onChange={handleSystemChange}
                    placeholder="vd: Vietcombank"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="bank_number">Số tài khoản</Label>
                  <Input
                    id="bank_number"
                    name="bank_number"
                    value={systemForm.bank_number}
                    onChange={handleSystemChange}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <Label htmlFor="bank_owner">Tên chủ tài khoản</Label>
                  <Input
                    id="bank_owner"
                    name="bank_owner"
                    value={systemForm.bank_owner}
                    onChange={handleSystemChange}
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end pt-3">
                <Button type="submit" disabled={saving !== ""}>
                  {saving === "system" ? "Đang lưu..." : "Lưu cài đặt"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </ContentLayout>
    </>
  );
}