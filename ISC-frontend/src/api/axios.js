import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api/",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const isLoginRequest =
            config.url?.replace(/^\//, "") === "login/";

        const token = localStorage.getItem("access_token");

        if (token && !isLoginRequest) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export default api;