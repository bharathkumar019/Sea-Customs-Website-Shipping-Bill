import api from "../api/axios";

export const registerCompany = (data) => {
    return api.post("register/approver/", data);
};