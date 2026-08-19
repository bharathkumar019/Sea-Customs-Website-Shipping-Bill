import api from "../api/axios";

export const getShippingBillDocuments = (shippingBillId) =>
    api.get(`/shipping-bills/${shippingBillId}/documents/`);

export const uploadShippingBillDocument = (shippingBillId, documentType, file) => {
    const formData = new FormData();
    formData.append("document_type", documentType);
    formData.append("file", file);
    return api.post(`/shipping-bills/${shippingBillId}/documents/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};

export const getShippingBillDocument = (shippingBillId, documentId) =>
    api.get(`/shipping-bills/${shippingBillId}/documents/${documentId}/`);

export const deleteShippingBillDocument = (shippingBillId, documentId) =>
    api.delete(`/shipping-bills/${shippingBillId}/documents/${documentId}/`);

export const verifyShippingBillDocument = (shippingBillId, documentId) =>
    api.post(`/shipping-bills/${shippingBillId}/documents/${documentId}/verify/`);

export const saveEditableShippingBillDocument = (shippingBillId, documentType, file) => {
    const formData = new FormData();
    formData.append("document_type", documentType);
    formData.append("file", file);
    return api.post(`/shipping-bills/${shippingBillId}/editable-documents/`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
};
