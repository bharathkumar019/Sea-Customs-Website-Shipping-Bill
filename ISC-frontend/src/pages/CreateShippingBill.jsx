import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../api/axios";

import { createShippingBill } from "../services/shippingBillService";
import { lookupHSN } from "../services/hsnService";

const inputClassName =
    "mt-1.5 h-9 w-full rounded-xl border border-[#d9d5cc] bg-white px-3 text-xs text-[#172033] outline-none transition-all focus:border-[#0f1f35] focus:ring-2 focus:ring-[#0f1f35]/5";

const labelClassName =
    "font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#8a8f98]";

const SECTIONS = [
    "General Details",
    "Shipment Details",
    "Bill of Lading",
    "Invoice Details",
    "Item Details",
    "Documents",
];


// =========================================================
// TODAY
// =========================================================

const getToday = () => {

    const date = new Date();

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
};


// =========================================================
// EMPTY INVOICE
// =========================================================

const createEmptyInvoice = () => ({

    invoice_number: "",

    invoice_date: "",

    currency: "USD",

    exchange_rate: "",

    items: [],

});


// =========================================================
// EMPTY ITEM
// =========================================================

const createEmptyItem = () => ({

    hsn_code: "",

    description: "",

    unit_of_measurement: "",

    quantity: "",

    unit_price: "",

    total_value: "",

});


