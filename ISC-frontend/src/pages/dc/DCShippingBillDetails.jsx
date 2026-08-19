import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import DocumentViewer from "../../components/DocumentViewer";

import {
    getDCShippingBill,
    letExportShippingBill,
    raiseShippingBillQuery,
} from "../../services/dcShippingBillService";


function Field({ label, value, mono = false }) {
    return (
        <div className="py-3">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                {label}
            </p>

            <p className={mono ? "font-mono font-medium" : "font-medium"}>
                {value === null || value === undefined || value === ""
                    ? "—"
                    : String(value)}
            </p>
        </div>
    );
}


function SectionTitle({ children }) {
    return (
        <div className="border-b pb-3 mb-2">
            <h2 className="text-lg font-semibold text-gray-900">
                {children}
            </h2>
        </div>
    );
}


export default function DCShippingBillDetails() {

    const { id } = useParams();

    const navigate = useNavigate();

    const [bill, setBill] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [saving, setSaving] = useState(false);

    const [showQueryBox, setShowQueryBox] = useState(false);

    const [query, setQuery] = useState("");

    const [previewDocument, setPreviewDocument] = useState(null);


    // =====================================================
    // LOAD SHIPPING BILL
    // =====================================================

    const loadBill = async () => {

        try {

            setLoading(true);

            setError("");

            const response =
                await getDCShippingBill(id);

            console.log(
                "DC Shipping Bill Details:",
                response.data
            );

            setBill(response.data);

        } catch (err) {

            console.error(
                "DC Shipping Bill Details Error:",
                err.response?.data || err
            );

            setError(
                err.response?.data?.error ||
                "Unable to load Shipping Bill."
            );

        } finally {

            setLoading(false);

        }

    };


    // =====================================================
    // LET EXPORT
    // =====================================================

    const handleLetExport = async () => {

        if (!bill?.documents?.length) {

            setError(
                "At least one Shipping Bill document must be uploaded before granting Let Export."
            );

            return;

        }

        const confirmed = window.confirm(
            "Are you sure you want to grant Let Export for this Shipping Bill?"
        );

        if (!confirmed) {
            return;
        }

        try {

            setSaving(true);

            setError("");

            const response =
                await letExportShippingBill(id);

            console.log(
                "Let Export Response:",
                response.data
            );

            setBill(
                response.data.shipping_bill
            );

            alert(
                "Let Export granted successfully."
            );

        } catch (err) {

            console.error(
                "Let Export Error:",
                err.response?.data || err
            );

            setError(
                err.response?.data?.error ||
                "Unable to grant Let Export."
            );

        } finally {

            setSaving(false);

        }

    };


    // =====================================================
    // RAISE CUSTOMS QUERY
    // =====================================================

    const handleRaiseQuery = async () => {

        if (!query.trim()) {

            alert(
                "Please enter the Customs query."
            );

            return;

        }

        const confirmed = window.confirm(
            "Are you sure you want to raise this Customs query?"
        );

        if (!confirmed) {
            return;
        }

        try {

            setSaving(true);

            setError("");

            const response =
                await raiseShippingBillQuery(
                    id,
                    query.trim()
                );

            console.log(
                "Raise Query Response:",
                response.data
            );

            setBill(
                response.data.shipping_bill
            );

            setQuery("");

            setShowQueryBox(false);

            alert(
                "Customs query raised successfully."
            );

        } catch (err) {

            console.error(
                "Raise Query Error:",
                err.response?.data || err
            );

            setError(
                err.response?.data?.error ||
                "Unable to raise Customs query."
            );

        } finally {

            setSaving(false);

        }

    };


    // =====================================================
    // LOAD PAGE
    // =====================================================

    useEffect(() => {

        loadBill();

    }, [id]);


    // =====================================================
    // LOADING
    // =====================================================

    if (loading) {

        return (

            <div className="p-8">

                <p className="text-gray-500">
                    Loading Shipping Bill...
                </p>

            </div>

        );

    }


    // =====================================================
    // ERROR
    // =====================================================

    if (error && !bill) {

        return (

            <div className="p-8">

                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded">

                    {error}

                </div>

            </div>

        );

    }


    // =====================================================
    // NOT FOUND
    // =====================================================

    if (!bill) {

        return (

            <div className="p-8">

                Shipping Bill not found.

            </div>

        );

    }


    const documents =
        Array.isArray(bill.documents)
            ? bill.documents
            : [];

    const invoices =
        Array.isArray(bill.invoices)
            ? bill.invoices
            : [];

    const items =
        Array.isArray(bill.items)
            ? bill.items
            : [];

    const queries =
        Array.isArray(bill.queries)
            ? bill.queries
            : [];

    const hasUploadedDocument =
        documents.length > 0;


    return (

        <div className="px-8 py-8 max-w-7xl mx-auto">

            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <div className="flex justify-between items-start mb-6">

                <div>

                    <p className="font-mono text-xs uppercase tracking-widest text-amber-600">
                        DC Customs / Assessment
                    </p>

                    <h1 className="text-3xl font-bold mt-1">
                        Shipping Bill Assessment
                    </h1>

                    <p className="text-sm text-gray-500 mt-2">
                        Complete Shipping Bill view from top to bottom.
                    </p>

                </div>


                <button
                    type="button"
                    onClick={() =>
                        navigate("/dc-dashboard/inbox")
                    }
                    className="border px-4 py-2 rounded-md hover:bg-gray-50"
                >
                    ← Back to Inbox
                </button>

            </div>


            {/* ================================================= */}
            {/* PAGE VIEW */}
            {/* ================================================= */}

            <div className="bg-white border rounded-lg px-7 py-5">

                {/* ================================================= */}
                {/* ERROR */}
                {/* ================================================= */}

                {error && (

                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">

                        {error}

                    </div>

                )}


                {/* ================================================= */}
                {/* REQUEST / IDENTIFICATION */}
                {/* ================================================= */}

                <SectionTitle>
                    Request & Identification
                </SectionTitle>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8">

                    <Field
                        label="Request ID"
                        value={bill.request_id}
                        mono
                    />

                    <Field
                        label="Shipping Bill No."
                        value={bill.shipping_bill_no}
                        mono
                    />

                    <Field
                        label="Shipping Bill Date"
                        value={bill.shipping_bill_date}
                    />

                    <Field
                        label="Status"
                        value={bill.status}
                    />

                    <Field
                        label="Created At"
                        value={
                            bill.created_at
                                ? new Date(
                                    bill.created_at
                                ).toLocaleString()
                                : null
                        }
                    />

                    <Field
                        label="Updated At"
                        value={
                            bill.updated_at
                                ? new Date(
                                    bill.updated_at
                                ).toLocaleString()
                                : null
                        }
                    />

                </div>


                <div className="border-t my-5" />


                {/* ================================================= */}
                {/* GENERAL DETAILS */}
                {/* ================================================= */}

                <SectionTitle>
                    General Details
                </SectionTitle>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8">

                    <Field
                        label="Exporter Type"
                        value={bill.exporter_type}
                    />

                    <Field
                        label="Exporter Name"
                        value={bill.exporter_name}
                    />

                    <Field
                        label="Exporter Company Name"
                        value={bill.exporter_company_name}
                    />

                    <Field
                        label="Exporter Company Address"
                        value={bill.exporter_company_address}
                    />

                    <Field
                        label="Exporter IEC"
                        value={bill.exporter_iec}
                        mono
                    />

                    <Field
                        label="Exporter GSTIN"
                        value={bill.exporter_gstin}
                        mono
                    />

                    <Field
                        label="Consignee Name"
                        value={bill.consignee_name}
                    />

                    <Field
                        label="Destination Country"
                        value={bill.destination_country}
                    />

                    <Field
                        label="Destination Company Name"
                        value={bill.destination_company_name}
                    />

                    <Field
                        label="Destination Address"
                        value={bill.destination_address}
                    />

                    <Field
                        label="Customs House Code"
                        value={bill.customs_house_code}
                        mono
                    />

                </div>


                <div className="border-t my-5" />


                {/* ================================================= */}
                {/* SHIPMENT DETAILS */}
                {/* ================================================= */}

                <SectionTitle>
                    Shipment Details
                </SectionTitle>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8">

                    <Field
                        label="Mode of Transport"
                        value={bill.mode_of_transport}
                    />

                    <Field
                        label="Port of Loading"
                        value={bill.port_of_loading}
                    />

                    <Field
                        label="Port of Discharge"
                        value={bill.port_of_discharge}
                    />

                    <Field
                        label="Container Number"
                        value={bill.container_number}
                        mono
                    />

                    <Field
                        label="Seal Number"
                        value={bill.seal_number}
                        mono
                    />

                </div>


                <div className="border-t my-5" />


                {/* ================================================= */}
                {/* BILL OF LADING */}
                {/* ================================================= */}

                <SectionTitle>
                    Bill of Lading
                </SectionTitle>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8">

                    <Field
                        label="BL Number"
                        value={bill.bl_number}
                        mono
                    />

                    <Field
                        label="BL Date"
                        value={bill.bl_date}
                    />

                    <Field
                        label="Vessel Name"
                        value={bill.vessel_name}
                    />

                    <Field
                        label="Voyage Number"
                        value={bill.voyage_number}
                    />

                </div>


                <div className="border-t my-5" />


                {/* ================================================= */}
                {/* INVOICE DETAILS */}
                {/* ================================================= */}

                <SectionTitle>
                    Invoice Details
                </SectionTitle>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8">

                    <Field
                        label="Invoice Number"
                        value={bill.invoice_number}
                        mono
                    />

                    <Field
                        label="Invoice Date"
                        value={bill.invoice_date}
                    />

                    <Field
                        label="Buyer Name"
                        value={bill.buyer_name}
                    />

                    <Field
                        label="Currency"
                        value={bill.currency}
                    />

                    <Field
                        label="Exchange Rate"
                        value={bill.exchange_rate}
                    />

                    <Field
                        label="Freight"
                        value={bill.freight}
                    />

                    <Field
                        label="Insurance"
                        value={bill.insurance}
                    />

                    <Field
                        label="Other Charges"
                        value={bill.other_charges}
                    />

                    <Field
                        label="Total Invoice Value"
                        value={bill.total_invoice_value}
                    />

                </div>


                {/* ================================================= */}
                {/* MULTIPLE INVOICES */}
                {/* ================================================= */}

                {invoices.length > 0 && (

                    <div className="mt-5">

                        <p className="font-semibold mb-3">
                            Additional / Multiple Invoices
                        </p>

                        <div className="space-y-4">

                            {invoices.map((invoice, index) => (

                                <div
                                    key={invoice.id || index}
                                    className="border rounded-lg p-5"
                                >

                                    <p className="font-semibold mb-3">
                                        Invoice #{index + 1}
                                    </p>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8">

                                        <Field
                                            label="Invoice Number"
                                            value={invoice.invoice_number}
                                            mono
                                        />

                                        <Field
                                            label="Invoice Date"
                                            value={invoice.invoice_date}
                                        />

                                        <Field
                                            label="Currency"
                                            value={invoice.currency}
                                        />

                                        <Field
                                            label="Exchange Rate"
                                            value={invoice.exchange_rate}
                                        />

                                        <Field
                                            label="Freight"
                                            value={invoice.freight}
                                        />

                                        <Field
                                            label="Insurance"
                                            value={invoice.insurance}
                                        />

                                        <Field
                                            label="Other Charges"
                                            value={invoice.other_charges}
                                        />

                                        <Field
                                            label="Total Invoice Value"
                                            value={invoice.total_invoice_value}
                                        />

                                    </div>

                                    {Array.isArray(invoice.items) &&
                                    invoice.items.length > 0 && (

                                        <div className="mt-4">

                                            <p className="font-semibold mb-3">
                                                Invoice Items
                                            </p>

                                            <div className="overflow-x-auto">

                                                <table className="w-full border-collapse text-sm">

                                                    <thead>

                                                        <tr className="bg-gray-50">

                                                            <th className="border p-3 text-left">
                                                                HSN / RITC
                                                            </th>

                                                            <th className="border p-3 text-left">
                                                                Description
                                                            </th>

                                                            <th className="border p-3 text-left">
                                                                Unit
                                                            </th>

                                                            <th className="border p-3 text-left">
                                                                Quantity
                                                            </th>

                                                            <th className="border p-3 text-left">
                                                                Unit Price
                                                            </th>

                                                            <th className="border p-3 text-left">
                                                                Total Value
                                                            </th>

                                                        </tr>

                                                    </thead>

                                                    <tbody>

                                                        {invoice.items.map(
                                                            (item, itemIndex) => (

                                                                <tr
                                                                    key={
                                                                        item.id ||
                                                                        itemIndex
                                                                    }
                                                                >

                                                                    <td className="border p-3 font-mono">
                                                                        {item.hsn_code ||
                                                                            "—"}
                                                                    </td>

                                                                    <td className="border p-3">
                                                                        {item.description ||
                                                                            "—"}
                                                                    </td>

                                                                    <td className="border p-3">
                                                                        {item.unit_of_measurement ||
                                                                            "—"}
                                                                    </td>

                                                                    <td className="border p-3">
                                                                        {item.quantity ??
                                                                            "—"}
                                                                    </td>

                                                                    <td className="border p-3">
                                                                        {item.unit_price ??
                                                                            "—"}
                                                                    </td>

                                                                    <td className="border p-3">
                                                                        {item.total_value ??
                                                                            "—"}
                                                                    </td>

                                                                </tr>

                                                            )
                                                        )}

                                                    </tbody>

                                                </table>

                                            </div>

                                        </div>

                                    )}

                                </div>

                            ))}

                        </div>

                    </div>

                )}


                <div className="border-t my-5" />


                {/* ================================================= */}
                {/* ITEM DETAILS */}
                {/* ================================================= */}

                <SectionTitle>
                    Item Details
                </SectionTitle>

                {items.length === 0 ? (

                    <p className="text-sm text-gray-500 py-4">
                        No item details available.
                    </p>

                ) : (

                    <div className="overflow-x-auto">

                        <table className="w-full border-collapse text-sm">

                            <thead>

                                <tr className="bg-gray-50">

                                    <th className="border p-3 text-left">
                                        HSN / RITC
                                    </th>

                                    <th className="border p-3 text-left">
                                        Description
                                    </th>

                                    <th className="border p-3 text-left">
                                        Unit
                                    </th>

                                    <th className="border p-3 text-left">
                                        Quantity
                                    </th>

                                    <th className="border p-3 text-left">
                                        Unit Price
                                    </th>

                                    <th className="border p-3 text-left">
                                        Total Value
                                    </th>

                                    <th className="border p-3 text-left">
                                        Risk
                                    </th>

                                </tr>

                            </thead>

                            <tbody>

                                {items.map((item, index) => (

                                    <tr key={item.id || index}>

                                        <td className="border p-3 font-mono">
                                            {item.hsn_code || "—"}
                                        </td>

                                        <td className="border p-3">
                                            {item.description || "—"}
                                        </td>

                                        <td className="border p-3">
                                            {item.unit_of_measurement || "—"}
                                        </td>

                                        <td className="border p-3">
                                            {item.quantity ?? "—"}
                                        </td>

                                        <td className="border p-3">
                                            {item.unit_price ?? "—"}
                                        </td>

                                        <td className="border p-3">
                                            {item.total_value ?? "—"}
                                        </td>

                                        <td className="border p-3">
                                            {item.risk_category || "—"}
                                        </td>

                                    </tr>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}


                <div className="border-t my-5" />


                {/* ================================================= */}
                {/* SHIPPING BILL DOCUMENTS */}
                {/* ================================================= */}

                <SectionTitle>
                    Shipping Bill Documents
                </SectionTitle>

                <p className="text-sm text-gray-500 mb-4">
                    Documents uploaded for this Shipping Bill. At least one
                    document is required before Let Export can be granted.
                </p>

                {documents.length === 0 ? (

                    <div className="border border-red-200 bg-red-50 rounded-md p-4">

                        <p className="font-medium text-red-700">
                            No Shipping Bill document has been uploaded.
                        </p>

                    </div>

                ) : (

                    <div className="space-y-3">

                        {documents.map((document, index) => (

                            <div
                                key={document.id || index}
                                className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                            >

                                <div>

                                    <p className="font-semibold">
                                        {document.document_type_display ||
                                            document.document_type ||
                                            `Document ${index + 1}`}
                                    </p>

                                    <p className="text-sm text-gray-600 mt-1">
                                        {document.file
                                            ? document.file.split("/").pop()
                                            : "Uploaded document"}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mt-2">

                                        <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                                            Uploaded
                                        </span>

                                        {document.verified_by_approver && (

                                            <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-700">
                                                Verified by Unit Approver
                                            </span>

                                        )}

                                        {document.uploaded_at && (

                                            <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-700">
                                                {new Date(
                                                    document.uploaded_at
                                                ).toLocaleString()}
                                            </span>

                                        )}

                                    </div>

                                </div>


                                {(document.file_url || document.file) && (

                                    <button
                                        type="button"
                                        onClick={() => setPreviewDocument(document)}
                                        className="inline-flex justify-center border border-blue-600 text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 text-sm font-medium"
                                    >
                                        View Document
                                    </button>

                                )}

                            </div>

                        ))}

                    </div>

                )}


                <div className="border-t my-5" />


                {/* ================================================= */}
                {/* CUSTOMS / ASSESSMENT */}
                {/* ================================================= */}

                <SectionTitle>
                    Customs / Assessment Details
                </SectionTitle>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8">

                    <Field
                        label="Customs Assessment Remarks"
                        value={bill.customs_assessment_remarks}
                    />

                    <Field
                        label="Let Export Date"
                        value={bill.let_export_date}
                    />

                    <Field
                        label="Physical Copies Received"
                        value={
                            bill.physical_copies_received
                                ? "Received"
                                : "Not Received"
                        }
                    />

                    <Field
                        label="Supporting Documents Received"
                        value={
                            bill.supporting_documents_received
                                ? "Received"
                                : "Not Received"
                        }
                    />

                </div>


                <div className="border-t my-5" />


                {/* ================================================= */}
                {/* EGM / POST EXPORT */}
                {/* ================================================= */}

                <SectionTitle>
                    EGM / Post Export Details
                </SectionTitle>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8">

                    <Field
                        label="EGM Number"
                        value={bill.egm_number}
                        mono
                    />

                    <Field
                        label="EGM Date"
                        value={bill.egm_date}
                    />

                    <Field
                        label="Shipment Success Date"
                        value={bill.shipment_success_date}
                    />

                    <Field
                        label="Proof of Export Number"
                        value={bill.proof_of_export_number}
                        mono
                    />

                    <Field
                        label="Proof of Export Date"
                        value={bill.proof_of_export_date}
                    />

                    <Field
                        label="Post Let Export Document Number"
                        value={bill.post_let_document_number}
                        mono
                    />

                    <Field
                        label="Approver Submitted to AC At"
                        value={
                            bill.approver_submitted_to_ac_at
                                ? new Date(
                                    bill.approver_submitted_to_ac_at
                                ).toLocaleString()
                                : null
                        }
                    />

                    <Field
                        label="AC Approved At"
                        value={
                            bill.ac_approved_at
                                ? new Date(
                                    bill.ac_approved_at
                                ).toLocaleString()
                                : null
                        }
                    />

                </div>


                {bill.post_let_document && (

                    <div className="mt-3">

                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                            Post Let Export Document
                        </p>

                        <a
                            href={bill.post_let_document}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            View Post Let Export Document
                        </a>

                    </div>

                )}


                <div className="border-t my-5" />


                {/* ================================================= */}
                {/* QUERY / RESPONSE HISTORY */}
                {/* ================================================= */}

                <SectionTitle>
                    Customs Query / Response History
                </SectionTitle>

                {queries.length === 0 ? (

                    <p className="text-sm text-gray-500 py-4">
                        No query history available.
                    </p>

                ) : (

                    <div className="space-y-5">

                        {queries.map((queryItem, index) => (

                            <div
                                key={queryItem.id || index}
                                className="border rounded-lg p-5"
                            >

                                <div className="flex justify-between items-center mb-5">

                                    <h3 className="font-semibold text-lg">
                                        Query #{index + 1}
                                    </h3>

                                    <span
                                        className={
                                            queryItem.is_resolved
                                                ? "px-3 py-1 rounded-full text-xs bg-green-100 text-green-700"
                                                : "px-3 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700"
                                        }
                                    >
                                        {queryItem.is_resolved
                                            ? "RESOLVED"
                                            : "OPEN"}
                                    </span>

                                </div>


                                <div className="mb-5">

                                    <p className="text-xs text-gray-500 uppercase mb-2">
                                        Customs Question
                                    </p>

                                    <div className="bg-red-50 border border-red-200 rounded-md p-4">

                                        <p className="text-gray-800 whitespace-pre-wrap">
                                            {queryItem.question ||
                                                "No question available."}
                                        </p>

                                    </div>

                                </div>


                                {queryItem.approver_message && (

                                    <div className="mb-5">

                                        <p className="text-xs text-gray-500 uppercase mb-2">
                                            Unit Approver Message
                                        </p>

                                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">

                                            <p className="text-gray-800 whitespace-pre-wrap">
                                                {queryItem.approver_message}
                                            </p>

                                        </div>

                                    </div>

                                )}


                                {queryItem.forwarded_to_maker && (

                                    <div className="mb-5">

                                        <p className="text-xs text-gray-500 uppercase mb-2">
                                            Query Routing
                                        </p>

                                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">

                                            <p className="text-yellow-800">
                                                Unit Approver forwarded this
                                                query to Unit Maker.
                                            </p>

                                        </div>

                                    </div>

                                )}


                                {queryItem.response ? (

                                    <div className="mb-5">

                                        <p className="text-xs text-gray-500 uppercase mb-2">
                                            Unit Maker Response
                                        </p>

                                        <div className="bg-green-50 border border-green-200 rounded-md p-4">

                                            <p className="text-gray-800 whitespace-pre-wrap">
                                                {queryItem.response}
                                            </p>

                                        </div>

                                    </div>

                                ) : (

                                    <div className="mb-5">

                                        <p className="text-sm text-gray-500 italic">
                                            Unit Maker has not submitted a
                                            response yet.
                                        </p>

                                    </div>

                                )}


                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                                    <Field
                                        label="Raised By Role"
                                        value={queryItem.raised_by_role}
                                    />

                                    <Field
                                        label="Forwarded to Maker"
                                        value={
                                            queryItem.forwarded_to_maker
                                                ? "Yes"
                                                : "No"
                                        }
                                    />

                                    <Field
                                        label="Responded By"
                                        value={queryItem.responded_by}
                                    />

                                    <Field
                                        label="Response Date"
                                        value={
                                            queryItem.responded_at
                                                ? new Date(
                                                    queryItem.responded_at
                                                ).toLocaleString()
                                                : null
                                        }
                                    />

                                    <Field
                                        label="Query Raised On"
                                        value={
                                            queryItem.created_at
                                                ? new Date(
                                                    queryItem.created_at
                                                ).toLocaleString()
                                                : null
                                        }
                                    />

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>


            {/* ================================================= */}
            {/* ACTIONS */}
            {/* ================================================= */}

            <div className="flex flex-wrap gap-3 mt-6 mb-10">

                <button
                    type="button"
                    onClick={() =>
                        navigate("/dc-dashboard/inbox")
                    }
                    className="border px-5 py-2.5 rounded-md hover:bg-gray-50"
                >
                    ← Back to Inbox
                </button>


                {bill.status === "SUBMITTED_TO_CUSTOMS" && (

                    <button
                        onClick={handleLetExport}
                        disabled={saving || !hasUploadedDocument}
                        title={
                            !hasUploadedDocument
                                ? "Upload at least one Shipping Bill document before Let Export."
                                : ""
                        }
                        className="bg-green-600 text-white px-5 py-2.5 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving
                            ? "Processing..."
                            : "Let Export"}
                    </button>

                )}


                {bill.status === "SUBMITTED_TO_CUSTOMS" && (

                    <button
                        onClick={() =>
                            setShowQueryBox(true)
                        }
                        disabled={saving}
                        className="bg-red-600 text-white px-5 py-2.5 rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                        Raise Query
                    </button>

                )}


                {bill.status === "QUERY_RESOLVED" && (

                    <span className="px-5 py-2.5 bg-green-100 text-green-700 rounded-md font-medium">
                        Query Resolved
                    </span>

                )}

            </div>


            {/* ================================================= */}
            {/* RAISE QUERY MODAL */}
            {/* ================================================= */}

            {showQueryBox && (

                <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-5 z-50">

                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">

                        <h2 className="text-xl font-semibold mb-2">
                            Raise Customs Query
                        </h2>

                        <p className="text-sm text-gray-500 mb-5">
                            Enter the query that needs to be answered before
                            the Shipping Bill can proceed.
                        </p>

                        <label className="block text-sm font-medium mb-2">
                            Query
                        </label>

                        <textarea
                            value={query}
                            onChange={(e) =>
                                setQuery(e.target.value)
                            }
                            rows={6}
                            placeholder="Enter Customs query..."
                            className="w-full border rounded-md p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />

                        <div className="flex justify-end gap-3 mt-5">

                            <button
                                onClick={() => {

                                    setShowQueryBox(false);

                                    setQuery("");

                                }}
                                disabled={saving}
                                className="border px-5 py-2.5 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleRaiseQuery}
                                disabled={
                                    saving ||
                                    !query.trim()
                                }
                                className="bg-red-600 text-white px-5 py-2.5 rounded-md hover:bg-red-700 disabled:opacity-50"
                            >
                                {saving
                                    ? "Raising..."
                                    : "Raise Query"}
                            </button>

                        </div>

                    </div>

                </div>

            )}


        {previewDocument && (
            <DocumentViewer
                document={previewDocument}
                onClose={() => setPreviewDocument(null)}
            />
        )}
        </div>

    );

}