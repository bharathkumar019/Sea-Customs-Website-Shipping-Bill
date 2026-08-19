import api from "../api/axios";

// Get Shipping Bills
export const getDCShippingBills = () => {
    return api.get("shipping-bills/");
};


// Get single Shipping Bill
export const getDCShippingBill = (id) => {
    return api.get(`shipping-bills/${id}/`);
};
// Grant Let Export
export const letExportShippingBill = (id) => {
    return api.post(`shipping-bills/${id}/let-export/`);
};


// Raise Customs Query
export const raiseShippingBillQuery = (id, question) => {
    return api.post(
        `shipping-bills/${id}/raise-query/`,
        {
            question,
        }
    );
};