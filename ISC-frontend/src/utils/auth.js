export function logout() {

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("full_name");
    localStorage.removeItem("company");
    localStorage.removeItem("company_code");
    localStorage.removeItem("user");

    window.location.href = "/login";
}