export default function CreateShippingBill() {

    const navigate = useNavigate();

    const today = getToday();

    const [activeSection, setActiveSection] =
        useState(0);


    // =====================================================
    // SHIPPING BILL FORM
    // =====================================================

    const [form, setForm] = useState({

        exporter_type:
            "Manufacturer Exporter",

        exporter_name: "",

        mode_of_transport:
            "SEA",

        port_of_loading: "",

        port_of_discharge: "",

        destination_country: "",

        bl_number: "",

        bl_date: "",

        vessel_name: "",

        voyage_number: "",

    });


    // =====================================================
    // INVOICES
    // =====================================================

    const [invoices, setInvoices] =
        useState([]);


    // =====================================================
    // CURRENT INVOICE DRAFT
    // =====================================================

    const [invoiceDraft, setInvoiceDraft] =
        useState(
            createEmptyInvoice()
        );


    const [editingInvoiceIndex, setEditingInvoiceIndex] =
        useState(null);


    // =====================================================
    // SELECTED INVOICE
    // =====================================================

    const [selectedInvoiceIndex, setSelectedInvoiceIndex] =
        useState("");


    // =====================================================
    // CURRENT ITEM
    // =====================================================

    const [item, setItem] =
        useState(
            createEmptyItem()
        );


    // =====================================================
    // HSN
    // =====================================================

    const [hsnData, setHsnData] =
        useState(null);

    const [hsnLoading, setHsnLoading] =
        useState(false);

    const [hsnError, setHsnError] =
        useState("");


    // =====================================================
    // GENERAL STATE
    // =====================================================

    const [message, setMessage] =
        useState("");

    const [messageType, setMessageType] =
        useState("");

    const [saving, setSaving] =
        useState(false);

    const [requestId, setRequestId] =
        useState("");


    // =====================================================
    // ADD ITEM LOCK
    // =====================================================

    const [addingItem, setAddingItem] =
        useState(false);

    const addingItemRef =
        useRef(false);


    // =====================================================
    // SHIPPING BILL ID
    // =====================================================

    const [shippingBillId, setShippingBillId] =
        useState(null);


    // =====================================================
    // DOCUMENTS
    // =====================================================

    const [documents, setDocuments] =
        useState([]);

    const [previewDocument, setPreviewDocument] = useState(null);

    const [selectedInvoiceFile, setSelectedInvoiceFile] =
        useState(null);

    const [selectedBLFile, setSelectedBLFile] =
        useState(null);

    const [uploadingDocument, setUploadingDocument] =
        useState("");

    const [documentError, setDocumentError] =
        useState("");


    // =====================================================
    // FORM CHANGE
    // =====================================================

    const handleChange = (event) => {

        const {
            name,
            value,
        } = event.target;


        setForm((previous) => ({

            ...previous,

            [name]: value,

        }));
    };


    // =====================================================
    // INVOICE CHANGE
    // =====================================================

    const handleInvoiceChange = (event) => {

        const {
            name,
            value,
        } = event.target;


        setInvoiceDraft((previous) => {

            const updated = {

                ...previous,

                [name]: value,

            };


            if (
                name === "currency" &&
                value.toUpperCase() === "INR"
            ) {

                updated.exchange_rate = "";

            }


            return updated;

        });
    };


    // =====================================================
    // ITEM CHANGE
    // =====================================================

    const handleItemChange = (event) => {

        const {
            name,
            value,
        } = event.target;


        setItem((previous) => {

            const updated = {

                ...previous,

                [name]: value,

            };


            if (
                name === "quantity" ||
                name === "unit_price"
            ) {

                const quantity =
                    Number(
                        name === "quantity"
                            ? value
                            : previous.quantity
                    ) || 0;


                const unitPrice =
                    Number(
                        name === "unit_price"
                            ? value
                            : previous.unit_price
                    ) || 0;


                updated.total_value =
                    (
                        quantity *
                        unitPrice
                    ).toFixed(2);

            }


            return updated;

        });
    };


    // =====================================================
    // HSN LOOKUP
    // =====================================================

    const handleHSNLookup = async () => {

        const hsnCode =
            item.hsn_code.trim();


        setHsnError("");

        setHsnData(null);


        if (!hsnCode) {

            setHsnError(
                "Enter HSN code."
            );

            return;
        }


        try {

            setHsnLoading(true);


            const response =
                await lookupHSN(
                    hsnCode
                );


            const data =
                response.data;


            setHsnData(data);


            setItem((previous) => ({

                ...previous,

                hsn_code:
                    data.hsn_code ||
                    hsnCode,

                description:
                    data.description ||
                    "",

                unit_of_measurement:
                    data.unit ||
                    "",

            }));


        } catch (error) {

            console.error(
                "HSN LOOKUP ERROR:",
                error.response?.data ||
                error
            );


            const errorData =
                error.response?.data;


            setHsnError(
                errorData?.error ||
                errorData?.detail ||
                "HSN code was not found."
            );


        } finally {

            setHsnLoading(false);

        }
    };


    // =====================================================
    // ADD / UPDATE INVOICE
    // =====================================================

    const saveInvoice = () => {

        const invoiceNumber =
            invoiceDraft.invoice_number.trim();


        if (!invoiceNumber) {

            window.alert(
                "Invoice number is required."
            );

            return;
        }


        if (!invoiceDraft.invoice_date) {

            window.alert(
                "Invoice date is required."
            );

            return;
        }


        if (
            invoiceDraft.invoice_date >
            today
        ) {

            window.alert(
                "Invoice date cannot be a future date."
            );

            return;
        }


        const currency =
            (
                invoiceDraft.currency ||
                "INR"
            )
                .trim()
                .toUpperCase();


        if (
            currency !== "INR" &&
            (
                invoiceDraft.exchange_rate === "" ||
                Number(
                    invoiceDraft.exchange_rate
                ) <= 0
            )
        ) {

            window.alert(
                "Exchange rate is required for non-INR currency."
            );

            return;
        }


        const preparedInvoice = {

            invoice_number:
                invoiceNumber,

            invoice_date:
                invoiceDraft.invoice_date,

            currency,

            exchange_rate:
                currency === "INR"
                    ? null
                    : Number(
                        invoiceDraft.exchange_rate
                    ),

            items:
                invoiceDraft.items || [],

        };


        // =================================================
        // EDIT
        // =================================================

        if (
            editingInvoiceIndex !== null
        ) {

            setInvoices((previous) => {

                const updated = [
                    ...previous,
                ];

                updated[
                    editingInvoiceIndex
                ] = preparedInvoice;

                return updated;

            });


            setEditingInvoiceIndex(null);

        }


        // =================================================
        // NEW
        // =================================================

        else {

            setInvoices((previous) => {

                const updated = [

                    ...previous,

                    preparedInvoice,

                ];


                setSelectedInvoiceIndex(
                    String(
                        updated.length - 1
                    )
                );


                return updated;

            });

        }


        setInvoiceDraft(
            createEmptyInvoice()
        );
    };


    // =====================================================
    // EDIT INVOICE
    // =====================================================

    const editInvoice = (index) => {

        const selectedInvoice =
            invoices[index];


        if (!selectedInvoice) {

            return;

        }


        setInvoiceDraft({

            ...selectedInvoice,

            items: [
                ...(selectedInvoice.items || []),
            ],

        });


        setEditingInvoiceIndex(index);

        setActiveSection(3);

    };


    // =====================================================
    // REMOVE INVOICE
    // =====================================================

    const removeInvoice = (index) => {

        const invoice =
            invoices[index];


        if (!invoice) {

            return;

        }


        const confirmed =
            window.confirm(
                `Remove invoice ${invoice.invoice_number}?`
            );


        if (!confirmed) {

            return;

        }


        setInvoices((previous) =>
            previous.filter(
                (_, invoiceIndex) =>
                    invoiceIndex !== index
            )
        );


        if (
            selectedInvoiceIndex ===
            String(index)
        ) {

            setSelectedInvoiceIndex("");

            setItem(
                createEmptyItem()
            );

            setHsnData(null);

        }

    };


    // =====================================================
    // SELECT INVOICE
    // =====================================================

    const handleInvoiceSelection = (event) => {

        const value =
            event.target.value;


        setSelectedInvoiceIndex(
            value
        );


        setItem(
            createEmptyItem()
        );

        setHsnData(null);

        setHsnError("");

    };


    // =====================================================
    // ADD ITEM
    // =====================================================

    const addItem = () => {

        // =================================================
        // PREVENT DOUBLE CLICK
        // =================================================

        if (
            addingItemRef.current
        ) {

            return;

        }


        // LOCK IMMEDIATELY

        addingItemRef.current = true;

        setAddingItem(true);


        // =================================================
        // INVOICE
        // =================================================

        if (
            selectedInvoiceIndex === ""
        ) {

            window.alert(
                "Select an invoice first."
            );

            addingItemRef.current = false;

            setAddingItem(false);

            return;

        }


        // =================================================
        // HSN
        // =================================================

        if (!hsnData) {

            window.alert(
                "Search and validate the HSN code first."
            );

            addingItemRef.current = false;

            setAddingItem(false);

            return;

        }


        // =================================================
        // EXPORTABLE
        // =================================================

        if (!hsnData.exportable) {

            window.alert(
                "This HSN is not exportable."
            );

            addingItemRef.current = false;

            setAddingItem(false);

            return;

        }


        // =================================================
        // RESTRICTED
        // =================================================

        if (hsnData.restricted) {

            window.alert(
                "This HSN is restricted and cannot be exported."
            );

            addingItemRef.current = false;

            setAddingItem(false);

            return;

        }


        // =================================================
        // PROHIBITED
        // =================================================

        if (hsnData.prohibited) {

            window.alert(
                "This HSN is prohibited for export."
            );

            addingItemRef.current = false;

            setAddingItem(false);

            return;

        }


        // =================================================
        // QUANTITY
        // =================================================

        if (
            item.quantity === "" ||
            Number(item.quantity) <= 0
        ) {

            window.alert(
                "Quantity must be greater than zero."
            );

            addingItemRef.current = false;

            setAddingItem(false);

            return;

        }


        // =================================================
        // UNIT PRICE
        // =================================================

        if (
            item.unit_price === "" ||
            Number(item.unit_price) < 0
        ) {

            window.alert(
                "Enter a valid unit price."
            );

            addingItemRef.current = false;

            setAddingItem(false);

            return;

        }


        // =================================================
        // CREATE ITEM
        // =================================================

        const newItem = {

            hsn_code:
                item.hsn_code,

            description:
                item.description,

            unit_of_measurement:
                item.unit_of_measurement,

            quantity:
                Number(
                    item.quantity
                ),

            unit_price:
                Number(
                    item.unit_price
                ),

            total_value:
                Number(
                    item.total_value
                ),

            product_category:
                hsnData.product_category,

            exportable:
                hsnData.exportable,

            export_declaration:
                hsnData.export_declaration,

            restricted:
                hsnData.restricted,

            prohibited:
                hsnData.prohibited,

            hazardous:
                hsnData.hazardous,

            export_duty_rate:
                hsnData.export_duty_rate,

            gst_rate:
                hsnData.gst_rate,

            igst_rate:
                hsnData.igst_rate,

            other_duty_rate:
                hsnData.other_duty_rate,

            calculated_igst:
                hsnData.calculated_igst,

            calculated_other_duty:
                hsnData.calculated_other_duty,

            total_tax_duty:
                hsnData.total_tax_duty,

            risk_category:
                hsnData.risk_category,

        };


        // =================================================
        // ADD ONLY ONCE
        // =================================================

        setInvoices((previous) => {

            const invoiceIndex =
                Number(
                    selectedInvoiceIndex
                );


            return previous.map(
                (invoice, index) => {

                    if (
                        index !==
                        invoiceIndex
                    ) {

                        return invoice;

                    }


                    return {

                        ...invoice,

                        items: [

                            ...(invoice.items || []),

                            newItem,

                        ],

                    };

                }
            );

        });


        // =================================================
        // RESET
        // =================================================

        setItem(
            createEmptyItem()
        );

        setHsnData(null);

        setHsnError("");


        // =================================================
        // RELEASE LOCK
        // =================================================

        setTimeout(() => {

            addingItemRef.current =
                false;

            setAddingItem(false);

        }, 500);

    };


    // =====================================================
    // REMOVE ITEM
    // =====================================================

    const removeItem = (
        invoiceIndex,
        itemIndex
    ) => {

        setInvoices((previous) => {

            return previous.map(
                (invoice, index) => {

                    if (
                        index !==
                        invoiceIndex
                    ) {

                        return invoice;

                    }


                    return {

                        ...invoice,

                        items:
                            (
                                invoice.items ||
                                []
                            ).filter(
                                (_, currentIndex) =>
                                    currentIndex !==
                                    itemIndex
                            ),

                    };

                }
            );

        });

    };


    // =====================================================
    // CONSOLIDATE ITEMS
    // =====================================================

    const consolidateItems = () => {

        if (
            selectedInvoiceIndex === ""
        ) {

            return;

        }


        const invoiceIndex =
            Number(
                selectedInvoiceIndex
            );


        setInvoices((previous) => {

            return previous.map(
                (invoice, index) => {

                    if (
                        index !==
                        invoiceIndex
                    ) {

                        return invoice;

                    }


                    const consolidated = {};


                    (
                        invoice.items ||
                        []
                    ).forEach(
                        (currentItem) => {

                            const key =
                                `${currentItem.hsn_code}_${currentItem.unit_of_measurement}`;


                            if (
                                !consolidated[key]
                            ) {

                                consolidated[key] = {

                                    ...currentItem,

                                    quantity:
                                        Number(
                                            currentItem.quantity
                                        ),

                                    total_value:
                                        Number(
                                            currentItem.total_value
                                        ),

                                };

                            } else {

                                consolidated[key].quantity +=
                                    Number(
                                        currentItem.quantity
                                    );


                                consolidated[key].total_value +=
                                    Number(
                                        currentItem.total_value
                                    );

                            }

                        }
                    );


                    return {

                        ...invoice,

                        items:
                            Object.values(
                                consolidated
                            ),

                    };

                }
            );

        });

    };


    // =====================================================
    // LOAD DOCUMENTS
    // =====================================================

    const loadDocuments = async (
        id
    ) => {

        if (!id) {

            return;

        }


        try {

            const response =
                await api.get(
                    `/shipping-bills/${id}/documents/`
                );


            setDocuments(
                Array.isArray(
                    response.data
                )
                    ? response.data
                    : []
            );


        } catch (error) {

            console.error(
                "DOCUMENT LOAD ERROR:",
                error.response?.data ||
                error
            );

        }

    };


    // =====================================================
    // UPLOAD DOCUMENT
    // =====================================================

    const uploadDocument = async (
        documentType,
        file
    ) => {

        if (!shippingBillId) {

            setDocumentError(
                "Save the Shipping Bill Draft first."
            );

            return;

        }


        if (!file) {

            setDocumentError(
                "Please select a file first."
            );

            return;

        }


        try {

            setUploadingDocument(
                documentType
            );

            setDocumentError("");


            const formData =
                new FormData();


            formData.append(
                "document_type",
                documentType
            );


            formData.append(
                "file",
                file
            );


            const response =
                await api.post(
                    `/shipping-bills/${shippingBillId}/documents/`,
                    formData,
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data",
                        },
                    }
                );


            const uploadedDocument =
                response.data.document;


            if (uploadedDocument) {

                setDocuments(
                    (previous) => [

                        uploadedDocument,

                        ...previous.filter(
                            (document) =>
                                document.id !==
                                uploadedDocument.id
                        ),

                    ]
                );

            }


            if (
                documentType ===
                "INVOICE_PACKAGE"
            ) {

                setSelectedInvoiceFile(
                    null
                );

            }


            if (
                documentType ===
                "BL_DOCUMENT"
            ) {

                setSelectedBLFile(
                    null
                );

            }


        } catch (error) {

            console.error(
                "DOCUMENT UPLOAD ERROR:",
                error.response?.data ||
                error
            );


            setDocumentError(
                error.response?.data?.error ||
                error.response?.data?.detail ||
                "Unable to upload document."
            );


        } finally {

            setUploadingDocument("");

        }

    };


    // =====================================================
    // DELETE DOCUMENT
    // =====================================================

    const deleteDocument = async (
        documentId
    ) => {

        if (!shippingBillId) {

            return;

        }


        const confirmed =
            window.confirm(
                "Delete this document?"
            );


        if (!confirmed) {

            return;

        }


        try {

            await api.delete(
                `/shipping-bills/${shippingBillId}/documents/${documentId}/`
            );


            setDocuments(
                (previous) =>
                    previous.filter(
                        (document) =>
                            document.id !==
                            documentId
                    )
            );


        } catch (error) {

            console.error(
                "DOCUMENT DELETE ERROR:",
                error.response?.data ||
                error
            );


            setDocumentError(
                error.response?.data?.error ||
                error.response?.data?.detail ||
                "Unable to delete document."
            );

        }

    };


    // =====================================================
    // SAVE DRAFT
    // =====================================================

    const handleSubmit = async (
        event
    ) => {

        event.preventDefault();


        try {

            setSaving(true);

            setMessage("");

            setMessageType("");


            // =================================================
            // INVOICE REQUIRED
            // =================================================

            if (
                invoices.length === 0
            ) {

                setMessage(
                    "Add at least one invoice before saving."
                );

                setMessageType(
                    "error"
                );

                return;

            }


            // =================================================
            // VALIDATE INVOICES
            // =================================================

            for (
                const invoice of invoices
            ) {

                if (
                    !invoice.invoice_number
                ) {

                    throw new Error(
                        "Invoice number is required."
                    );

                }


                if (
                    !invoice.invoice_date
                ) {

                    throw new Error(
                        `Invoice date is required for ${invoice.invoice_number}.`
                    );

                }


                if (
                    invoice.invoice_date >
                    today
                ) {

                    throw new Error(
                        `Invoice date cannot be future date for ${invoice.invoice_number}.`
                    );

                }


                if (
                    invoice.currency !==
                    "INR" &&
                    (
                        invoice.exchange_rate ===
                        null ||
                        invoice.exchange_rate ===
                        undefined ||
                        Number(
                            invoice.exchange_rate
                        ) <= 0
                    )
                ) {

                    throw new Error(
                        `Exchange rate is required for ${invoice.invoice_number}.`
                    );

                }

            }


            // =================================================
            // PAYLOAD
            // =================================================

            const payload = {

                ...form,


                invoices:
                    invoices.map(
                        (invoice) => ({

                            invoice_number:
                                invoice.invoice_number,

                            invoice_date:
                                invoice.invoice_date,

                            currency:
                                invoice.currency,

                            exchange_rate:
                                invoice.currency ===
                                "INR"
                                    ? null
                                    : invoice.exchange_rate,


                            items:
                                (
                                    invoice.items ||
                                    []
                                ).map(
                                    (currentItem) => ({

                                        hsn_code:
                                            currentItem.hsn_code,

                                        description:
                                            currentItem.description,

                                        unit_of_measurement:
                                            currentItem.unit_of_measurement,

                                        quantity:
                                            currentItem.quantity,

                                        unit_price:
                                            currentItem.unit_price,

                                    })
                                ),

                        })
                    ),

            };


            console.log(
                "SHIPPING BILL PAYLOAD:",
                payload
            );


            // =================================================
            // CREATE
            // =================================================

            const response =
                await createShippingBill(
                    payload
                );


            console.log(
                "SHIPPING BILL RESPONSE:",
                response.data
            );


            // Backend returns the complete
            // ShippingBillSerializer object.

            const createdId =
                response.data?.id;


            if (createdId) {

                setShippingBillId(
                    createdId
                );


                setDocuments(
                    response.data?.documents ||
                    []
                );


                await loadDocuments(
                    createdId
                );

            }


            setRequestId(
                response.data?.request_id ||
                ""
            );


            setMessage(
                "Shipping Bill saved successfully."
            );


            setMessageType(
                "success"
            );


        } catch (error) {

            console.error(
                "Shipping bill create error:",
                error.response?.data ||
                error
            );


            const backendError =
                error.response?.data;


            let errorMessage =
                "Unable to create Shipping Bill.";


            if (
                backendError
            ) {

                if (
                    typeof backendError ===
                    "string"
                ) {

                    errorMessage =
                        backendError;

                } else if (
                    backendError.detail
                ) {

                    errorMessage =
                        backendError.detail;

                } else if (
                    backendError.error
                ) {

                    errorMessage =
                        backendError.error;

                } else {

                    errorMessage =
                        JSON.stringify(
                            backendError
                        );

                }

            } else if (
                error.message
            ) {

                errorMessage =
                    error.message;

            }


            setMessage(
                errorMessage
            );

            setMessageType(
                "error"
            );


        } finally {

            setSaving(false);

        }

    };


    // =====================================================
    // CURRENT SELECTED INVOICE
    // =====================================================

    const selectedInvoice =
        selectedInvoiceIndex !== ""
            ? invoices[
                Number(
                    selectedInvoiceIndex
                )
            ]
            : null;


    // =====================================================
    // NAVIGATION
    // =====================================================

    const isLast =
        activeSection ===
        SECTIONS.length - 1;


    const isFirst =
        activeSection === 0;


    // =====================================================
    // DOCUMENT DISPLAY NAME
    // =====================================================

    const getDocumentName = (
        document
    ) => {

        if (
            document.file_name
        ) {

            return document.file_name;

        }


        if (
            document.file
        ) {

            return document.file
                .split("/")
                .pop();

        }


        return "Uploaded document";

    };


    // =====================================================
    // UI
    // =====================================================

    return (

        <div>

            <style>{`

                .font-display {
                    font-family: var(--font-display);
                }

                .font-mono {
                    font-family: var(--font-mono);
                }

            `}</style>


            {/* =================================================
                HEADER
            ================================================= */}

            <div className="flex flex-wrap items-start justify-between gap-4">

                <div>

                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#b77a12]">

                        Unit Maker / Shipping Bill Draft

                    </p>


                    <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#172033]">

                        Create Shipping Bill

                    </h1>


                    <p className="mt-1.5 text-xs text-[#667085]">

                        Prepare a new shipping bill draft for submission to the approver desk.

                    </p>

                </div>


                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/maker-dashboard/shipping-bills"
                        )
                    }
                    className="h-9 rounded-xl border border-[#d9d5cc] bg-white px-4 text-xs font-semibold text-[#344054] transition hover:bg-[#f5f3ee]"
                >

                    Back to List

                </button>

            </div>


            {/* =================================================
                SECTION TABS
            ================================================= */}

            <div className="mt-6 flex border-b border-[#e3dfd6] overflow-x-auto">

                {SECTIONS.map(
                    (label, index) => (

                        <button
                            key={label}
                            type="button"
                            onClick={() =>
                                setActiveSection(
                                    index
                                )
                            }
                            className={`whitespace-nowrap px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                                activeSection ===
                                index
                                    ? "border-[#b77a12] text-[#172033]"
                                    : "border-transparent text-[#8a8f98] hover:text-[#172033]"
                            }`}
                        >

                            {index + 1}. {label}

                        </button>

                    )
                )}

            </div>


            {/* =================================================
                FORM
            ================================================= */}

            <form
                onSubmit={
                    handleSubmit
                }
                className="mt-5 space-y-5"
            >

                <section className="rounded-xl border border-[#e3dfd6] bg-white p-5">


                    {/* =================================================
                        GENERAL DETAILS
                    ================================================= */}

                    {activeSection === 0 && (

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                            <div>

                                <label className={labelClassName}>
                                    Exporter Type
                                </label>

                                <select
                                    name="exporter_type"
                                    value={
                                        form.exporter_type
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className={
                                        inputClassName
                                    }
                                >

                                    <option value="Manufacturer Exporter">
                                        Manufacturer Exporter
                                    </option>

                                    <option value="Merchant Exporter">
                                        Merchant Exporter
                                    </option>

                                </select>

                            </div>


                            <div>

                                <label className={labelClassName}>
                                    Exporter Name
                                </label>

                                <input
                                    name="exporter_name"
                                    value={
                                        form.exporter_name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className={
                                        inputClassName
                                    }
                                    placeholder="Exporter Name"
                                    required
                                />

                            </div>


                            <div>

                                <label className={labelClassName}>
                                    Destination Country
                                </label>

                                <input
                                    name="destination_country"
                                    value={
                                        form.destination_country
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className={
                                        inputClassName
                                    }
                                    placeholder="Destination Country"
                                />

                            </div>

                        </div>

                    )}


                    {/* =================================================
                        SHIPMENT DETAILS
                    ================================================= */}

                    {activeSection === 1 && (

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                            <div>

                                <label className={labelClassName}>
                                    Mode of Transport
                                </label>

                                <select
                                    name="mode_of_transport"
                                    value={
                                        form.mode_of_transport
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className={
                                        inputClassName
                                    }
                                >

                                    <option value="SEA">
                                        Sea
                                    </option>

                                    <option value="AIR">
                                        Air
                                    </option>

                                    <option value="ROAD">
                                        Road
                                    </option>

                                </select>

                            </div>


                            <div>

                                <label className={labelClassName}>
                                    Port of Loading
                                </label>

                                <input
                                    name="port_of_loading"
                                    value={
                                        form.port_of_loading
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className={
                                        inputClassName
                                    }
                                    placeholder="Port of Loading"
                                />

                            </div>


                            <div>

                                <label className={labelClassName}>
                                    Port of Discharge
                                </label>

                                <input
                                    name="port_of_discharge"
                                    value={
                                        form.port_of_discharge
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className={
                                        inputClassName
                                    }
                                    placeholder="Port of Discharge"
                                />

                            </div>

                        </div>

                    )}


                    {/* =================================================
                        BILL OF LADING
                    ================================================= */}

                    {activeSection === 2 && (

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                            <div>

                                <label className={labelClassName}>
                                    BL Number
                                </label>

                                <input
                                    name="bl_number"
                                    value={
                                        form.bl_number
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className={
                                        inputClassName
                                    }
                                    placeholder="BL Number"
                                />

                            </div>


                            <div>

                                <label className={labelClassName}>
                                    BL Date
                                </label>

                                <input
                                    type="date"
                                    name="bl_date"
                                    value={
                                        form.bl_date
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    max={today}
                                    className={
                                        inputClassName
                                    }
                                />

                            </div>


                            <div>

                                <label className={labelClassName}>
                                    Vessel Name
                                </label>

                                <input
                                    name="vessel_name"
                                    value={
                                        form.vessel_name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className={
                                        inputClassName
                                    }
                                    placeholder="Vessel Name"
                                />

                            </div>


                            <div>

                                <label className={labelClassName}>
                                    Voyage Number
                                </label>

                                <input
                                    name="voyage_number"
                                    value={
                                        form.voyage_number
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className={
                                        inputClassName
                                    }
                                    placeholder="Voyage Number"
                                />

                            </div>

                        </div>

                    )}


                    {/* =================================================
                        INVOICE DETAILS
                    ================================================= */}

                    {activeSection === 3 && (

                        <div>

                            <div className="rounded-xl border border-[#e3dfd6] bg-[#faf9f6] p-4">

                                <div>

                                    <p className="text-sm font-bold text-[#172033]">

                                        {editingInvoiceIndex !== null
                                            ? "Edit Invoice"
                                            : "Add Invoice"}

                                    </p>

                                    <p className="mt-0.5 text-[10px] text-[#8a8f98]">

                                        Add invoices one by one.

                                    </p>

                                </div>


                                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">


                                    {/* INVOICE NUMBER */}

                                    <div>

                                        <label className={labelClassName}>
                                            Invoice Number
                                        </label>

                                        <input
                                            name="invoice_number"
                                            value={
                                                invoiceDraft.invoice_number
                                            }
                                            onChange={
                                                handleInvoiceChange
                                            }
                                            className={
                                                inputClassName
                                            }
                                            placeholder="Invoice Number"
                                        />

                                    </div>


                                    {/* INVOICE DATE */}

                                    <div>

                                        <label className={labelClassName}>
                                            Invoice Date
                                        </label>

                                        <input
                                            type="date"
                                            name="invoice_date"
                                            value={
                                                invoiceDraft.invoice_date
                                            }
                                            onChange={
                                                handleInvoiceChange
                                            }
                                            max={today}
                                            className={
                                                inputClassName
                                            }
                                        />

                                    </div>


                                    {/* CURRENCY */}

                                    <div>

                                        <label className={labelClassName}>
                                            Currency
                                        </label>

                                        <select
                                            name="currency"
                                            value={
                                                invoiceDraft.currency
                                            }
                                            onChange={
                                                handleInvoiceChange
                                            }
                                            className={
                                                inputClassName
                                            }
                                        >

                                            <option value="INR">
                                                INR
                                            </option>

                                            <option value="USD">
                                                USD
                                            </option>

                                            <option value="EUR">
                                                EUR
                                            </option>

                                            <option value="GBP">
                                                GBP
                                            </option>

                                            <option value="AED">
                                                AED
                                            </option>

                                            <option value="JPY">
                                                JPY
                                            </option>

                                            <option value="SGD">
                                                SGD
                                            </option>

                                            <option value="OTHER">
                                                Other
                                            </option>

                                        </select>

                                    </div>


                                    {/* EXCHANGE RATE */}

                                    <div>

                                        <label className={labelClassName}>
                                            Exchange Rate
                                        </label>

                                        <input
                                            type="number"
                                            step="0.0001"
                                            name="exchange_rate"
                                            value={
                                                invoiceDraft.exchange_rate
                                            }
                                            onChange={
                                                handleInvoiceChange
                                            }
                                            disabled={
                                                invoiceDraft.currency ===
                                                "INR"
                                            }
                                            className={`${inputClassName} ${
                                                invoiceDraft.currency ===
                                                "INR"
                                                    ? "bg-[#f5f3ee] text-[#8a8f98]"
                                                    : ""
                                            }`}
                                            placeholder={
                                                invoiceDraft.currency ===
                                                "INR"
                                                    ? "Not required for INR"
                                                    : "Exchange Rate"
                                            }
                                        />

                                    </div>

                                </div>


                                <div className="mt-4 flex flex-wrap gap-2">

                                    <button
                                        type="button"
                                        onClick={
                                            saveInvoice
                                        }
                                        className="h-9 rounded-xl bg-[#0f1f35] px-4 text-xs font-semibold text-white transition hover:bg-[#b77a12]"
                                    >

                                        {editingInvoiceIndex !== null
                                            ? "Save Invoice"
                                            : "Add Invoice"}

                                    </button>


                                    {editingInvoiceIndex !== null && (

                                        <button
                                            type="button"
                                            onClick={() => {

                                                setEditingInvoiceIndex(
                                                    null
                                                );

                                                setInvoiceDraft(
                                                    createEmptyInvoice()
                                                );

                                            }}
                                            className="h-9 rounded-xl border border-[#d9d5cc] bg-white px-4 text-xs font-semibold text-[#344054] transition hover:bg-[#f5f3ee]"
                                        >

                                            Cancel Edit

                                        </button>

                                    )}

                                </div>

                            </div>


                            {/* INVOICE LIST */}

                            {invoices.length > 0 && (

                                <div className="mt-5 overflow-x-auto rounded-xl border border-[#e3dfd6] bg-white">

                                    <table className="min-w-full text-left">

                                        <thead className="border-b border-[#e3dfd6]">

                                            <tr className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#8a8f98]">

                                                <th className="px-4 py-3">
                                                    #
                                                </th>

                                                <th className="px-4 py-3">
                                                    Invoice No
                                                </th>

                                                <th className="px-4 py-3">
                                                    Date
                                                </th>

                                                <th className="px-4 py-3">
                                                    Currency
                                                </th>

                                                <th className="px-4 py-3">
                                                    Exchange Rate
                                                </th>

                                                <th className="px-4 py-3">
                                                    Items
                                                </th>

                                                <th className="px-4 py-3">
                                                    Action
                                                </th>

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {invoices.map(
                                                (
                                                    invoice,
                                                    index
                                                ) => (

                                                    <tr
                                                        key={`${invoice.invoice_number}-${index}`}
                                                        className="border-b border-[#f0ede5] text-xs text-[#172033] last:border-b-0"
                                                    >

                                                        <td className="px-4 py-3">
                                                            {index + 1}
                                                        </td>

                                                        <td className="px-4 py-3 font-semibold">
                                                            {invoice.invoice_number}
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            {invoice.invoice_date}
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            {invoice.currency}
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            {invoice.currency ===
                                                            "INR"
                                                                ? "-"
                                                                : invoice.exchange_rate}
                                                        </td>

                                                        <td className="px-4 py-3">
                                                            {
                                                                (
                                                                    invoice.items ||
                                                                    []
                                                                ).length
                                                            }
                                                        </td>

                                                        <td className="px-4 py-3">

                                                            <div className="flex flex-wrap gap-2">

                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        editInvoice(
                                                                            index
                                                                        )
                                                                    }
                                                                    className="text-xs font-semibold text-[#0f1f35] hover:text-[#b77a12]"
                                                                >

                                                                    Edit

                                                                </button>


                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        removeInvoice(
                                                                            index
                                                                        )
                                                                    }
                                                                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                                                                >

                                                                    Remove

                                                                </button>

                                                            </div>

                                                        </td>

                                                    </tr>

                                                )
                                            )}

                                        </tbody>

                                    </table>

                                </div>

                            )}

                        </div>

                    )}


                    {/* =================================================
                        ITEM DETAILS
                    ================================================= */}

                    {activeSection === 4 && (

                        <>

                            {/* SELECT INVOICE */}

                            <div className="rounded-xl border border-[#e3dfd6] bg-[#faf9f6] p-4">

                                <label className={labelClassName}>
                                    Select Invoice
                                </label>

                                <select
                                    value={
                                        selectedInvoiceIndex
                                    }
                                    onChange={
                                        handleInvoiceSelection
                                    }
                                    className={
                                        inputClassName
                                    }
                                >

                                    <option value="">
                                        Select Invoice Number
                                    </option>

                                    {invoices.map(
                                        (
                                            invoice,
                                            index
                                        ) => (

                                            <option
                                                key={`${invoice.invoice_number}-${index}`}
                                                value={index}
                                            >

                                                {invoice.invoice_number}

                                            </option>

                                        )
                                    )}

                                </select>


                                {invoices.length === 0 && (

                                    <p className="mt-2 text-[10px] font-semibold text-red-600">

                                        Add an invoice first from Invoice Details.

                                    </p>

                                )}


                                {selectedInvoice && (

                                    <div className="mt-3 flex flex-wrap gap-4 text-[10px] text-[#667085]">

                                        <span>

                                            Invoice:

                                            <strong className="ml-1 text-[#172033]">

                                                {
                                                    selectedInvoice.invoice_number
                                                }

                                            </strong>

                                        </span>


                                        <span>

                                            Currency:

                                            <strong className="ml-1 text-[#172033]">

                                                {
                                                    selectedInvoice.currency
                                                }

                                            </strong>

                                        </span>


                                        <span>

                                            Items:

                                            <strong className="ml-1 text-[#172033]">

                                                {
                                                    (
                                                        selectedInvoice.items ||
                                                        []
                                                    ).length
                                                }

                                            </strong>

                                        </span>

                                    </div>

                                )}

                            </div>


                            {/* ITEM FORM */}

                            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">


                                {/* HSN */}

                                <div>

                                    <label className={labelClassName}>
                                        HSN Code
                                    </label>

                                    <div className="flex gap-2">

                                        <input
                                            name="hsn_code"
                                            value={
                                                item.hsn_code
                                            }
                                            onChange={
                                                handleItemChange
                                            }
                                            onKeyDown={(event) => {

                                                if (
                                                    event.key ===
                                                    "Enter"
                                                ) {

                                                    event.preventDefault();

                                                    handleHSNLookup();

                                                }

                                            }}
                                            className={
                                                inputClassName
                                            }
                                            placeholder="Example: 85171200"
                                        />


                                        <button
                                            type="button"
                                            onClick={
                                                handleHSNLookup
                                            }
                                            disabled={
                                                hsnLoading
                                            }
                                            className="mt-1.5 h-9 shrink-0 rounded-xl bg-[#0f1f35] px-3 text-xs font-semibold text-white transition hover:bg-[#b77a12] disabled:cursor-not-allowed disabled:opacity-60"
                                        >

                                            {hsnLoading
                                                ? "..."
                                                : "Search"}

                                        </button>

                                    </div>


                                    {hsnError && (

                                        <p className="mt-1.5 text-[10px] font-semibold text-red-600">

                                            {hsnError}

                                        </p>

                                    )}

                                </div>


                                {/* DESCRIPTION */}

                                <div>

                                    <label className={labelClassName}>
                                        Item Description
                                    </label>

                                    <input
                                        name="description"
                                        value={
                                            item.description
                                        }
                                        onChange={
                                            handleItemChange
                                        }
                                        className={
                                            inputClassName
                                        }
                                        placeholder="Auto-filled from HSN"
                                        readOnly={
                                            !!hsnData
                                        }
                                    />

                                </div>


                                {/* UOM */}

                                <div>

                                    <label className={labelClassName}>
                                        Unit of Measurement
                                    </label>

                                    <input
                                        name="unit_of_measurement"
                                        value={
                                            item.unit_of_measurement
                                        }
                                        onChange={
                                            handleItemChange
                                        }
                                        className={
                                            inputClassName
                                        }
                                        placeholder="Auto-filled from HSN"
                                        readOnly={
                                            !!hsnData
                                        }
                                    />

                                </div>


                                {/* QUANTITY */}

                                <div>

                                    <label className={labelClassName}>
                                        Quantity
                                    </label>

                                    <input
                                        type="number"
                                        step="0.001"
                                        name="quantity"
                                        value={
                                            item.quantity
                                        }
                                        onChange={
                                            handleItemChange
                                        }
                                        className={
                                            inputClassName
                                        }
                                        placeholder="Quantity"
                                    />

                                </div>


                                {/* UNIT PRICE */}

                                <div>

                                    <label className={labelClassName}>
                                        Unit Price
                                    </label>

                                    <input
                                        type="number"
                                        step="0.0001"
                                        name="unit_price"
                                        value={
                                            item.unit_price
                                        }
                                        onChange={
                                            handleItemChange
                                        }
                                        className={
                                            inputClassName
                                        }
                                        placeholder="Unit Price"
                                    />

                                </div>


                                {/* TOTAL */}

                                <div>

                                    <label className={labelClassName}>
                                        Total Value
                                    </label>

                                    <input
                                        value={
                                            item.total_value
                                        }
                                        readOnly
                                        className={`${inputClassName} bg-[#f5f3ee] text-[#8a8f98]`}
                                        placeholder="Auto calculated"
                                    />

                                </div>

                            </div>


                            {/* HSN RESULT */}

                            {hsnData && (

                                <div className="mt-5 rounded-xl border border-[#e3dfd6] bg-[#faf9f6] p-4">

                                    <div className="mb-3 flex items-center justify-between">

                                        <p className="text-xs font-bold text-[#172033]">
                                            HSN Details
                                        </p>

                                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-green-700">

                                            Valid HSN

                                        </span>

                                    </div>


                                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">


                                        <div>

                                            <p className={labelClassName}>
                                                Product Category
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-[#172033]">

                                                {
                                                    hsnData.product_category ||
                                                    "-"
                                                }

                                            </p>

                                        </div>


                                        <div>

                                            <p className={labelClassName}>
                                                Exportable
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-[#172033]">

                                                {
                                                    hsnData.exportable
                                                        ? "Yes"
                                                        : "No"
                                                }

                                            </p>

                                        </div>


                                        <div>

                                            <p className={labelClassName}>
                                                Declaration
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-[#172033]">

                                                {
                                                    hsnData.export_declaration
                                                        ? "Required"
                                                        : "Not Required"
                                                }

                                            </p>

                                        </div>


                                        <div>

                                            <p className={labelClassName}>
                                                IGST
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-[#172033]">

                                                {
                                                    hsnData.calculated_igst ??
                                                    "0.00"
                                                }%

                                            </p>

                                        </div>


                                        <div>

                                            <p className={labelClassName}>
                                                Other Duty
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-[#172033]">

                                                {
                                                    hsnData.calculated_other_duty ??
                                                    "0.00"
                                                }%

                                            </p>

                                        </div>


                                        <div>

                                            <p className={labelClassName}>
                                                Risk
                                            </p>

                                            <p className="mt-1 text-xs font-semibold text-[#172033]">

                                                {
                                                    hsnData.risk_category ||
                                                    "-"
                                                }

                                            </p>

                                        </div>

                                    </div>


                                    <div className="mt-4 border-t border-[#e3dfd6] pt-3">

                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                                            <div>

                                                <p className={labelClassName}>
                                                    Export Duty
                                                </p>

                                                <p className="mt-1 text-xs font-bold text-[#172033]">

                                                    {
                                                        hsnData.export_duty_rate ??
                                                        "5.00"
                                                    }%

                                                </p>

                                            </div>


                                            <div>

                                                <p className={labelClassName}>
                                                    GST
                                                </p>

                                                <p className="mt-1 text-xs font-bold text-[#172033]">

                                                    {
                                                        hsnData.gst_rate ??
                                                        "15.00"
                                                    }%

                                                </p>

                                            </div>


                                            <div>

                                                <p className={labelClassName}>
                                                    Total Tax / Duty
                                                </p>

                                                <p className="mt-1 text-xs font-bold text-[#172033]">

                                                    {
                                                        hsnData.total_tax_duty ??
                                                        "0.00"
                                                    }%

                                                </p>

                                            </div>


                                            <div>

                                                <p className={labelClassName}>
                                                    Restricted / Prohibited
                                                </p>

                                                <p className="mt-1 text-xs font-bold text-[#172033]">

                                                    {
                                                        hsnData.restricted
                                                            ? "Restricted"
                                                            : hsnData.prohibited
                                                                ? "Prohibited"
                                                                : "Allowed"
                                                    }

                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                </div>

                            )}


                            {/* ITEM BUTTONS */}

                            <div className="mt-4 flex flex-wrap gap-2.5">

                                <button
                                    type="button"
                                    onClick={
                                        addItem
                                    }
                                    disabled={
                                        addingItem
                                    }
                                    className="h-9 rounded-xl bg-[#0f1f35] px-4 text-xs font-semibold text-white transition hover:bg-[#b77a12] disabled:cursor-not-allowed disabled:opacity-50"
                                >

                                    {
                                        addingItem
                                            ? "Adding..."
                                            : "Add Item"
                                    }

                                </button>


                                {selectedInvoice &&
                                    selectedInvoice.items?.length >
                                    0 && (

                                        <button
                                            type="button"
                                            onClick={
                                                consolidateItems
                                            }
                                            className="h-9 rounded-xl border border-[#d9d5cc] bg-white px-4 text-xs font-semibold text-[#344054] transition hover:bg-[#f5f3ee]"
                                        >

                                            Consolidate Items

                                        </button>

                                    )}

                            </div>


                            {/* ITEMS TABLE */}

                            {selectedInvoice &&
                                selectedInvoice.items?.length >
                                0 && (

                                    <div className="mt-5">

                                        <div className="mb-3 flex items-center justify-between">

                                            <p className="text-xs font-bold text-[#172033]">

                                                Items for Invoice{" "}

                                                <span className="font-mono">

                                                    {
                                                        selectedInvoice.invoice_number
                                                    }

                                                </span>

                                            </p>


                                            <span className="rounded-full bg-[#f5f3ee] px-2.5 py-1 text-[9px] font-bold text-[#667085]">

                                                {
                                                    selectedInvoice.items.length
                                                } item(s)

                                            </span>

                                        </div>


                                        <div className="overflow-x-auto rounded-xl border border-[#e3dfd6] bg-white">

                                            <table className="min-w-full text-left">

                                                <thead className="border-b border-[#e3dfd6]">

                                                    <tr className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#8a8f98]">

                                                        <th className="px-4 py-3">
                                                            HSN
                                                        </th>

                                                        <th className="px-4 py-3">
                                                            Description
                                                        </th>

                                                        <th className="px-4 py-3">
                                                            UOM
                                                        </th>

                                                        <th className="px-4 py-3">
                                                            Quantity
                                                        </th>

                                                        <th className="px-4 py-3">
                                                            Unit Price
                                                        </th>

                                                        <th className="px-4 py-3">
                                                            Value
                                                        </th>

                                                        <th className="px-4 py-3">
                                                            Tax
                                                        </th>

                                                        <th className="px-4 py-3">
                                                            Risk
                                                        </th>

                                                        <th className="px-4 py-3">
                                                            Action
                                                        </th>

                                                    </tr>

                                                </thead>


                                                <tbody>

                                                    {selectedInvoice.items.map(
                                                        (
                                                            currentItem,
                                                            itemIndex
                                                        ) => (

                                                            <tr
                                                                key={`${currentItem.hsn_code}-${itemIndex}`}
                                                                className="border-b border-[#f0ede5] text-xs text-[#172033] last:border-b-0"
                                                            >

                                                                <td className="px-4 py-3 font-mono">
                                                                    {
                                                                        currentItem.hsn_code
                                                                    }
                                                                </td>

                                                                <td className="px-4 py-3">
                                                                    {
                                                                        currentItem.description
                                                                    }
                                                                </td>

                                                                <td className="px-4 py-3">
                                                                    {
                                                                        currentItem.unit_of_measurement
                                                                    }
                                                                </td>

                                                                <td className="px-4 py-3">
                                                                    {
                                                                        currentItem.quantity
                                                                    }
                                                                </td>

                                                                <td className="px-4 py-3">
                                                                    {
                                                                        currentItem.unit_price
                                                                    }
                                                                </td>

                                                                <td className="px-4 py-3">
                                                                    {
                                                                        currentItem.total_value
                                                                    }
                                                                </td>

                                                                <td className="px-4 py-3">
                                                                    {
                                                                        currentItem.total_tax_duty ??
                                                                        "-"
                                                                    }%
                                                                </td>

                                                                <td className="px-4 py-3">
                                                                    {
                                                                        currentItem.risk_category ||
                                                                        "-"
                                                                    }
                                                                </td>

                                                                <td className="px-4 py-3">

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            removeItem(
                                                                                Number(
                                                                                    selectedInvoiceIndex
                                                                                ),
                                                                                itemIndex
                                                                            )
                                                                        }
                                                                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                                                                    >

                                                                        Remove

                                                                    </button>

                                                                </td>

                                                            </tr>

                                                        )
                                                    )}

                                                </tbody>

                                            </table>

                                        </div>

                                    </div>

                                )}

                        </>

                    )}


                    {/* =================================================
                        DOCUMENTS
                    ================================================= */}

                    {activeSection === 5 && (

                        <div>

                            <div className="mb-5">

                                <p className="text-sm font-bold text-[#172033]">

                                    Shipping Bill Documents

                                </p>

                                <p className="mt-1 text-[10px] text-[#8a8f98]">

                                    Upload the Commercial Invoice and Bill of Lading documents.

                                </p>

                            </div>


                            {!shippingBillId && (

                                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">

                                    <p className="text-xs font-semibold text-yellow-800">

                                        Save Draft First

                                    </p>

                                    <p className="mt-1 text-[10px] text-yellow-700">

                                        Save the Shipping Bill Draft first.
                                        After saving, you can upload the documents here.

                                    </p>

                                </div>

                            )}


                            {shippingBillId && (

                                <>

                                    {/* =================================================
                                        UPLOAD CARDS
                                    ================================================= */}

                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">


                                        {/* INVOICE */}

                                        <div className="rounded-xl border border-[#e3dfd6] bg-[#faf9f6] p-4">

                                            <p className="text-sm font-bold text-[#172033]">

                                                Commercial Invoice

                                            </p>

                                            <p className="mt-1 text-[10px] text-[#8a8f98]">

                                                Upload the invoice package.

                                            </p>


                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx"
                                                onChange={(event) =>
                                                    setSelectedInvoiceFile(
                                                        event.target.files?.[0] ||
                                                        null
                                                    )
                                                }
                                                className="mt-4 block w-full text-xs"
                                            />


                                            {selectedInvoiceFile && (

                                                <p className="mt-2 text-[10px] text-[#667085]">

                                                    Selected:

                                                    <span className="ml-1 font-semibold">

                                                        {
                                                            selectedInvoiceFile.name
                                                        }

                                                    </span>

                                                </p>

                                            )}


                                            <button
                                                type="button"
                                                disabled={
                                                    uploadingDocument ===
                                                    "INVOICE_PACKAGE"
                                                }
                                                onClick={() =>
                                                    uploadDocument(
                                                        "INVOICE_PACKAGE",
                                                        selectedInvoiceFile
                                                    )
                                                }
                                                className="mt-4 h-9 rounded-xl bg-[#0f1f35] px-4 text-xs font-semibold text-white transition hover:bg-[#b77a12] disabled:cursor-not-allowed disabled:opacity-50"
                                            >

                                                {
                                                    uploadingDocument ===
                                                    "INVOICE_PACKAGE"
                                                        ? "Uploading..."
                                                        : "Upload Invoice"
                                                }

                                            </button>

                                        </div>


                                        {/* BILL OF LADING */}

                                        <div className="rounded-xl border border-[#e3dfd6] bg-[#faf9f6] p-4">

                                            <p className="text-sm font-bold text-[#172033]">

                                                Bill of Lading

                                            </p>

                                            <p className="mt-1 text-[10px] text-[#8a8f98]">

                                                Upload the Bill of Lading document.

                                            </p>


                                            <input
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png,.xls,.xlsx"
                                                onChange={(event) =>
                                                    setSelectedBLFile(
                                                        event.target.files?.[0] ||
                                                        null
                                                    )
                                                }
                                                className="mt-4 block w-full text-xs"
                                            />


                                            {selectedBLFile && (

                                                <p className="mt-2 text-[10px] text-[#667085]">

                                                    Selected:

                                                    <span className="ml-1 font-semibold">

                                                        {
                                                            selectedBLFile.name
                                                        }

                                                    </span>

                                                </p>

                                            )}


                                            <button
                                                type="button"
                                                disabled={
                                                    uploadingDocument ===
                                                    "BL_DOCUMENT"
                                                }
                                                onClick={() =>
                                                    uploadDocument(
                                                        "BL_DOCUMENT",
                                                        selectedBLFile
                                                    )
                                                }
                                                className="mt-4 h-9 rounded-xl bg-[#0f1f35] px-4 text-xs font-semibold text-white transition hover:bg-[#b77a12] disabled:cursor-not-allowed disabled:opacity-50"
                                            >

                                                {
                                                    uploadingDocument ===
                                                    "BL_DOCUMENT"
                                                        ? "Uploading..."
                                                        : "Upload BL"
                                                }

                                            </button>

                                        </div>

                                    </div>


                                    {/* ERROR */}

                                    {documentError && (

                                        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">

                                            <p className="text-xs font-semibold text-red-700">

                                                {
                                                    documentError
                                                }

                                            </p>

                                        </div>

                                    )}


                                    {/* =================================================
                                        UPLOADED DOCUMENTS
                                    ================================================= */}

                                    {documents.length > 0 && (

                                        <div className="mt-5 overflow-hidden rounded-xl border border-[#e3dfd6] bg-white">

                                            <div className="border-b border-[#e3dfd6] px-4 py-3">

                                                <p className="text-xs font-bold text-[#172033]">

                                                    Uploaded Documents

                                                </p>

                                            </div>


                                            <div>

                                                {documents.map(
                                                    (document) => (

                                                        <div
                                                            key={
                                                                document.id
                                                            }
                                                            className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f0ede5] px-4 py-3 last:border-b-0"
                                                        >

                                                            <div>

                                                                <p className="text-xs font-semibold text-[#172033]">

                                                                    {
                                                                        document.document_type ===
                                                                        "INVOICE_PACKAGE"
                                                                            ? "Commercial Invoice"
                                                                            : "Bill of Lading"
                                                                    }

                                                                </p>


                                                                <p className="mt-1 text-[10px] text-[#8a8f98]">

                                                                    {
                                                                        getDocumentName(
                                                                            document
                                                                        )
                                                                    }

                                                                </p>

                                                            </div>


                                                            <div className="flex items-center gap-3">

                                                                {document.file && (

                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setPreviewDocument(document)}
                                                                        className="text-xs font-semibold text-[#0f1f35] hover:text-[#b77a12]"
                                                                    >

                                                                        View

                                                                    </button>

                                                                )}


                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        deleteDocument(
                                                                            document.id
                                                                        )
                                                                    }
                                                                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                                                                >

                                                                    Delete

                                                                </button>

                                                            </div>

                                                        </div>

                                                    )
                                                )}

                                            </div>

                                        </div>

                                    )}

                                </>

                            )}

                        </div>

                    )}

                </section>


                {/* =================================================
                    NAVIGATION
                ================================================= */}

                <div className="flex flex-wrap items-center justify-between gap-3">

                    <div className="flex gap-2.5">

                        <button
                            type="button"
                            onClick={() =>
                                setActiveSection(
                                    (section) =>
                                        Math.max(
                                            0,
                                            section - 1
                                        )
                                )
                            }
                            disabled={
                                isFirst
                            }
                            className="h-9 rounded-xl border border-[#d9d5cc] bg-white px-4 text-xs font-semibold text-[#344054] transition hover:bg-[#f5f3ee] disabled:cursor-not-allowed disabled:opacity-40"
                        >

                            ← Previous

                        </button>


                        {!isLast && (

                            <button
                                type="button"
                                onClick={() =>
                                    setActiveSection(
                                        (section) =>
                                            Math.min(
                                                SECTIONS.length - 1,
                                                section + 1
                                            )
                                    )
                                }
                                className="h-9 rounded-xl bg-[#0f1f35] px-4 text-xs font-semibold text-white transition hover:bg-[#b77a12]"
                            >

                                Next →

                            </button>

                        )}

                    </div>


                    {isLast && (

                        <div className="flex flex-wrap items-center gap-3">

                            <button
                                type="submit"
                                disabled={
                                    saving
                                }
                                className="h-9 rounded-xl bg-[#0f1f35] px-5 text-xs font-semibold text-white transition hover:bg-[#b77a12] disabled:cursor-not-allowed disabled:opacity-60"
                            >

                                {
                                    saving
                                        ? "Saving..."
                                        : "Save Draft"
                                }

                            </button>


                            {message && (

                                <span
                                    className={[
                                        "max-w-xl text-xs font-semibold",
                                        messageType ===
                                        "success"
                                            ? "text-green-700"
                                            : "text-red-700",
                                    ].join(" ")}
                                >

                                    {
                                        message
                                    }

                                </span>

                            )}

                        </div>

                    )}

                </div>


                {/* =================================================
                    REQUEST ID
                ================================================= */}

                {requestId && (

                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">

                        <p className="text-xs font-semibold text-[#205c2e]">

                            Shipping Bill Draft Created

                        </p>


                        <p className="mt-1.5 text-xs text-[#205c2e]">

                            Request ID:

                            <span className="ml-2 font-mono font-bold">

                                {
                                    requestId
                                }

                            </span>

                        </p>


                        {shippingBillId && (

                            <p className="mt-1 text-[10px] text-[#205c2e]">

                                Shipping Bill ID:

                                <span className="ml-1 font-mono font-bold">

                                    {
                                        shippingBillId
                                    }

                                </span>

                            </p>

                        )}

                    </div>

                )}

            </form>


        {previewDocument && (
            <DocumentViewer
                document={previewDocument}
                onClose={() => setPreviewDocument(null)}
            />
        )}
        </div>

    );

}