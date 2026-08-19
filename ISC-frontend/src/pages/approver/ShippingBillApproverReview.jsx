import { useEffect, useState } from "react";
import {
    useNavigate,
    useParams,
} from "react-router-dom";

import {
    getEditableShippingBill,
    updateEditableShippingBill,
    approverShippingBillAction,
    approverQueryResponse,
    forwardShippingBillQuery,
    raiseApproverQueryToMaker,
} from "../../services/shippingBillService";

import {
    saveEditableShippingBillDocument,
} from "../../services/shippingBillDocumentService";

import {
    lookupHSN,
} from "../../services/hsnService";

import DocumentViewer from "../../components/DocumentViewer";


const inputClassName =
    "mt-1.5 h-10 w-full rounded-xl border border-[#d9d5cc] bg-white px-3 text-xs text-[#172033] outline-none focus:border-[#0f1f35] focus:ring-2 focus:ring-[#0f1f35]/5";

const textareaClassName =
    "mt-1.5 min-h-24 w-full rounded-xl border border-[#d9d5cc] bg-white px-3 py-2 text-xs text-[#172033] outline-none focus:border-[#0f1f35] focus:ring-2 focus:ring-[#0f1f35]/5";

const labelClassName =
    "font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#8a8f98]";


const SECTIONS = [
    "General Details",
    "Shipment Details",
    "Bill of Lading",
    "Invoice Details",
    "Item Details",
    "Documents",
    "Query",
];


const DOCUMENT_TYPES = [
    {
        key: "INVOICE_PACKAGE",
        label: "Invoice",
    },
    {
        key: "PL_DOCUMENT",
        label: "PL",
    },
    {
        key: "BL_DOCUMENT",
        label: "BL",
    },
];


const emptyInvoice = () => ({
    invoice_number: "",
    invoice_date: "",
    currency: "INR",
    exchange_rate: "",
    items: [],
});


const emptyItem = () => ({
    hsn_code: "",
    description: "",
    unit_of_measurement: "",
    quantity: "",
    unit_price: "",
    total_value: "",
});


const emptyDocuments = () => ({
    INVOICE_PACKAGE: [],
    PL_DOCUMENT: [],
    BL_DOCUMENT: [],
});

const getTodayISO = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};


const formatValue = (
    value
) => {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "—";
    }

    return value;
};


const calculateTotal = (
    quantity,
    unitPrice
) => {

    const q = Number(quantity);
    const p = Number(unitPrice);

    if (
        !Number.isFinite(q) ||
        !Number.isFinite(p)
    ) {

        return "";
    }

    return (
        q * p
    ).toFixed(2);
};


// =========================================================
// FIELD
// =========================================================

function Field({
    label,
    name,
    value,
    editMode,
    onChange,
    type = "text",
    options,
    required = false,
    readOnly = false,
}) {

    return (

        <div>

            <label className={labelClassName}>
                {label}
            </label>


            {editMode && !readOnly ? (

                options ? (

                    <select
                        name={name}
                        value={value ?? ""}
                        onChange={onChange}
                        className={
                            inputClassName
                        }
                        required={
                            required
                        }
                    >

                        {options.map(
                            (option) => (

                                <option
                                    key={
                                        option.value
                                    }
                                    value={
                                        option.value
                                    }
                                >
                                    {
                                        option.label
                                    }
                                </option>

                            )
                        )}

                    </select>

                ) : (

                    <input
                        type={type}
                        name={name}
                        value={value ?? ""}
                        onChange={onChange}
                        className={
                            inputClassName
                        }
                        required={
                            required
                        }
                    />

                )

            ) : (

                <p className="mt-2 min-h-5 text-xs text-[#172033]">

                    {
                        formatValue(
                            value
                        )
                    }

                </p>

            )}

        </div>
    );
}


// =========================================================
// READ-ONLY LOGIN COMPANY DETAILS
// =========================================================

function CompanyField({
    label,
    value,
    mono = false,
}) {
    return (
        <div>
            <label className={labelClassName}>
                {label}
            </label>

            <p
                className={[
                    "mt-2 min-h-5 text-xs text-[#172033]",
                    mono ? "font-mono" : "",
                ].join(" ")}
            >
                {formatValue(value)}
            </p>
        </div>
    );
}



// =========================================================
// DOCUMENT GROUP
// =========================================================

