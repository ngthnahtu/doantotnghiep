import api from "./api";

export const getNotifications = (page = 1, search="", filter="") => {
  return api.get("/notifications",{
    params:{
      page,
      view:"manage",
      search,
      filter
    }
  });
};

export const getNotificationsBell = (page = 1, search="", filter="") => {
  return api.get("/notifications",{
    params:{
      page,
      view:"bell",
      search,
      filter
    }
  })
};

export const getNotification = (id) => {
  return api.get(`/notifications/${id}`);
};

export const getNotificationUsers = () => {
  return api.get("/notifications/choose-user");
};

// Tạo thông báo mới
export const createNotification = (data) => {
  return api.post("/notifications", data);
};

// Cập nhật thông báo
export const updateNotification = (id, data) => {
  return api.put(`/notifications/${id}`, data);
};

// Xóa thông báo
export const deleteNotification = (id) => {
  return api.delete(`/notifications/${id}`);
};