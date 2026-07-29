import api from "./api";

export const getSettings = () => {
  return api.get("/settings");
};

export const updateAccount = (data) => {
  return api.put("/settings/account", data);
};

export const updatePassword = (data) => {
  return api.put("/settings/password", data);
};

export const updateSystem = (data) => {
  return api.put("/settings/system", data);
};