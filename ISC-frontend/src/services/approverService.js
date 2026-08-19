import api from "../api/axios";

// Get Pending Unit Makers
export const getPendingMakers = () => {
    return api.get("unit-makers/pending/");
};

// Approve / Reject Unit Maker
export const makerApproval = (id, action) => {
    return api.post(`unit-maker/approval/${id}/`, {
        action,
    });
};