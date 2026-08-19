import api from "../api/axios";

// Get Pending Companies
export const getPendingCompanies = () => {
    return api.get("companies/pending/");
};

// Approve / Reject Company
export const companyApproval = (id, action) => {
    return api.post(`company/approval/${id}/`, {
        action,
    });
};