import api from "../api/axios";

export const lookupHSN = (hsnCode) => {
    return api.get(`/hsn/${hsnCode}/`);
};

export const listHSN = (params = {}) => {
    return api.get("/hsn/", { params });
};
