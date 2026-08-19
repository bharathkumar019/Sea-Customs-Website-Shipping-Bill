import api from "../api/axios";

export const loginUser = (data) => {
    return api.post("login/", data);
};