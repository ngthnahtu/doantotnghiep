import axios from "axios";

export const BACKEND_URL = "http://127.0.0.1:8000";
const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
    }
    // Sau khi interceptor xử lý xong, lỗi vẫn tiếp tục được truyền xuống catch của nơi gọi API
    return Promise.reject(error);
  },
);

export default api;
