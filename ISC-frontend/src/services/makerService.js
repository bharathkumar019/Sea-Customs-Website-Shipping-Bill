import api from "../api/axios";

export const registerMaker = (data) => {
    return api.post("register/maker/", data);
};