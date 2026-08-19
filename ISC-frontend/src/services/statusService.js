import api from "../api/axios";

export const checkStatus = (data) => {
  return api.post("registration/status/", data);
};