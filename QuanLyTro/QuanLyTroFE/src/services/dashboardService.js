import api from "./api";

export const getDashboard = () => {
  return api.get(`/dashboard`);
};
export const getRevenue = (year) => {
  return api.get("/dashboard/revenue", {
    params: { year },
  });
};

export const getRevenueHistory = (
  page,
  year,
  month
) => {
  return api.get("/dashboard/revenue-history", {
    params: {
      page,
      year,
      month,
    },
  });
};