function DocumentGroup({
    documentType,
    documents,
    files,
    editMode,
    onAddFile,
    onDeleteDocument,
    onViewDocument,
}) {
    const label =
        DOCUMENT_TYPES.find((item) => item.key === documentType)?.label ||
        documentType;

    return (
        <div className="rounded-xl border border-[#e3dfd6] bg-[#faf9f6] p-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className={labelClassName}>{label} Documents</p>
                    <p className="mt-1 text-[11px] text-[#8a8f98]">
                        {documents.length} document{documents.length === 1 ? "" : "s"} uploaded
                    </p>
                </div>
                {editMode && (
                    <label className="cursor-pointer rounded-lg bg-[#0f1f35] px-3 py-2 text-[11px] font-semibold text-white">
                        + Add {label}
                        <input
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(event) => {
                                const selected = Array.from(event.target.files || []);
                                selected.forEach((file) => onAddFile(documentType, file));
                                event.target.value = "";
                            }}
                        />
                    </label>
                )}
            </div>

            {documents.length === 0 && files.length === 0 ? (
                <p className="mt-4 text-xs text-[#8a8f98]">
                    No {label} documents uploaded.
                </p>
            ) : (
                <div className="mt-4 space-y-2">
                    {documents.map((document) => (
                        <div key={document.id} className="flex items-center justify-between gap-3 rounded-lg border border-[#e3dfd6] bg-white px-3 py-2">
                            <button
                                type="button"
                                onClick={() => onViewDocument(document)}
                                className="min-w-0 truncate text-left text-xs font-semibold text-[#0f1f35] underline hover:text-[#b77a12]"
                            >
                                {document.file_name || document.file?.split("/").pop() || `${label} document #${document.id}`}
                            </button>
                            {editMode && (
                                <button
                                    type="button"
                                    onClick={() => onDeleteDocument(document)}
                                    className="shrink-0 text-xs font-semibold text-red-600"
                                >
                                    Delete
                                </button>
                            )}
                        </div>
                    ))}

                    {files.map((file, index) => (
                        <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-[#ead9b8] bg-[#fffaf0] px-3 py-2">
                            <p className="min-w-0 truncate text-xs text-[#b77a12]">New: {file.name}</p>
                            {editMode && (
                                <button
                                    type="button"
                                    onClick={() => onAddFile(documentType, file, true, index)}
                                    className="shrink-0 text-xs font-semibold text-red-600"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


// =========================================================
// MAIN
// =========================================================

export default function ShippingBillApproverReview() {

    const {
        id,
    } = useParams();

    const navigate =
        useNavigate();


    const [
        bill,
        setBill,
    ] = useState(null);

    const [
        loading,
        setLoading,
    ] = useState(true);

    const [
        saving,
        setSaving,
    ] = useState(false);

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        editMode,
        setEditMode,
    ] = useState(false);

    const [
        egmEditMode,
        setEgmEditMode,
    ] = useState(false);

    const [
        activeSection,
        setActiveSection,
    ] = useState(0);

    const [
        error,
        setError,
    ] = useState("");

    const [
        success,
        setSuccess,
    ] = useState("");

    const [
        previewDocument,
        setPreviewDocument,
    ] = useState(null);

    const [
        queryResponse,
        setQueryResponse,
    ] = useState("");

    const [
        respondingToQuery,
        setRespondingToQuery,
    ] = useState(false);

    const [
        approverMessage,
        setApproverMessage,
    ] = useState("");

    const [
        queryLoading,
        setQueryLoading,
    ] = useState(false);


    // =====================================================
    // DOCUMENT FILES
    // =====================================================

    const [
        documentFiles,
        setDocumentFiles,
    ] = useState(
        emptyDocuments()
    );


    // =====================================================
    // ITEM
    // =====================================================

    const [
        itemInvoiceIndex,
        setItemInvoiceIndex,
    ] = useState(0);

    const [
        itemDraft,
        setItemDraft,
    ] = useState(
        emptyItem()
    );

    const [
        editingItemIndex,
        setEditingItemIndex,
    ] = useState(null);


    const [
        hsnLoading,
        setHsnLoading,
    ] = useState(false);

    const [
        hsnError,
        setHsnError,
    ] = useState("");

    const [
        hsnData,
        setHsnData,
    ] = useState(null);


    // =====================================================
    // LOAD
    // =====================================================

    const loadBill =
        async () => {

            try {

                setLoading(true);
                setError("");

                const response =
                    await getEditableShippingBill(
                        id
                    );

                setBill(
                    response.data
                );

                setItemInvoiceIndex(0);
                setItemDraft(
                    emptyItem()
                );

                setEditingItemIndex(
                    null
                );

                setDocumentFiles(
                    emptyDocuments()
                );

            } catch (err) {

                console.error(
                    "Editable Shipping Bill error:",
                    err.response?.data ||
                        err
                );

                setError(
                    err.response?.data?.error ||
                    "Unable to load Shipping Bill."
                );

            } finally {

                setLoading(false);

            }
        };


    useEffect(() => {

        loadBill();

    }, [id]);


    // =====================================================
    // SHIPPING BILL CHANGE
    // =====================================================

    const handleBillChange =
        (event) => {

            const {
                name,
                value,
            } = event.target;

            setBill(
                (previous) => ({
                    ...previous,
                    [name]: value,
                })
            );
        };


    // =====================================================
    // INVOICE CHANGE
    // =====================================================

    const handleInvoiceChange =
        (
            invoiceIndex,
            event
        ) => {

            const {
                name,
                value,
            } = event.target;

            if (name === "invoice_date" && value > getTodayISO()) {
                setError("Invoice date cannot be a future date.");
                return;
            }

            if (name === "invoice_date") {
                setError("");
            }

            setBill(
                (previous) => {

                    const invoices = [
                        ...(previous.invoices ||
                            []),
                    ];

                    invoices[
                        invoiceIndex
                    ] = {

                        ...invoices[
                            invoiceIndex
                        ],

                        [name]:
                            value,

                        ...(name === "currency" && value === "INR"
                            ? { exchange_rate: "" }
                            : {}),
                    };

                    return {
                        ...previous,
                        invoices,
                    };

                }
            );
        };


    // =====================================================
    // ADD INVOICE
    // =====================================================

    const addInvoice =
        () => {

            setBill(
                (previous) => ({
                    ...previous,

                    invoices: [
                        ...(previous.invoices ||
                            []),

                        emptyInvoice(),
                    ],
                })
            );

            setItemInvoiceIndex(
                bill?.invoices?.length ||
                0
            );

            setActiveSection(3);
        };


    // =====================================================
    // REMOVE INVOICE
    // =====================================================

    const removeInvoice =
        (invoiceIndex) => {

            if (
                !window.confirm(
                    "Remove this invoice and its items?"
                )
            ) {

                return;
            }

            setBill(
                (previous) => ({

                    ...previous,

                    invoices:
                        (
                            previous.invoices ||
                            []
                        ).filter(
                            (
                                _,
                                index
                            ) =>
                                index !==
                                invoiceIndex
                        ),

                })
            );

            setItemInvoiceIndex(0);

            setItemDraft(
                emptyItem()
            );

            setEditingItemIndex(
                null
            );
        };


    // =====================================================
    // ITEM CHANGE
    // =====================================================

    const handleItemDraftChange =
        (event) => {

            const {
                name,
                value,
            } = event.target;

            setItemDraft(
                (previous) => {

                    const updated = {
                        ...previous,
                        [name]:
                            value,

                        ...(name === "currency" && value === "INR"
                            ? { exchange_rate: "" }
                            : {}),
                    };

                    if (
                        name ===
                            "quantity" ||
                        name ===
                            "unit_price"
                    ) {

                        updated.total_value =
                            calculateTotal(
                                name ===
                                    "quantity"
                                    ? value
                                    : previous.quantity,

                                name ===
                                    "unit_price"
                                    ? value
                                    : previous.unit_price
                            );
                    }

                    return updated;
                }
            );
        };


    // =====================================================
    // HSN TAX CALCULATION
    // =====================================================

    const getInvoiceTaxableValue = (invoice) => {
        if (!invoice) return 0;

        const storedValue = Number(invoice.total_invoice_value);
        const itemValue = (invoice.items || []).reduce(
            (sum, item) => sum + Number(item.total_value || 0),
            0
        );

        const value = Number.isFinite(storedValue) && storedValue > 0
            ? storedValue
            : itemValue;

        if (invoice.currency === "INR") return value;

        const exchangeRate = Number(invoice.exchange_rate);
        return Number.isFinite(exchangeRate) && exchangeRate > 0
            ? value * exchangeRate
            : 0;
    };

    const getItemTaxRate = (invoice, item) => {
        // HSN tax may be stored as total_tax_duty_rate or total_tax_duty.
        const ownRate = Number(
            item?.total_tax_duty_rate ??
            item?.total_tax_duty
        );

        if (Number.isFinite(ownRate) && ownRate > 0) {
            return ownRate;
        }

        // Fallback: same HSN item in this invoice.
        const hsnCode = String(item?.hsn_code || "").trim();

        if (!hsnCode || !invoice?.items) {
            return 0;
        }

        const sameHsnItem = invoice.items.find((otherItem) => {
            if (otherItem === item) return false;

            const otherHsn = String(otherItem?.hsn_code || "").trim();
            const otherRate = Number(
                otherItem?.total_tax_duty_rate ??
                otherItem?.total_tax_duty
            );

            return (
                otherHsn === hsnCode &&
                Number.isFinite(otherRate) &&
                otherRate > 0
            );
        });

        return sameHsnItem
            ? Number(
                sameHsnItem.total_tax_duty_rate ??
                sameHsnItem.total_tax_duty
            )
            : 0;
    };

    const getItemTaxableValue = (invoice, item) => {
        const value = Number(item?.total_value || 0);

        if (!Number.isFinite(value) || value <= 0) {
            return 0;
        }

        if (invoice?.currency === "INR") {
            return value;
        }

        const exchangeRate = Number(invoice?.exchange_rate);

        return Number.isFinite(exchangeRate) && exchangeRate > 0
            ? value * exchangeRate
            : 0;
    };

    const getItemDutyAmount = (invoice, item) => {
        const taxableValue = getItemTaxableValue(invoice, item);
        const taxRate = getItemTaxRate(invoice, item);

        return taxableValue > 0 && taxRate > 0
            ? taxableValue * taxRate / 100
            : 0;
    };

    const getInvoiceItemsTotal = (invoice) => {
        if (!invoice) return 0;

        return (invoice.items || []).reduce(
            (sum, item) => sum + Number(item.total_value || 0),
            0
        );
    };

    // Convert the invoice item total into INR.
    // INR invoices use rate 1. Foreign-currency invoices use
    // the exchange rate entered for that invoice.
    const getInvoiceItemsTotalINR = (invoice) => {
        const total = getInvoiceItemsTotal(invoice);

        if (!Number.isFinite(total) || total <= 0) {
            return 0;
        }

        if ((invoice?.currency || "INR").toUpperCase() === "INR") {
            return total;
        }

        const exchangeRate = Number(invoice?.exchange_rate);

        return Number.isFinite(exchangeRate) && exchangeRate > 0
            ? total * exchangeRate
            : 0;
    };

    const getInvoiceDutyTotal = (invoice) => {
        if (!invoice) return 0;

        return (invoice.items || []).reduce(
            (sum, item) => sum + getItemDutyAmount(invoice, item),
            0
        );
    };

    // =====================================================
    // INR AMOUNT IN WORDS
    // =====================================================

    const numberToIndianWords = (amount) => {
        const value = Number(amount);

        if (!Number.isFinite(value)) return "Rupees Zero Only - INR";

        const rounded = Math.round(Math.abs(value) * 100) / 100;
        const rupees = Math.floor(rounded);
        const paise = Math.round((rounded - rupees) * 100);

        const ones = [
            "Zero", "One", "Two", "Three", "Four", "Five",
            "Six", "Seven", "Eight", "Nine", "Ten", "Eleven",
            "Twelve", "Thirteen", "Fourteen", "Fifteen",
            "Sixteen", "Seventeen", "Eighteen", "Nineteen"
        ];

        const tens = [
            "", "", "Twenty", "Thirty", "Forty", "Fifty",
            "Sixty", "Seventy", "Eighty", "Ninety"
        ];

        const twoDigits = (num) => {
            if (num < 20) return ones[num];
            return tens[Math.floor(num / 10)] +
                (num % 10 ? ` ${ones[num % 10]}` : "");
        };

        const underThousand = (num) => {
            if (num < 100) return twoDigits(num);
            const remainder = num % 100;
            return `${ones[Math.floor(num / 100)]} Hundred${remainder ? ` ${twoDigits(remainder)}` : ""}`;
        };

        const toWords = (num) => {
            if (num === 0) return "Zero";

            const parts = [];

            const crore = Math.floor(num / 10000000);
            num %= 10000000;
            if (crore) parts.push(`${underThousand(crore)} Crore`);

            const lakh = Math.floor(num / 100000);
            num %= 100000;
            if (lakh) parts.push(`${underThousand(lakh)} Lakh`);

            const thousand = Math.floor(num / 1000);
            num %= 1000;
            if (thousand) parts.push(`${underThousand(thousand)} Thousand`);

            if (num) parts.push(underThousand(num));

            return parts.join(" ");
        };

        const sign = value < 0 ? "Minus " : "";
        let result = `${sign}Rupees ${toWords(rupees)}`;

        if (paise > 0) {
            result += ` and ${twoDigits(paise)} Paise`;
        }

        return `${result} Only - INR`;
    };

    const formatINRAmount = (amount) => {
        const value = Number(amount);
        if (!Number.isFinite(value)) return "0.00";
        return value.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    // =====================================================
    // ALL INVOICE TOTALS
    // =====================================================

    const getAllInvoicesItemsTotal = () => {
        return (invoices || []).reduce(
            (sum, invoice) => sum + getInvoiceItemsTotal(invoice),
            0
        );
    };

    const getAllInvoicesItemsTotalINR = () => {
        return (invoices || []).reduce(
            (sum, invoice) => sum + getInvoiceItemsTotalINR(invoice),
            0
        );
    };

    const getAllInvoicesDutyTotal = () => {
        return (invoices || []).reduce(
            (sum, invoice) => sum + getInvoiceDutyTotal(invoice),
            0
        );
    };


    // =====================================================
    // HSN SEARCH
    // =====================================================

    const handleHSNSearch =
        async () => {

            const code =
                itemDraft.hsn_code.trim();

            setHsnError("");

            if (!code) {

                setHsnError(
                    "Enter HSN Code first."
                );

                return;
            }

            try {

                setHsnLoading(true);

                const response =
                    await lookupHSN(
                        code
                    );

                const data =
                    response.data;

                setHsnData(data);

                setItemDraft(
                    (previous) => ({

                        ...previous,

                        hsn_code:
                            data.hsn_code ||
                            code,

                        description:
                            data.description ||
                            previous.description,

                        unit_of_measurement:
                            data.unit ||
                            previous.unit_of_measurement,

                    })
                );

            } catch (err) {

                console.error(
                    "HSN search error:",
                    err.response?.data ||
                        err
                );

                setHsnError(
                    err.response?.data?.error ||
                    err.response?.data?.detail ||
                    "HSN Code was not found."
                );

            } finally {

                setHsnLoading(false);

            }
        };


    // =====================================================
    // EDIT ITEM
    // =====================================================

    const editItem =
        (
            invoiceIndex,
            itemIndex
        ) => {

            const item =
                bill?.invoices?.[
                    invoiceIndex
                ]?.items?.[
                    itemIndex
                ];

            if (!item) {
                return;
            }

            setItemInvoiceIndex(
                invoiceIndex
            );

            setItemDraft({

                hsn_code:
                    item.hsn_code ||
                    "",

                description:
                    item.description ||
                    "",

                unit_of_measurement:
                    item.unit_of_measurement ||
                    "",

                quantity:
                    item.quantity ??
                    "",

                unit_price:
                    item.unit_price ??
                    "",

                total_value:
                    item.total_value ??
                    calculateTotal(
                        item.quantity,
                        item.unit_price
                    ),

            });

            setEditingItemIndex(
                itemIndex
            );

            setActiveSection(4);
        };


    // =====================================================
    // SAVE ITEM
    // =====================================================

    const saveItem =
        () => {

            const invoice =
                bill?.invoices?.[
                    itemInvoiceIndex
                ];

            if (!invoice) {

                setHsnError(
                    "Add/select an invoice first."
                );

                return;
            }

            if (
                !itemDraft.hsn_code.trim()
            ) {

                setHsnError(
                    "HSN Code is required."
                );

                return;
            }

            if (
                !itemDraft.description.trim()
            ) {

                setHsnError(
                    "Item Description is required."
                );

                return;
            }

            if (
                !itemDraft.unit_of_measurement.trim()
            ) {

                setHsnError(
                    "Unit of Measurement is required."
                );

                return;
            }

            if (
                Number(
                    itemDraft.quantity
                ) <= 0
            ) {

                setHsnError(
                    "Quantity must be greater than zero."
                );

                return;
            }

            if (
                Number(
                    itemDraft.unit_price
                ) < 0
            ) {

                setHsnError(
                    "Unit Price cannot be negative."
                );

                return;
            }


            const prepared = {

                ...itemDraft,

                total_value:
                    calculateTotal(
                        itemDraft.quantity,
                        itemDraft.unit_price
                    ),

                export_duty_rate: hsnData?.export_duty_rate ?? null,
                gst_rate: hsnData?.gst_rate ?? null,
                igst_rate: hsnData?.igst_rate ?? null,
                other_duty_rate: hsnData?.other_duty_rate ?? null,
                calculated_igst: hsnData?.calculated_igst ?? null,
                calculated_other_duty: hsnData?.calculated_other_duty ?? null,
                total_tax_duty: hsnData?.total_tax_duty ?? null,
                total_tax_duty_rate: hsnData?.total_tax_duty ?? null,
                risk_category: hsnData?.risk_category ?? "",
            };


            setBill(
                (previous) => {

                    const invoices = [
                        ...(previous.invoices ||
                            []),
                    ];

                    const items = [
                        ...(invoices[
                            itemInvoiceIndex
                        ].items ||
                            []),
                    ];


                    if (
                        editingItemIndex ===
                        null
                    ) {

                        items.push(
                            prepared
                        );

                    } else {

                        items[
                            editingItemIndex
                        ] =
                            prepared;
                    }


                    invoices[
                        itemInvoiceIndex
                    ] = {

                        ...invoices[
                            itemInvoiceIndex
                        ],

                        items,

                    };


                    return {
                        ...previous,
                        invoices,
                    };

                }
            );


            setItemDraft(
                emptyItem()
            );

            setEditingItemIndex(
                null
            );

            setHsnError("");
        };


    // =====================================================
    // REMOVE ITEM
    // =====================================================

    const removeItem =
        (
            invoiceIndex,
            itemIndex
        ) => {

            if (
                !window.confirm(
                    "Remove this item?"
                )
            ) {

                return;
            }

            setBill(
                (previous) => {

                    const invoices = [
                        ...(previous.invoices ||
                            []),
                    ];

                    invoices[
                        invoiceIndex
                    ] = {

                        ...invoices[
                            invoiceIndex
                        ],

                        items:
                            (
                                invoices[
                                    invoiceIndex
                                ].items ||
                                []
                            ).filter(
                                (
                                    _,
                                    index
                                ) =>
                                    index !==
                                    itemIndex
                            ),
                    };

                    return {
                        ...previous,
                        invoices,
                    };

                }
            );
        };


    // =====================================================
    // DOCUMENT FILE
    // =====================================================

    const handleDocumentFile = (
        documentType,
        file,
        removePending = false,
        pendingIndex = -1
    ) => {
        setDocumentFiles((previous) => {
            const current = [...(previous[documentType] || [])];
            if (removePending) current.splice(pendingIndex, 1);
            else if (file) current.push(file);
            return { ...previous, [documentType]: current };
        });
    };

    const handleDeleteDocument = async (document) => {
        if (!editMode || !document?.id) return;
        if (!window.confirm(`Delete ${document.file_name || "this document"}?`)) return;

        try {
            setError("");
            setSuccess("");
            const { deleteShippingBillDocument } = await import(
                "../../services/shippingBillDocumentService"
            );
            await deleteShippingBillDocument(id, document.id);
            setBill((previous) => ({
                ...previous,
                documents: (previous.documents || []).filter(
                    (item) => item.id !== document.id
                ),
            }));
            setSuccess("Document deleted successfully.");
        } catch (err) {
            console.error("Delete document error:", err.response?.data || err);
            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                "Unable to delete document."
            );
        }
    };


    // PAYLOAD
    // =====================================================

    const buildPayload =
        () => ({

            exporter_type:
                bill.exporter_type ||
                "",

            exporter_name:
                bill.exporter_name ||
                "",

            destination_country:
                bill.destination_country ||
                "",

            destination_company_name:
                bill.destination_company_name ||
                "",

            destination_address:
                bill.destination_address ||
                "",

            mode_of_transport:
                bill.mode_of_transport ||
                "SEA",

            port_of_loading:
                bill.port_of_loading ||
                "",

            port_of_discharge:
                bill.port_of_discharge ||
                "",

            bl_number:
                bill.bl_number ||
                "",

            bl_date:
                bill.bl_date ||
                null,

            vessel_name:
                bill.vessel_name ||
                "",

            voyage_number:
                bill.voyage_number ||
                "",

            container_number:
                bill.container_number ||
                "",

            seal_number:
                bill.seal_number ||
                "",


            invoices:
                (
                    bill.invoices ||
                    []
                ).map(
                    (invoice) => ({

                        invoice_number:
                            invoice.invoice_number ||
                            "",

                        invoice_date:
                            invoice.invoice_date ||
                            null,

                        currency:
                            invoice.currency ||
                            "INR",

                        exchange_rate:
                            invoice.currency ===
                                "INR" ||
                            invoice.exchange_rate ===
                                ""
                                ? null
                                : invoice.exchange_rate,

                        items:
                            (
                                invoice.items ||
                                []
                            ).map(
                                (item) => ({

                                    hsn_code:
                                        item.hsn_code ||
                                        "",

                                    description:
                                        item.description ||
                                        "",

                                    unit_of_measurement:
                                        item.unit_of_measurement ||
                                        "",

                                    quantity:
                                        item.quantity,

                                    unit_price:
                                        item.unit_price,

                                    total_value:
                                        item.total_value,

                                })
                            ),

                    })
                ),

        });


    // =====================================================
    // SAVE
    // =====================================================

    const handleSave =
        async () => {

            try {

                setSaving(true);
                setError("");
                setSuccess("");

                // After Let Export the complete Shipping Bill is locked.
                // Only Unit Approver may save EGM Number and EGM Date.
                if (bill.status === "LET_EXPORT") {

                    if (!String(bill.egm_number || "").trim()) {
                        setError("EGM Number is required.");
                        return;
                    }

                    if (!bill.egm_date) {
                        setError("EGM Date is required.");
                        return;
                    }

                    const response = await updateEditableShippingBill(
                        id,
                        {
                            egm_number: String(bill.egm_number).trim(),
                            egm_date: bill.egm_date,
                        }
                    );

                    setBill(response.data);
                    setEgmEditMode(false);
                    setSuccess("EGM details saved successfully.");
                    return;
                }

                const futureInvoice = (bill.invoices || []).find(
                    (invoice) => invoice.invoice_date && invoice.invoice_date > getTodayISO()
                );

                if (futureInvoice) {
                    setError("Invoice date cannot be a future date.");
                    return;
                }

                const response =
                    await updateEditableShippingBill(
                        id,
                        buildPayload()
                    );


                let updatedBill =
                    response.data;


                // -----------------------------------------
                // DOCUMENTS
                // -----------------------------------------

                for (const documentType of Object.keys(documentFiles)) {
                    const files = documentFiles[documentType] || [];

                    for (const file of files) {
                        const documentResponse =
                            await saveEditableShippingBillDocument(
                                id,
                                documentType,
                                file
                            );

                        const savedDocument = documentResponse.data?.document;

                        if (savedDocument) {
                            updatedBill = {
                                ...updatedBill,
                                documents: [
                                    ...(updatedBill.documents || []),
                                    savedDocument,
                                ],
                            };
                        }
                    }
                }

                setBill(
                    updatedBill
                );

                setDocumentFiles(
                    emptyDocuments()
                );

                setEditMode(
                    false
                );

                setSuccess(
                    "Shipping Bill saved successfully."
                );

            } catch (err) {

                console.error(
                    "Save Shipping Bill error:",
                    err.response?.data ||
                        err
                );

                setError(
                    typeof err.response?.data ===
                        "object"
                        ? JSON.stringify(
                            err.response.data
                        )
                        : "Unable to save Shipping Bill."
                );

            } finally {

                setSaving(false);

            }
        };


    // =====================================================
    // UNIT APPROVER QUERY RESPONSE / FORWARD
    // =====================================================

    const handleQueryResponse = async () => {
        if (!id) {
            setError("Shipping Bill ID is missing.");
            return;
        }

        if (!queryResponse.trim()) {
            setError("Please enter a response to the query.");
            return;
        }

        if (!window.confirm("Submit this response to DC Customs?")) {
            return;
        }

        try {
            setQueryLoading(true);
            setError("");
            setSuccess("");

            const response = await approverQueryResponse(id, queryResponse.trim());
            setBill(response.data.shipping_bill || response.data);
            setQueryResponse("");
            setSuccess("Query response submitted to DC Customs successfully.");
        } catch (err) {
            console.error("Approver query response error:", err.response?.data || err);
            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                "Unable to submit query response."
            );
        } finally {
            setQueryLoading(false);
        }
    };

    const handleRaiseMakerQuery = async () => {
        if (!id) {
            setError("Shipping Bill ID is missing.");
            return;
        }

        if (!approverMessage.trim()) {
            setError("Please enter a message for Unit Maker.");
            return;
        }

        if (!window.confirm("Send this query to Unit Maker?")) {
            return;
        }

        try {
            setQueryLoading(true);
            setError("");
            setSuccess("");

            const response = await raiseApproverQueryToMaker(
                id,
                approverMessage.trim()
            );

            setBill(response.data.shipping_bill || response.data);
            setApproverMessage("");
            setSuccess("Query sent to Unit Maker successfully.");
        } catch (err) {
            console.error(
                "Approver raise query error:",
                err.response?.data || err
            );
            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                "Unable to send query to Unit Maker."
            );
        } finally {
            setQueryLoading(false);
        }
    };

    const handleForwardQuery = async () => {
        if (!id) {
            setError("Shipping Bill ID is missing.");
            return;
        }

        if (!approverMessage.trim()) {
            setError("Please enter a message for Unit Maker.");
            return;
        }

        if (!window.confirm("Forward this Customs Query to Unit Maker?")) {
            return;
        }

        try {
            setQueryLoading(true);
            setError("");
            setSuccess("");

            const response = await forwardShippingBillQuery(id, approverMessage.trim());
            setBill(response.data.shipping_bill || response.data);
            setApproverMessage("");
            setSuccess("Customs Query forwarded to Unit Maker successfully.");
        } catch (err) {
            console.error("Forward query error:", err.response?.data || err);
            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                "Unable to forward query."
            );
        } finally {
            setQueryLoading(false);
        }
    };

    const handleApproverAction = async (action) => {
        const messages = {
            cancel: "Are you sure you want to cancel this Shipping Bill?",
            "send-back": "Send this Shipping Bill back to Unit Maker?",
            "submit-customs": "Submit this Shipping Bill to DC Customs?",
            "submit-ac": "Submit this Shipping Bill to AC Customs?",
        };

        if (!window.confirm(messages[action] || "Continue with this action?")) {
            return;
        }

        try {
            setLoading(true);
            setError("");
            const response = await approverShippingBillAction(id, action);
            setSuccess(response.data.message || "Action completed successfully.");
            if (action === "submit-customs" || action === "submit-ac" || action === "send-back" || action === "cancel") {
                navigate("/approver-dashboard/inbox");
                return;
            }
            await loadBill();
        } catch (err) {
            console.error("Approver action error:", err.response?.data || err);
            setError(
                err.response?.data?.error ||
                err.response?.data?.detail ||
                "Unable to perform this action."
            );
        } finally {
            setLoading(false);
        }
    };

    // CANCEL
    // =====================================================

    const cancelEdit =
        async () => {

            setEditMode(false);

            setDocumentFiles(
                emptyDocuments()
            );

            setItemDraft(
                emptyItem()
            );

            setEditingItemIndex(
                null
            );

            setHsnError("");

            await loadBill();
        };


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <p className="text-xs text-[#667085]">

                Loading Shipping Bill...

            </p>

        );
    }


    if (!bill) {

        return (

            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-600">

                {
                    error ||
                    "Shipping Bill not found."
                }

            </div>

        );
    }


    const invoices =
        bill.invoices ||
        [];

    const queries = bill.queries || [];
    const canApproverEdit = [
        "SUBMITTED_TO_APPROVER",
        "QUERY_RAISED",
        "QUERY_RESPONDED",
        "MAKER_RESPONDED",
    ].includes(bill.status);

    const canEditEgm = bill.status === "LET_EXPORT";

    const activeQuery =
        [...queries]
            .reverse()
            .find((query) => !query.is_resolved) ||
        queries[queries.length - 1] ||
        null;

    const selectedInvoice =
        invoices[
            itemInvoiceIndex
        ];


    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="pb-10">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="border-b border-[#e3dfd6] pb-5">

                <div className="flex items-start justify-between gap-4">

                    <div>

                        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#b77a12]">
                            Shipping Bill
                        </p>

                        <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#172033]">
                            Shipping Bill Details
                        </h1>

                        <p className="mt-1.5 text-xs text-[#667085]">
                            Review and edit the same Shipping Bill fields available to Unit Maker.
                        </p>

                    </div>

                                    <div className="flex items-start justify-end">
                    <span className="mr-1 rounded-full border border-[#e3dfd6] bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[#667085]">
                        {bill.status ? bill.status.replaceAll("_", " ") : "Shipping Bill"}
                    </span>
                </div>

                </div>

<div className="flex flex-wrap items-center justify-between gap-3 pt-4">

                    {/* LEFT: BACK + EDIT / SAVE */}
                    <div className="flex flex-wrap items-center gap-2">

                        <button
                            type="button"
                            onClick={() => navigate("/approver-dashboard/inbox")}
                            className="h-10 rounded-xl border border-[#d9d5cc] bg-white px-4 text-xs font-semibold text-[#344054] hover:bg-[#faf9f6]"
                        >
                            Back
                        </button>

                        {editMode ? (
                            <>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="h-10 rounded-xl bg-[#0f1f35] px-5 text-xs font-semibold text-white disabled:opacity-60"
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>

                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    disabled={saving}
                                    className="h-10 rounded-xl border border-[#d9d5cc] bg-white px-5 text-xs font-semibold text-[#344054] disabled:opacity-60"
                                >
                                    Cancel Edit
                                </button>
                            </>
                        ) : (
                            canApproverEdit && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSuccess("");
                                        setError("");
                                        setEditMode(true);
                                    }}
                                    className="h-10 rounded-xl bg-[#0f1f35] px-5 text-xs font-semibold text-white"
                                >
                                    Edit Shipping Bill
                                </button>
                            )
                        )}

                    </div>

                    {/* RIGHT: QUERY + APPROVER ACTIONS */}
                    <div className="flex flex-wrap items-center justify-end gap-2">

                        {bill.queries?.some((q) => !q.is_resolved) && (
                            <button
                                type="button"
                                onClick={() => setActiveSection(6)}
                                className="h-10 rounded-xl border border-[#c47d00] bg-white px-5 text-xs font-semibold text-[#a66700]"
                            >
                                Query (
                                {bill.queries.filter((q) => !q.is_resolved).length}
                                )
                            </button>
                        )}

                        {!editMode && bill.status === "SUBMITTED_TO_APPROVER" && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => handleApproverAction("cancel")}
                                    disabled={loading}
                                    className="h-10 rounded-xl border border-red-200 bg-red-50 px-5 text-xs font-semibold text-red-700 disabled:opacity-50"
                                >
                                    Cancel Shipping Bill
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleApproverAction("submit-customs")}
                                    disabled={loading}
                                    className="h-10 rounded-xl bg-emerald-700 px-5 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                    Submit to DC Customs
                                </button>
                            </>
                        )}

                        {!editMode &&
                            (bill.status === "QUERY_RESPONDED" ||
                                bill.status === "MAKER_RESPONDED") && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleApproverAction("submit-customs")
                                    }
                                    disabled={loading}
                                    className="h-10 rounded-xl bg-emerald-700 px-5 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                    Submit to DC Customs
                                </button>
                            )}

                        {canEditEgm && !egmEditMode && (
                            <button
                                type="button"
                                onClick={() => handleApproverAction("submit-ac")}
                                disabled={loading || saving || !String(bill.egm_number || "").trim() || !bill.egm_date}
                                className="h-10 rounded-xl bg-emerald-700 px-5 text-xs font-semibold text-white disabled:opacity-50"
                            >
                                Submit to AC Customs
                            </button>
                        )}

                    </div>

                </div>

            </div>

            {/* =================================================
                EGM DETAILS AFTER LET EXPORT
            ================================================= */}

            {bill.status === "LET_EXPORT" && (
                <section className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/40 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="text-sm font-bold text-[#172033]">
                                Final EGM Details
                            </h2>
                            <p className="mt-1 text-xs text-[#667085]">
                                Shipping Bill is locked after Let Export. Only Unit Approver can enter and save the final EGM Number and EGM Date.
                            </p>
                        </div>

                        {!egmEditMode ? (
                            <button
                                type="button"
                                onClick={() => {
                                    setError("");
                                    setSuccess("");
                                    setEgmEditMode(true);
                                }}
                                className="h-10 rounded-xl bg-[#0f1f35] px-5 text-xs font-semibold text-white"
                            >
                                Add / Edit EGM Details
                            </button>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="h-10 rounded-xl bg-[#0f1f35] px-5 text-xs font-semibold text-white disabled:opacity-60"
                                >
                                    {saving ? "Saving..." : "Save EGM"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEgmEditMode(false);
                                        loadBill();
                                    }}
                                    disabled={saving}
                                    className="h-10 rounded-xl border border-[#d9d5cc] bg-white px-5 text-xs font-semibold text-[#344054] disabled:opacity-60"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                        <Field
                            label="Final EGM Number"
                            name="egm_number"
                            value={bill.egm_number || ""}
                            editMode={egmEditMode}
                            onChange={handleBillChange}
                            required
                        />

                        <Field
                            label="Final EGM Date"
                            name="egm_date"
                            value={bill.egm_date || ""}
                            editMode={egmEditMode}
                            onChange={handleBillChange}
                            type="date"
                            required
                        />
                    </div>

                    {egmEditMode && (
                        <p className="mt-3 text-[11px] text-[#667085]">
                            Save the EGM details first. After saving, the <b>Submit to AC Customs</b> action will become available.
                        </p>
                    )}
                </section>
            )}


            {/* =================================================
                MESSAGES
            ================================================= */}

            {error && (

                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">

                    {error}

                </div>

            )}


            {success && (

                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">

                    {success}

                </div>

            )}


            {/* =================================================
                TABS
            ================================================= */}

            <div className="mt-6 flex overflow-x-auto border-b border-[#e3dfd6]">

                {SECTIONS.map(
                    (
                        section,
                        index
                    ) => (

                        <button
                            key={
                                section
                            }
                            type="button"
                            onClick={() =>
                                setActiveSection(
                                    index
                                )
                            }
                            className={[
                                "whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-semibold",

                                activeSection ===
                                index
                                    ? "border-[#b77a12] text-[#172033]"
                                    : "border-transparent text-[#8a8f98]",
                            ].join(" ")}
                        >

                            {index + 1}.
                            {" "}
                            {section}

                        </button>

                    )
                )}

            </div>


            {/* =================================================
                CONTENT
            ================================================= */}

            <section className="mt-5 rounded-xl border border-[#e3dfd6] bg-white p-5">


                {/* =================================================
                    1 GENERAL
                ================================================= */}

                {activeSection === 0 && (

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

                        <Field
                            label="Exporter Type"
                            name="exporter_type"
                            value={
                                bill.exporter_type
                            }
                            editMode={
                                editMode
                            }
                            onChange={
                                handleBillChange
                            }
                            options={[
                                {
                                    value:
                                        "Manufacturer Exporter",
                                    label:
                                        "Manufacturer Exporter",
                                },
                                {
                                    value:
                                        "Merchant Exporter",
                                    label:
                                        "Merchant Exporter",
                                },
                            ]}
                        />


                        <Field
                            label="Exporter Name"
                            name="exporter_name"
                            value={
                                bill.exporter_name
                            }
                            editMode={
                                editMode
                            }
                            onChange={
                                handleBillChange
                            }
                        />


                        <Field
                            label="Destination Country"
                            name="destination_country"
                            value={
                                bill.destination_country
                            }
                            editMode={
                                editMode
                            }
                            onChange={
                                handleBillChange
                            }
                        />


                        <Field
                            label="Destination Company"
                            name="destination_company_name"
                            value={
                                bill.destination_company_name
                            }
                            editMode={
                                editMode
                            }
                            onChange={
                                handleBillChange
                            }
                        />


                        <div className="md:col-span-2 lg:col-span-3">

                            <label
                                className={
                                    labelClassName
                                }
                            >
                                Destination Address
                            </label>


                            {editMode ? (

                                <textarea
                                    name="destination_address"
                                    value={
                                        bill.destination_address ||
                                        ""
                                    }
                                    onChange={
                                        handleBillChange
                                    }
                                    className={
                                        textareaClassName
                                    }
                                />

                            ) : (

                                <p className="mt-2 whitespace-pre-wrap text-xs text-[#172033]">

                                    {
                                        formatValue(
                                            bill.destination_address
                                        )
                                    }

                                </p>

                            )}

                        </div>

                        <div className="md:col-span-2 lg:col-span-3 mt-1 border-t border-[#e3dfd6] pt-5">
                            <div className="mb-4">
                                <p className="text-xs font-bold text-[#172033]">
                                    Login Company Details
                                </p>
                                <p className="mt-1 text-[11px] text-[#667085]">
                                    Automatically loaded from the logged-in user's company details. These fields are read-only.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                                <CompanyField
                                    label="Company Name"
                                    value={bill.exporter_company_name}
                                />

                                <CompanyField
                                    label="Company Address"
                                    value={bill.exporter_company_address}
                                />

                                <CompanyField
                                    label="IEC"
                                    value={bill.exporter_iec}
                                    mono
                                />

                                <CompanyField
                                    label="GSTIN"
                                    value={bill.exporter_gstin}
                                    mono
                                />
                            </div>
                        </div>
                    </div>
                )}


                {/* =================================================
                    2 SHIPMENT
                ================================================= */}

                {activeSection === 1 && (

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

                        <Field
                            label="Mode of Transport"
                            name="mode_of_transport"
                            value={
                                bill.mode_of_transport
                            }
                            editMode={
                                editMode
                            }
                            onChange={
                                handleBillChange
                            }
                            options={[
                                {
                                    value:
                                        "SEA",
                                    label:
                                        "Sea",
                                },
                                {
                                    value:
                                        "AIR",
                                    label:
                                        "Air",
                                },
                                {
                                    value:
                                        "ROAD",
                                    label:
                                        "Road",
                                },
                            ]}
                        />


                        <Field
                            label="Port of Loading"
                            name="port_of_loading"
                            value={
                                bill.port_of_loading
                            }
                            editMode={
                                editMode
                            }
                            onChange={
                                handleBillChange
                            }
                        />


                        <Field
                            label="Port of Discharge"
                            name="port_of_discharge"
                            value={
                                bill.port_of_discharge
                            }
                            editMode={
                                editMode
                            }
                            onChange={
                                handleBillChange
                            }
                        />

                    </div>

                )}


                {/* =================================================
                    3 BL
                ================================================= */}

                {activeSection === 2 && (

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">

                        <Field
                            label="BL Number"
                            name="bl_number"
                            value={
                                bill.bl_number
                            }
                            editMode={
                                editMode
                            }
                            onChange={
                                handleBillChange
                            }
                        />


                        <Field
                            label="BL Date"
                            name="bl_date"
                            value={
                                bill.bl_date
                            }
                            editMode={
                                editMode
                            }
                            onChange={
                                handleBillChange
                            }
                            type="date"
                        />


                        <Field
                            label="Vessel Name"
                            name="vessel_name"
                            value={
                                bill.vessel_name
                            }
                            editMode={
                                editMode
                            }
                            onChange={
                                handleBillChange
                            }
                        />


                        <Field
                            label="Voyage Number"
                            name="voyage_number"
                            value={
                                bill.voyage_number
                            }
                            editMode={
                                editMode
                            }
                            onChange={
                                handleBillChange
                            }
                        />


                        <Field
                            label="Container Number"
                            name="container_number"
                            value={
                                bill.container_number
                            }
                            editMode={
                                editMode
                            }
                            onChange={
                                handleBillChange
                            }
                        />


                        <Field
                            label="Seal Number"
                            name="seal_number"
                            value={
                                bill.seal_number
                            }
                            editMode={
                                editMode
                            }
                            onChange={
                                handleBillChange
                            }
                        />

                    </div>

                )}


                {/* =================================================
                    4 INVOICE
                ================================================= */}

                {activeSection === 3 && (

                    <div className="space-y-5">

                        <div className="flex items-center justify-between gap-3">

                            <div>

                                <h2 className="text-sm font-bold text-[#172033]">
                                    Invoice Details
                                </h2>

                                <p className="mt-1 text-xs text-[#667085]">
                                    Invoice Number, Invoice Date, Currency and Exchange Rate.
                                </p>

                            </div>


                            {editMode && (

                                <button
                                    type="button"
                                    onClick={
                                        addInvoice
                                    }
                                    className="h-9 rounded-xl bg-[#0f1f35] px-4 text-xs font-semibold text-white"
                                >
                                    + Add Invoice
                                </button>

                            )}

                        </div>


                        {invoices.length === 0 ? (

                            <div className="rounded-xl border border-dashed border-[#d9d5cc] p-8 text-center text-xs text-[#667085]">

                                No invoice details available.

                                {editMode && (

                                    <button
                                        type="button"
                                        onClick={
                                            addInvoice
                                        }
                                        className="ml-2 font-semibold text-[#0f1f35] underline"
                                    >
                                        Add Invoice
                                    </button>

                                )}

                            </div>

                        ) : (

                            invoices.map(
                                (
                                    invoice,
                                    invoiceIndex
                                ) => (

                                    <div
                                        key={
                                            invoiceIndex
                                        }
                                        className="rounded-xl border border-[#e3dfd6] bg-[#faf9f6] p-4"
                                    >

                                        <div className="mb-4 flex items-center justify-between">

                                            <p className="text-xs font-bold text-[#172033]">
                                                Invoice{" "}
                                                {
                                                    invoiceIndex +
                                                    1
                                                }
                                            </p>


                                            {editMode && (

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeInvoice(
                                                            invoiceIndex
                                                        )
                                                    }
                                                    className="text-xs font-semibold text-red-600"
                                                >
                                                    Remove
                                                </button>

                                            )}

                                        </div>


                                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">

                                            <Field
                                                label="Invoice Number"
                                                name="invoice_number"
                                                value={
                                                    invoice.invoice_number
                                                }
                                                editMode={
                                                    editMode
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    handleInvoiceChange(
                                                        invoiceIndex,
                                                        event
                                                    )
                                                }
                                            />


                                            <Field
                                                label="Invoice Date"
                                                name="invoice_date"
                                                value={
                                                    invoice.invoice_date
                                                }
                                                editMode={
                                                    editMode
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    handleInvoiceChange(
                                                        invoiceIndex,
                                                        event
                                                    )
                                                }
                                                type="date"
                                                max={getTodayISO()}
                                            />


                                            <Field
                                                label="Currency"
                                                name="currency"
                                                value={
                                                    invoice.currency
                                                }
                                                editMode={
                                                    editMode
                                                }
                                                onChange={(
                                                    event
                                                ) =>
                                                    handleInvoiceChange(
                                                        invoiceIndex,
                                                        event
                                                    )
                                                }
                                                options={[
                                                    {
                                                        value:
                                                            "INR",
                                                        label:
                                                            "INR",
                                                    },
                                                    {
                                                        value:
                                                            "USD",
                                                        label:
                                                            "USD",
                                                    },
                                                    {
                                                        value:
                                                            "EUR",
                                                        label:
                                                            "EUR",
                                                    },
                                                    {
                                                        value:
                                                            "GBP",
                                                        label:
                                                            "GBP",
                                                    },
                                                    {
                                                        value:
                                                            "AED",
                                                        label:
                                                            "AED",
                                                    },
                                                ]}
                                            />


                                            {invoice.currency !== "INR" && (
                                                <Field
                                                    label="Exchange Rate"
                                                    name="exchange_rate"
                                                    value={
                                                        invoice.exchange_rate
                                                    }
                                                    editMode={
                                                        editMode
                                                    }
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        handleInvoiceChange(
                                                            invoiceIndex,
                                                            event
                                                        )
                                                    }
                                                    type="number"
                                                />
                                            )}

                                        </div>

                                    </div>

                                )
                            )

                        )}

                    </div>

                )}


                {/* =================================================
                    5 ITEMS
                ================================================= */}

                {activeSection === 4 && (

                    <div className="space-y-6">

                        <div className="flex flex-wrap items-center justify-between gap-3">

                            <div>

                                <h2 className="text-sm font-bold text-[#172033]">
                                    Item Details
                                </h2>

                                <p className="mt-1 text-xs text-[#667085]">
                                    HSN Search fills Description and Unit. You can edit them before saving.
                                </p>

                            </div>


                            {invoices.length > 0 && (

                                <select
                                    value={
                                        itemInvoiceIndex
                                    }
                                    onChange={(
                                        event
                                    ) => {

                                        setItemInvoiceIndex(
                                            Number(
                                                event.target.value
                                            )
                                        );

                                        setItemDraft(
                                            emptyItem()
                                        );

                                        setEditingItemIndex(
                                            null
                                        );

                                        setHsnError("");

                                    }}
                                    className="h-9 rounded-xl border border-[#d9d5cc] bg-white px-3 text-xs"
                                >

                                    {invoices.map(
                                        (
                                            invoice,
                                            index
                                        ) => (

                                            <option
                                                key={
                                                    index
                                                }
                                                value={
                                                    index
                                                }
                                            >
                                                Invoice{" "}
                                                {
                                                    index +
                                                    1
                                                }
                                                {" - "}
                                                {
                                                    invoice.invoice_number ||
                                                    "New"
                                                }
                                            </option>

                                        )
                                    )}

                                </select>

                            )}

                        </div>


                        {editMode &&
                            selectedInvoice && (

                                <div className="rounded-xl border border-[#e3dfd6] bg-[#faf9f6] p-4">

                                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">


                                        {/* HSN */}

                                        <div>

                                            <label
                                                className={
                                                    labelClassName
                                                }
                                            >
                                                HSN Code
                                            </label>


                                            <div className="mt-1.5 flex gap-2">

                                                <input
                                                    name="hsn_code"
                                                    value={
                                                        itemDraft.hsn_code
                                                    }
                                                    onChange={
                                                        handleItemDraftChange
                                                    }
                                                    className={
                                                        inputClassName
                                                    }
                                                    placeholder="Enter HSN Code"
                                                />


                                                <button
                                                    type="button"
                                                    onClick={
                                                        handleHSNSearch
                                                    }
                                                    disabled={
                                                        hsnLoading
                                                    }
                                                    className="h-10 rounded-xl bg-[#0f1f35] px-4 text-xs font-semibold text-white disabled:opacity-60"
                                                >
                                                    {
                                                        hsnLoading
                                                            ? "Searching..."
                                                            : "Search"
                                                    }
                                                </button>

                                            </div>


                                            {hsnError && (

                                                <p className="mt-2 text-[11px] text-red-600">
                                                    {
                                                        hsnError
                                                    }
                                                </p>

                                            )}

                                        </div>


                                        <Field
                                            label="Item Description"
                                            name="description"
                                            value={
                                                itemDraft.description
                                            }
                                            editMode={
                                                true
                                            }
                                            onChange={
                                                handleItemDraftChange
                                            }
                                        />


                                        <Field
                                            label="Unit of Measurement"
                                            name="unit_of_measurement"
                                            value={
                                                itemDraft.unit_of_measurement
                                            }
                                            editMode={
                                                true
                                            }
                                            onChange={
                                                handleItemDraftChange
                                            }
                                        />


                                        <Field
                                            label="Quantity"
                                            name="quantity"
                                            value={
                                                itemDraft.quantity
                                            }
                                            editMode={
                                                true
                                            }
                                            onChange={
                                                handleItemDraftChange
                                            }
                                            type="number"
                                        />


                                        <Field
                                            label="Unit Price"
                                            name="unit_price"
                                            value={
                                                itemDraft.unit_price
                                            }
                                            editMode={
                                                true
                                            }
                                            onChange={
                                                handleItemDraftChange
                                            }
                                            type="number"
                                        />


                                        <Field
                                            label="Total Value"
                                            name="total_value"
                                            value={
                                                itemDraft.total_value
                                            }
                                            editMode={
                                                true
                                            }
                                            readOnly
                                        />

                                    </div>

                                    <div className="mt-4 flex gap-2">

                                        <button
                                            type="button"
                                            onClick={
                                                saveItem
                                            }
                                            className="h-9 rounded-xl bg-[#0f1f35] px-4 text-xs font-semibold text-white"
                                        >
                                            {
                                                editingItemIndex ===
                                                null
                                                    ? "Add Item"
                                                    : "Update Item"
                                            }
                                        </button>


                                        {editingItemIndex !==
                                            null && (

                                            <button
                                                type="button"
                                                onClick={() => {

                                                    setItemDraft(
                                                        emptyItem()
                                                    );

                                                    setEditingItemIndex(
                                                        null
                                                    );

                                                    setHsnError("");

                                                }}
                                                className="h-9 rounded-xl border border-[#d9d5cc] bg-white px-4 text-xs font-semibold text-[#344054]"
                                            >
                                                Clear
                                            </button>

                                        )}

                                    </div>

                                </div>

                            )}


                        {invoices.map(
                            (
                                invoice,
                                invoiceIndex
                            ) => (

                                <div
                                    key={
                                        invoiceIndex
                                    }
                                    className="rounded-xl border border-[#e3dfd6] bg-white"
                                >

                                    <div className="border-b border-[#e3dfd6] px-4 py-3">

                                        <p className="text-xs font-bold text-[#172033]">

                                            Invoice{" "}
                                            {
                                                invoiceIndex +
                                                1
                                            }

                                            :
                                            {" "}
                                            {
                                                invoice.invoice_number ||
                                                "—"
                                            }

                                        </p>

                                    </div>


                                    {
                                        (
                                            invoice.items ||
                                            []
                                        ).length ===
                                        0 ? (

                                            <p className="px-4 py-5 text-xs text-[#667085]">
                                                No items.
                                            </p>

                                        ) : (

                                            <div className="overflow-x-auto">

                                                <table className="min-w-full text-left">

                                                    <thead className="border-b border-[#e3dfd6]">

                                                        <tr className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#8a8f98]">

                                                            <th className="px-4 py-3">
                                                                HSN Code
                                                            </th>

                                                            <th className="px-4 py-3">
                                                                Item Description
                                                            </th>

                                                            <th className="px-4 py-3">
                                                                Unit
                                                            </th>

                                                            <th className="px-4 py-3">
                                                                Quantity
                                                            </th>

                                                            <th className="px-4 py-3">
                                                                Unit Price
                                                            </th>

                                                            <th className="px-4 py-3">
                                                                Total Value
                                                            </th>

                                                            <th className="px-4 py-3">
                                                                Tax / Duty
                                                            </th>

                                                            <th className="px-4 py-3">
                                                                Duty Amount
                                                            </th>

                                                            {editMode && (

                                                                <th className="px-4 py-3">
                                                                    Action
                                                                </th>

                                                            )}

                                                        </tr>

                                                    </thead>


                                                    <tbody>

                                                        {(
                                                            invoice.items ||
                                                            []
                                                        ).map(
                                                            (
                                                                item,
                                                                itemIndex
                                                            ) => (

                                                                <tr
                                                                    key={
                                                                        itemIndex
                                                                    }
                                                                    className="border-b border-[#f0ede5] last:border-b-0"
                                                                >

                                                                    <td className="px-4 py-3 text-xs">
                                                                        {
                                                                            formatValue(
                                                                                item.hsn_code
                                                                            )
                                                                        }
                                                                    </td>

                                                                    <td className="px-4 py-3 text-xs">
                                                                        {
                                                                            formatValue(
                                                                                item.description
                                                                            )
                                                                        }
                                                                    </td>

                                                                    <td className="px-4 py-3 text-xs">
                                                                        {
                                                                            formatValue(
                                                                                item.unit_of_measurement
                                                                            )
                                                                        }
                                                                    </td>

                                                                    <td className="px-4 py-3 text-xs">
                                                                        {
                                                                            formatValue(
                                                                                item.quantity
                                                                            )
                                                                        }
                                                                    </td>

                                                                    <td className="px-4 py-3 text-xs">
                                                                        {
                                                                            formatValue(
                                                                                item.unit_price
                                                                            )
                                                                        }
                                                                    </td>

                                                                    <td className="px-4 py-3 text-xs font-semibold">
                                                                        {
                                                                            formatValue(
                                                                                item.total_value
                                                                            )
                                                                        }
                                                                    </td>

                                                                    <td className="px-4 py-3 text-xs font-semibold">
                                                                        {getItemTaxRate(invoice, item) > 0 ? `${getItemTaxRate(invoice, item).toFixed(2)}%` : "—"}
                                                                    </td>

                                                                    <td className="px-4 py-3 text-xs font-semibold text-[#b77a12]">
                                                                        {getItemDutyAmount(invoice, item).toFixed(2)}
                                                                    </td>


                                                                    {editMode && (

                                                                        <td className="px-4 py-3">

                                                                            <div className="flex gap-2">

                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        editItem(
                                                                                            invoiceIndex,
                                                                                            itemIndex
                                                                                        )
                                                                                    }
                                                                                    className="text-xs font-semibold text-[#0f1f35]"
                                                                                >
                                                                                    Edit
                                                                                </button>


                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        removeItem(
                                                                                            invoiceIndex,
                                                                                            itemIndex
                                                                                        )
                                                                                    }
                                                                                    className="text-xs font-semibold text-red-600"
                                                                                >
                                                                                    Remove
                                                                                </button>

                                                                            </div>

                                                                        </td>

                                                                    )}

                                                                </tr>

                                                            )
                                                        )}

                                                    </tbody>

                                                    <tfoot>
                                                        <tr className="border-t border-[#d9d5cc] bg-[#faf9f6]">
                                                            <td
                                                                colSpan={5}
                                                                className="px-4 py-3 text-right text-xs font-bold text-[#172033]"
                                                            >
                                                                Invoice Total ({invoice.currency || "INR"})
                                                            </td>
                                                            <td className="px-4 py-3 text-xs font-bold text-[#172033]">
                                                                {getInvoiceItemsTotal(invoice).toFixed(2)}
                                                            </td>
                                                            <td className="px-4 py-3 text-xs font-bold text-[#b77a12]">
                                                                Total Duty (INR)
                                                            </td>
                                                            <td className="px-4 py-3 text-xs font-bold text-[#b77a12]">
                                                                {getInvoiceDutyTotal(invoice).toFixed(2)}
                                                            </td>
                                                            {editMode && (
                                                                <td className="px-4 py-3" />
                                                            )}
                                                        </tr>
                                                        <tr className="bg-[#faf9f6]">
                                                            <td
                                                                colSpan={5}
                                                                className="px-4 py-2 text-right text-[11px] font-semibold text-[#667085]"
                                                            >
                                                                Invoice Total (INR)
                                                            </td>
                                                            <td className="px-4 py-2 text-xs font-bold text-[#172033]">
                                                                ₹ {getInvoiceItemsTotalINR(invoice).toFixed(2)}
                                                            </td>
                                                            <td colSpan={2} />
                                                            {editMode && (
                                                                <td className="px-4 py-2" />
                                                            )}
                                                        </tr>
                                                    </tfoot>

                                                </table>

                                            </div>

                                        )
                                    }

                                </div>

                            )
                        )}

                        {invoices.length > 0 && (
                            <div className="mt-5 rounded-2xl border border-[#e3dfd6] bg-white p-5">
                            <div className="mb-4">
                                <p className="text-xs font-bold text-[#172033]">
                                    Invoice Summary
                                </p>
                                <p className="mt-1 text-[11px] text-[#667085]">
                                    Combined totals for all invoices in this shipping bill.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <div className="rounded-xl border border-[#e3dfd6] bg-[#faf9f6] p-4">
                                    <p className={labelClassName}>Invoice Count</p>
                                    <p className="mt-2 text-lg font-bold text-[#172033]">
                                        {invoices.length}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[#e3dfd6] bg-[#faf9f6] p-4">
                                    <p className={labelClassName}>Total Invoice Value (INR)</p>
                                    <p className="mt-2 text-lg font-bold text-[#172033]">
                                        ₹ {formatINRAmount(getAllInvoicesItemsTotalINR())} INR
                                    </p>
                                    <p className="mt-2 text-[11px] leading-5 text-[#667085]">
                                        {numberToIndianWords(getAllInvoicesItemsTotalINR())}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[#e3dfd6] bg-[#faf9f6] p-4">
                                    <p className={labelClassName}>Total Duty Amount (INR)</p>
                                    <p className="mt-2 text-lg font-bold text-[#b77a12]">
                                        ₹ {formatINRAmount(getAllInvoicesDutyTotal())} INR
                                    </p>
                                    <p className="mt-2 text-[11px] leading-5 text-[#667085]">
                                        {numberToIndianWords(getAllInvoicesDutyTotal())}
                                    </p>
                                </div>
                            </div>
                        </div>
                        )}

                    </div>

                )}


                {/* =================================================
                    ALL INVOICE SUMMARY - INVOICE DETAILS
                ================================================= */}

                {activeSection === 3 && invoices.length > 0 && (
                    <div className="mt-5 rounded-2xl border border-[#e3dfd6] bg-white p-5">

                        <div className="mb-4">
                            <p className="text-xs font-bold text-[#172033]">
                                Invoice Summary
                            </p>
                            <p className="mt-1 text-[11px] text-[#667085]">
                                Combined totals for all invoices in this shipping bill.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                            <div className="rounded-xl border border-[#e3dfd6] bg-[#faf9f6] p-4">
                                <p className={labelClassName}>
                                    Invoice Count
                                </p>
                                <p className="mt-2 text-lg font-bold text-[#172033]">
                                    {invoices.length}
                                </p>
                            </div>

                            <div className="rounded-xl border border-[#e3dfd6] bg-[#faf9f6] p-4">
                                <p className={labelClassName}>
                                    Total Invoice Value (INR)
                                </p>
                                <p className="mt-2 text-lg font-bold text-[#172033]">
                                    ₹ {formatINRAmount(getAllInvoicesItemsTotalINR())} INR
                                </p>
                                <p className="mt-2 text-[11px] leading-5 text-[#667085]">
                                    {numberToIndianWords(getAllInvoicesItemsTotalINR())}
                                </p>
                            </div>

                            <div className="rounded-xl border border-[#e3dfd6] bg-[#faf9f6] p-4">
                                <p className={labelClassName}>
                                    Total Duty Amount (INR)
                                </p>
                                <p className="mt-2 text-lg font-bold text-[#b77a12]">
                                    ₹ {formatINRAmount(getAllInvoicesDutyTotal())} INR
                                </p>
                                <p className="mt-2 text-[11px] leading-5 text-[#667085]">
                                    {numberToIndianWords(getAllInvoicesDutyTotal())}
                                </p>
                            </div>

                        </div>

                    </div>
                )}


                {/* =================================================
                    6 DOCUMENTS
                ================================================= */}

                {activeSection === 5 && (
                    <div className="space-y-5">
                        <div>
                            <h2 className="text-sm font-bold text-[#172033]">
                                Shipping Bill Documents
                            </h2>
                            <p className="mt-1 text-xs text-[#667085]">
                                Add multiple Invoice, Packing List and BL documents.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {DOCUMENT_TYPES.map((type) => {
                                const documents = (bill.documents || []).filter(
                                    (item) => item.document_type === type.key
                                );

                                return (
                                    <DocumentGroup
                                        key={type.key}
                                        documentType={type.key}
                                        documents={documents}
                                        files={documentFiles[type.key] || []}
                                        editMode={editMode}
                                        onAddFile={handleDocumentFile}
                                        onDeleteDocument={handleDeleteDocument}
                                        onViewDocument={setPreviewDocument}
                                    />
                                );
                            })}
                        </div>

                        {editMode && (
                            <p className="text-[11px] text-[#8a8f98]">
                                Add as many documents as needed, then click <b>Save Changes</b>.
                                Existing documents stay unchanged unless you delete them.
                            </p>
                        )}
                    </div>
                )}

                {/* =================================================
                    7 QUERY
                ================================================= */}

                {activeSection === 6 && (
                    <div className="space-y-6">
                        <div>
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-bold text-[#172033]">
                                        Query & Response
                                    </h2>
                                    <p className="mt-1 text-xs text-[#667085]">
                                        View the complete query history and respond to DC Customs or forward the query to Unit Maker.
                                    </p>
                                </div>

                                {activeQuery && !activeQuery.is_resolved && (
                                    <span className="rounded-full bg-[#fff3d6] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#9a650d]">
                                        Action Required
                                    </span>
                                )}
                            </div>
                        </div>

                        {queries.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-[#d9d5cc] bg-[#faf9f6] p-6 text-center text-xs text-[#667085]">
                                No queries have been raised for this Shipping Bill.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {[...queries].reverse().map((query, index) => (
                                    <div key={query.id || index} className="rounded-xl border border-[#e3dfd6] bg-[#faf9f6] p-5">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-xs font-bold text-[#172033]">
                                                Query #{queries.length - index}
                                            </p>
                                            <span className={
                                                query.is_resolved
                                                    ? "rounded-full bg-[#eaf7ef] px-3 py-1 text-[10px] font-bold text-[#287a48]"
                                                    : "rounded-full bg-[#fff3d6] px-3 py-1 text-[10px] font-bold text-[#9a650d]"
                                            }>
                                                {query.is_resolved ? "Resolved" : "Open"}
                                            </span>
                                        </div>

                                        <div className="mt-4 space-y-4">
                                            {query.raised_by_role === "UNIT_APPROVER" ? (
                                                query.approver_message && (
                                                    <div>
                                                        <p className={labelClassName}>Unit Approver Message</p>
                                                        <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#172033]">
                                                            {query.approver_message}
                                                        </p>
                                                    </div>
                                                )
                                            ) : (
                                                <>
                                                    <div>
                                                        <p className={labelClassName}>Customs Query</p>
                                                        <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#172033]">
                                                            {formatValue(query.question)}
                                                        </p>
                                                    </div>

                                                    {query.approver_message && (
                                                        <div>
                                                            <p className={labelClassName}>Unit Approver Message</p>
                                                            <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#172033]">
                                                                {query.approver_message}
                                                            </p>
                                                        </div>
                                                    )}
                                                </>
                                            )}

                                            {query.response && (
                                                <div>
                                                    <p className={labelClassName}>Response</p>
                                                    <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#172033]">
                                                        {query.response}
                                                    </p>
                                                </div>
                                            )}

                                            {query.responded_at && (
                                                <p className="text-[11px] text-[#667085]">
                                                    Responded: {new Date(query.responded_at).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {bill.status === "SUBMITTED_TO_APPROVER" && (!activeQuery || activeQuery.is_resolved) && (
                            <div className="rounded-xl border border-[#0f1f35]/20 bg-white p-5">
                                <p className="text-sm font-bold text-[#172033]">Send Query to Unit Maker</p>
                                <p className="mt-1 text-xs text-[#667085]">
                                    Ask the Unit Maker to correct the Shipping Bill. The message will remain in Query & Response history.
                                </p>
                                <textarea
                                    value={approverMessage}
                                    onChange={(event) => setApproverMessage(event.target.value)}
                                    placeholder="Enter the correction message for Unit Maker..."
                                    className={textareaClassName + " min-h-32"}
                                    disabled={queryLoading || editMode}
                                />
                                <button
                                    type="button"
                                    onClick={handleRaiseMakerQuery}
                                    disabled={queryLoading || editMode || !approverMessage.trim()}
                                    className="mt-4 h-9 rounded-xl bg-[#0f1f35] px-5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {queryLoading ? "Sending..." : "Send Back to Unit Maker"}
                                </button>
                            </div>
                        )}

                        {activeQuery && !activeQuery.is_resolved && bill.status === "QUERY_RAISED" && (
                            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                                <div className="rounded-xl border border-[#b77a12]/30 bg-[#fffaf0] p-5">
                                    <p className="text-sm font-bold text-[#172033]">Respond to DC Customs</p>
                                    <p className="mt-1 text-xs text-[#667085]">
                                        Edit and save the Shipping Bill first if corrections are required, then respond to the Customs query.
                                    </p>
                                    <textarea
                                        value={queryResponse}
                                        onChange={(event) => setQueryResponse(event.target.value)}
                                        placeholder="Enter your response to DC Customs..."
                                        className={textareaClassName + " min-h-32"}
                                        disabled={queryLoading || editMode}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleQueryResponse}
                                        disabled={queryLoading || editMode || !queryResponse.trim()}
                                        className="mt-4 h-9 rounded-xl bg-[#b77a12] px-5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {queryLoading ? "Responding..." : "Respond to DC"}
                                    </button>
                                </div>

                                <div className="rounded-xl border border-[#0f1f35]/20 bg-white p-5">
                                    <p className="text-sm font-bold text-[#172033]">Forward Query to Unit Maker</p>
                                    <p className="mt-1 text-xs text-[#667085]">
                                        Ask the Unit Maker to correct the Shipping Bill and respond to the query.
                                    </p>
                                    <textarea
                                        value={approverMessage}
                                        onChange={(event) => setApproverMessage(event.target.value)}
                                        placeholder="Enter instructions for Unit Maker..."
                                        className={textareaClassName + " min-h-32"}
                                        disabled={queryLoading}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleForwardQuery}
                                        disabled={queryLoading || !approverMessage.trim()}
                                        className="mt-4 h-9 rounded-xl bg-[#0f1f35] px-5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {queryLoading ? "Forwarding..." : "Forward Query to Unit Maker"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeQuery && !activeQuery.is_resolved && bill.status === "QUERY_FORWARDED" && (
                            <div className="rounded-xl border border-[#ead9b8] bg-[#fffaf0] p-5">
                                <p className="text-sm font-bold text-[#172033]">Query Forwarded to Unit Maker</p>
                                <p className="mt-1 text-xs text-[#667085]">
                                    Waiting for the Unit Maker to correct the Shipping Bill and respond.
                                </p>
                            </div>
                        )}

                        {(bill.status === "QUERY_RESPONDED" || bill.status === "MAKER_RESPONDED") && activeQuery && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                                <p className="text-sm font-bold text-emerald-800">Query Response Ready for Review</p>
                                <p className="mt-1 text-xs text-emerald-700">
                                    Review the response and submit the Shipping Bill to DC Customs when ready.
                                </p>
                            </div>
                        )}
                    </div>
                )}


            </section>

        {previewDocument && (
            <DocumentViewer
                document={previewDocument}
                onClose={() => setPreviewDocument(null)}
            />
        )}

        </div>
    );
}