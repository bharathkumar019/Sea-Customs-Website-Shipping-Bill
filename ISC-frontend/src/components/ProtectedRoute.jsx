import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRoles }) {

    const token = localStorage.getItem("access_token");
    const user = JSON.parse(localStorage.getItem("user"));
    const role = user?.role;

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(role)) {
        return <Navigate to="/login" replace />;
    }

    return children;
}