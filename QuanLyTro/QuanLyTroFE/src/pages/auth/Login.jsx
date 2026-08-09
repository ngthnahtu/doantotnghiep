import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { login } from "../../services/authService";
import { Logo } from "../../components/common/Logo";
import Toast from "../../components/common/Toast";
import Label from "../../components/common/Label";
import Input from "../../components/common/Input";
import Button from "../../components/common/Button";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  useEffect(()=>{
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user"));

    if(token && user){
      if(user.role === 0){
        navigate("/admin/dashboard", {replace:true});
      }
      if(user.role === 1){
        navigate("/tenant/contract", {replace:true});
      }
    }
  },[navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await login(formData);
      const token = response.data.access_token;
      const user = response.data.user;

      localStorage.setItem("token", token); 
      localStorage.setItem("user", JSON.stringify(user));

      setTimeout(() => {
        if (user.role === 0) {
          navigate("/admin/dashboard");
        }

        if (user.role === 1) {
          navigate("/tenant/contract");
        }
      }, 300);

      setToast({
        type: "success",
        message: response.data.message,
      });
    } catch (error) {
      setError(error.response?.data?.message || "Đăng nhập không thành công");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {toast && <Toast title={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="flex min-h-screen items-center justify-center bg-slate-200 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl dark:bg-slate-900">
          <div className="mb-7 space-y-1 text-center">
            <h1 className="text-2xl font-semibold">Đăng nhập</h1>

            <p className="text-sm text-gray-500">Vui lòng đăng nhập để sử dụng hệ thống.</p>
          </div>

          {error && <Toast title={error} type="error" onClose={() => setError("")} />}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="Nhập số điện thoại..."
                onChange={handleChange}
                value={formData.phone}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Mật khẩu</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="******"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
