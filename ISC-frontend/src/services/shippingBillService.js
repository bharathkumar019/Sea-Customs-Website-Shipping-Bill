import api from "../api/axios";


// GET ALL SHIPPING BILLS

export const getShippingBills = () => {
    return api.get("/shipping-bills/");
};


// GET SINGLE SHIPPING BILL

export const getShippingBill = (id) => {
    return api.get(`/shipping-bills/${id}/`);
};


// CREATE SHIPPING BILL

export const createShippingBill = (data) => {
    return api.post(
        "/shipping-bills/",
        data
    );
};


// UPDATE SHIPPING BILL

export const updateShippingBill = (
    id,
    data
) => {

    return api.put(
        `/shipping-bills/${id}/`,
        data
    );
};


// SUBMIT SHIPPING BILL

export const submitShippingBill = (id) => {
    return api.post(
        `/shipping-bills/${id}/submit/`
    );
};


// UNIT APPROVER ACTION

export const approverShippingBillAction = (
    id,
    action
) => {
    return api.post(
        `/shipping-bills/${id}/approver-action/${action}/`
    );
};


// UNIT MAKER RESUBMIT

export const resubmitShippingBill = (id) => {
    return api.post(
        `/shipping-bills/${id}/resubmit/`
    );
};


// DC CUSTOMS LET EXPORT

export const letExportShippingBill = (id) => {
    return api.post(
        `/shipping-bills/${id}/let-export/`
    );
};


// DC CUSTOMS RAISE QUERY

export const raiseShippingBillQuery = (
    id,
    question
) => {
    return api.post(
        `/shipping-bills/${id}/raise-query/`,
        {
            question,
        }
    );
};


// UNIT APPROVER → DIRECT QUERY RESPONSE

export const respondToShippingBillQuery = (
    id,
    response
) => {

    return api.post(
        `/shipping-bills/${id}/query-response/`,
        {
            response: response,
        }
    );

};


// UNIT APPROVER → FORWARD QUERY TO MAKER

export const forwardShippingBillQuery = (
    id,
    approverMessage
) => {

    return api.post(
        `/shipping-bills/${id}/forward-query/`,
        {
            approver_message: approverMessage,
        }
    );

};

// UNIT APPROVER → RAISE NEW QUERY TO UNIT MAKER

export const raiseApproverQueryToMaker = (
    id,
    message
) => {
    return api.post(
        `/shipping-bills/${id}/approver-raise-maker-query/`,
        {
            message,
        }
    );
};


// ==========================================
// UNIT APPROVER QUERY RESPONSE
// ==========================================

export const approverQueryResponse = (
    id,
    response
) => {
    return api.post(
        `shipping-bills/${id}/approver-query-response/`,
        {
            response,
        }
    );
};


// ==========================================
// UNIT MAKER QUERY RESPONSE
// ==========================================

export const makerQueryResponse = (
    id,
    response
) => {
    return api.post(
        `/shipping-bills/${id}/maker-query-response/`,
        {
            response,
        }
    );
};

// Editable Shipping Bill details
// Uses the existing Shipping Bill detail endpoint; no migration required.
export const getEditableShippingBill = (id) => {
    return api.get(`/shipping-bills/${id}/`);
};

export const updateEditableShippingBill = (id, data) => {
    return api.put(
        `/shipping-bills/${id}/`,
        data
    );
};
// =========================================================
// SUBMIT SHIPPING BILL TO APPROVER
// =========================================================

export const submitShippingBillToApprover = (shippingBillId) => {
    return api.post(
        `/shipping-bills/${shippingBillId}/submit/`
    );
};
// AC CUSTOMS INBOX
export const getACShippingBills = () => {
    return api.get("/shipping-bills/");
};

// AC CUSTOMS → SHIPMENT SUCCESS
export const acShipmentAction = (id, action) => {
    return api.post(
        `/shipping-bills/${id}/ac-action/${action}/`
    );
};


// =========================================================
// PRINT SHIPPING BILL (READ ONLY)
// =========================================================

// Returns all Shipping Bills available to the current user
// for the dedicated Print SB section.
export const getPrintableShippingBills = () => {
    return api.get("/shipping-bills/print-list/");
};

// Returns one printable Shipping Bill.
// Backend performs the same role-based access check again.
export const getPrintableShippingBill = (id) => {
    return api.get(`/shipping-bills/${id}/print/`);
};
