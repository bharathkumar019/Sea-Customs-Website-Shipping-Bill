import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPrintableShippingBill } from "../../services/shippingBillService";

const display = (value) => {
    if (value === null || value === undefined || value === "") {
        return "-";
    }

    return String(value);
};

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const formatNumber = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return value;
    }

    return number.toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const statusText = (status) =>
    (status || "UNKNOWN").replaceAll("_", " ");

function DetailRow({ label, value }) {
    return (
        <div className="grid grid-cols-[150px_1fr] gap-3 border-b border-slate-200 py-2.5 last:border-b-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-500">
                {label}
            </div>
            <div className="break-words text-xs text-slate-800">
                {display(value)}
            </div>
        </div>
    );
}

export default function ShippingBillPrintPreview() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadBill = async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await getPrintableShippingBill(id);

                setBill(response.data);
            } catch (err) {
                console.error(
                    "Print SB detail error:",
                    err.response?.data || err
                );

                setError(
                    err.response?.data?.error ||
                    "Unable to load this Shipping Bill for printing."
                );
            } finally {
                setLoading(false);
            }
        };

        loadBill();
    }, [id]);

    const shippingBillNumber =
        bill?.shipping_bill_no ||
        bill?.request_id ||
        `SB-${id}`;

    const handlePrint = () => {
        const previousTitle = document.title;
        document.title = shippingBillNumber;

        window.setTimeout(() => window.print(), 50);
        window.setTimeout(() => {
            document.title = previousTitle;
        }, 1500);
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-[#f5f2eb]">
                <p className="text-xs text-[#667085]">
                    Loading Shipping Bill...
                </p>
            </div>
        );
    }

    if (error || !bill) {
        return (
            <div className="h-full overflow-y-auto bg-[#f5f2eb] p-8">
                <div className="mx-auto max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-6">
                    <p className="text-sm font-semibold text-red-700">
                        {error || "Shipping Bill not found."}
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("../")}
                        className="mt-4 rounded-xl bg-[#0f1f35] px-4 py-2 text-xs font-semibold text-white"
                    >
                        Back to Print SB
                    </button>
                </div>
            </div>
        );
    }

    const invoices = Array.isArray(bill.invoices)
        ? bill.invoices
        : [];

    const legacyItems = Array.isArray(bill.items)
        ? bill.items
        : [];

    const invoiceItems = invoices.flatMap(
        (invoice) =>
            Array.isArray(invoice.items)
                ? invoice.items.map((item) => ({
                    ...item,
                    invoice_number:
                        invoice.invoice_number,
                }))
                : []
    );

    const items =
        invoiceItems.length > 0
            ? invoiceItems
            : legacyItems;

    const documents = Array.isArray(bill.documents)
        ? bill.documents
        : [];

    const queries = Array.isArray(bill.queries)
        ? bill.queries
        : [];

    const signatures = bill.print_signatures || {};

    const signatureDate = (entry) => {
        if (!entry?.date) return "";
        return formatDate(entry.date);
    };

    return (
        <div className="min-h-full bg-[#f5f2eb] print:bg-white">

            {/* Screen-only toolbar */}
            <div className="sticky top-0 z-20 border-b border-[#e3dfd6] bg-white px-5 py-3 print:hidden">
                <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => navigate("../")}
                        className="rounded-xl border border-[#d9d5cc] bg-white px-4 py-2 text-xs font-semibold text-[#344054]"
                    >
                        ← Back
                    </button>

                    <div className="text-center">
                        <p className="text-xs font-bold text-[#172033]">
                            Shipping Bill Print Preview
                        </p>
                        <p className="text-[10px] text-[#667085]">
                            Read only
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handlePrint}
                        className="rounded-xl bg-[#0f1f35] px-5 py-2 text-xs font-semibold text-white"
                    >
                        🖨 Print
                    </button>
                </div>
            </div>

            {/* Printable document */}
            <main
                id="shipping-bill-print-document"
                className="mx-auto max-w-5xl px-6 py-8 print:max-w-none print:px-0 print:py-0"
            >
                <div className="bg-white p-8 shadow-sm print:shadow-none print:p-0">

                    {/* Header */}
                    <div className="border-b-2 border-slate-900 pb-4">
                        <div className="flex items-start justify-between gap-6">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                    ISC Portal
                                </p>
                                <h1 className="mt-1 text-xl font-bold tracking-wide text-slate-900">
                                    SHIPPING BILL
                                </h1>
                                <p className="mt-1 text-[10px] text-slate-500">
                                    Read-only print copy
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="font-mono text-sm font-bold text-slate-900">
                                    {display(
                                        bill.shipping_bill_no ||
                                        bill.request_id
                                    )}
                                </p>

                                <p className="mt-1 text-[10px] text-slate-500">
                                    Date: {formatDate(
                                        bill.shipping_bill_date
                                    )}
                                </p>

                                <p className="mt-1 text-[10px] font-semibold text-slate-700">
                                    Status: {statusText(bill.status)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Identification / Exporter */}
                    <section className="mt-6">
                        <h2 className="border-b border-slate-900 pb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-900">
                            General Details
                        </h2>

                        <div className="mt-2 grid grid-cols-2 gap-x-8">
                            <div>
                                <DetailRow
                                    label="Request ID"
                                    value={bill.request_id}
                                />
                                <DetailRow
                                    label="Exporter Type"
                                    value={bill.exporter_type}
                                />
                                <DetailRow
                                    label="Exporter Name"
                                    value={
                                        bill.exporter_name ||
                                        bill.exporter_company_name
                                    }
                                />
                                <DetailRow
                                    label="Exporter IEC"
                                    value={bill.exporter_iec}
                                />
                                <DetailRow
                                    label="Exporter GSTIN"
                                    value={bill.exporter_gstin}
                                />
                                <DetailRow
                                    label="Exporter Address"
                                    value={
                                        bill.exporter_company_address
                                    }
                                />
                            </div>

                            <div>
                                <DetailRow
                                    label="Consignee"
                                    value={bill.consignee_name}
                                />
                                <DetailRow
                                    label="Destination Country"
                                    value={bill.destination_country}
                                />
                                <DetailRow
                                    label="Destination Company"
                                    value={
                                        bill.destination_company_name
                                    }
                                />
                                <DetailRow
                                    label="Destination Address"
                                    value={bill.destination_address}
                                />
                                <DetailRow
                                    label="Customs House"
                                    value={bill.customs_house_code}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Shipping details */}
                    <section className="mt-7">
                        <h2 className="border-b border-slate-900 pb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-900">
                            Shipping Details
                        </h2>

                        <div className="mt-2 grid grid-cols-2 gap-x-8">
                            <div>
                                <DetailRow
                                    label="Mode of Transport"
                                    value={bill.mode_of_transport}
                                />
                                <DetailRow
                                    label="Port of Loading"
                                    value={bill.port_of_loading}
                                />
                                <DetailRow
                                    label="Port of Discharge"
                                    value={bill.port_of_discharge}
                                />
                                <DetailRow
                                    label="Vessel Name"
                                    value={bill.vessel_name}
                                />
                                <DetailRow
                                    label="Voyage Number"
                                    value={bill.voyage_number}
                                />
                            </div>

                            <div>
                                <DetailRow
                                    label="BL Number"
                                    value={bill.bl_number}
                                />
                                <DetailRow
                                    label="BL Date"
                                    value={formatDate(bill.bl_date)}
                                />
                                <DetailRow
                                    label="Container Number"
                                    value={bill.container_number}
                                />
                                <DetailRow
                                    label="Seal Number"
                                    value={bill.seal_number}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Legacy invoice */}
                    <section className="mt-7">
                        <h2 className="border-b border-slate-900 pb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-900">
                            Invoice Summary
                        </h2>

                        <div className="mt-2 grid grid-cols-2 gap-x-8">
                            <div>
                                <DetailRow
                                    label="Invoice Number"
                                    value={bill.invoice_number}
                                />
                                <DetailRow
                                    label="Invoice Date"
                                    value={formatDate(bill.invoice_date)}
                                />
                                <DetailRow
                                    label="Buyer Name"
                                    value={bill.buyer_name}
                                />
                            </div>

                            <div>
                                <DetailRow
                                    label="Currency"
                                    value={bill.currency}
                                />
                                <DetailRow
                                    label="Exchange Rate"
                                    value={bill.exchange_rate}
                                />
                                <DetailRow
                                    label="Total Invoice Value"
                                    value={formatNumber(
                                        bill.total_invoice_value
                                    )}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Multiple invoices */}
                    {invoices.length > 0 && (
                        <section className="mt-7">
                            <h2 className="border-b border-slate-900 pb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-900">
                                Invoice Details
                            </h2>

                            <div className="mt-3 overflow-x-auto">
                                <table className="min-w-full border-collapse text-[10px]">
                                    <thead>
                                        <tr className="border border-slate-300 bg-slate-100">
                                            <th className="border border-slate-300 px-2 py-2 text-left">
                                                Invoice No
                                            </th>
                                            <th className="border border-slate-300 px-2 py-2 text-left">
                                                Date
                                            </th>
                                            <th className="border border-slate-300 px-2 py-2 text-left">
                                                Currency
                                            </th>
                                            <th className="border border-slate-300 px-2 py-2 text-right">
                                                Exchange
                                            </th>
                                            <th className="border border-slate-300 px-2 py-2 text-right">
                                                Freight
                                            </th>
                                            <th className="border border-slate-300 px-2 py-2 text-right">
                                                Insurance
                                            </th>
                                            <th className="border border-slate-300 px-2 py-2 text-right">
                                                Other
                                            </th>
                                            <th className="border border-slate-300 px-2 py-2 text-right">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {invoices.map((invoice) => (
                                            <tr key={invoice.id}>
                                                <td className="border border-slate-300 px-2 py-2">
                                                    {display(
                                                        invoice.invoice_number
                                                    )}
                                                </td>
                                                <td className="border border-slate-300 px-2 py-2">
                                                    {formatDate(
                                                        invoice.invoice_date
                                                    )}
                                                </td>
                                                <td className="border border-slate-300 px-2 py-2">
                                                    {display(
                                                        invoice.currency
                                                    )}
                                                </td>
                                                <td className="border border-slate-300 px-2 py-2 text-right">
                                                    {display(
                                                        invoice.exchange_rate
                                                    )}
                                                </td>
                                                <td className="border border-slate-300 px-2 py-2 text-right">
                                                    {formatNumber(
                                                        invoice.freight
                                                    )}
                                                </td>
                                                <td className="border border-slate-300 px-2 py-2 text-right">
                                                    {formatNumber(
                                                        invoice.insurance
                                                    )}
                                                </td>
                                                <td className="border border-slate-300 px-2 py-2 text-right">
                                                    {formatNumber(
                                                        invoice.other_charges
                                                    )}
                                                </td>
                                                <td className="border border-slate-300 px-2 py-2 text-right font-semibold">
                                                    {formatNumber(
                                                        invoice.total_invoice_value
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    {/* Items */}
                    <section className="mt-7">
                        <h2 className="border-b border-slate-900 pb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-900">
                            Item Details
                        </h2>

                        {items.length === 0 ? (
                            <p className="mt-3 text-xs text-slate-500">
                                No item details available.
                            </p>
                        ) : (
                            <div className="mt-3 overflow-x-auto">
                                <table className="min-w-full border-collapse text-[9px]">
                                    <thead>
                                        <tr className="border border-slate-300 bg-slate-100">
                                            <th className="border border-slate-300 px-2 py-2 text-left">
                                                #
                                            </th>
                                            <th className="border border-slate-300 px-2 py-2 text-left">
                                                Invoice
                                            </th>
                                            <th className="border border-slate-300 px-2 py-2 text-left">
                                                HSN / RITC
                                            </th>
                                            <th className="border border-slate-300 px-2 py-2 text-left">
                                                Description
                                            </th>
                                            <th className="border border-slate-300 px-2 py-2 text-left">
                                                UOM
                                            </th>
                                            <th className="border border-slate-300 px-2 py-2 text-right">
                                                Qty
                                            </th>
                                            <th className="border border-slate-300 px-2 py-2 text-right">
                                                Unit Price
                                            </th>
                                            <th className="border border-slate-300 px-2 py-2 text-right">
                                                Total Value
                                            </th>
                                            <th className="border border-slate-300 px-2 py-2 text-right">
                                                Duty %
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {items.map((item, index) => (
                                            <tr key={item.id || `${index}-${item.hsn_code}`}>
                                                <td className="border border-slate-300 px-2 py-2">
                                                    {index + 1}
                                                </td>
                                                <td className="border border-slate-300 px-2 py-2">
                                                    {display(
                                                        item.invoice_number ||
                                                        item.invoice
                                                    )}
                                                </td>
                                                <td className="border border-slate-300 px-2 py-2 font-mono">
                                                    {display(item.hsn_code)}
                                                </td>
                                                <td className="border border-slate-300 px-2 py-2">
                                                    {display(item.description)}
                                                </td>
                                                <td className="border border-slate-300 px-2 py-2">
                                                    {display(
                                                        item.unit_of_measurement
                                                    )}
                                                </td>
                                                <td className="border border-slate-300 px-2 py-2 text-right">
                                                    {display(item.quantity)}
                                                </td>
                                                <td className="border border-slate-300 px-2 py-2 text-right">
                                                    {formatNumber(
                                                        item.unit_price
                                                    )}
                                                </td>
                                                <td className="border border-slate-300 px-2 py-2 text-right">
                                                    {formatNumber(
                                                        item.total_value
                                                    )}
                                                </td>
                                                <td className="border border-slate-300 px-2 py-2 text-right">
                                                    {display(
                                                        item.total_tax_duty_rate
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* Charges / assessment */}
                    <section className="mt-7">
                        <h2 className="border-b border-slate-900 pb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-900">
                            Customs / Assessment
                        </h2>

                        <div className="mt-2 grid grid-cols-2 gap-x-8">
                            <div>
                                <DetailRow
                                    label="Freight"
                                    value={formatNumber(bill.freight)}
                                />
                                <DetailRow
                                    label="Insurance"
                                    value={formatNumber(bill.insurance)}
                                />
                                <DetailRow
                                    label="Other Charges"
                                    value={formatNumber(bill.other_charges)}
                                />
                                <DetailRow
                                    label="Assessment Remarks"
                                    value={
                                        bill.customs_assessment_remarks
                                    }
                                />
                            </div>

                            <div>
                                <DetailRow
                                    label="Let Export Date"
                                    value={formatDate(
                                        bill.let_export_date
                                    )}
                                />
                                <DetailRow
                                    label="EGM Number"
                                    value={bill.egm_number}
                                />
                                <DetailRow
                                    label="EGM Date"
                                    value={formatDate(bill.egm_date)}
                                />
                                <DetailRow
                                    label="Shipment Success"
                                    value={formatDate(
                                        bill.shipment_success_date
                                    )}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Documents */}
                    <section className="mt-7">
                        <h2 className="border-b border-slate-900 pb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-900">
                            Supporting Documents
                        </h2>

                        {documents.length === 0 ? (
                            <p className="mt-3 text-xs text-slate-500">
                                No supporting documents recorded.
                            </p>
                        ) : (
                            <div className="mt-3 overflow-x-auto">
                                <table className="min-w-full border-collapse text-[10px]">
                                    <thead>
                                        <tr className="border border-slate-300 bg-slate-100">
                                            <th className="border border-slate-300 px-2 py-2 text-left">
                                                Type
                                            </th>
                                            <th className="border border-slate-300 px-2 py-2 text-left">
                                                Uploaded
                                            </th>
                                            <th className="border border-slate-300 px-2 py-2 text-left">
                                                Verified
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {documents.map((document) => (
                                            <tr key={document.id}>
                                                <td className="border border-slate-300 px-2 py-2">
                                                    {display(
                                                        document.document_type_display ||
                                                        document.document_type
                                                    )}
                                                </td>
                                                <td className="border border-slate-300 px-2 py-2">
                                                    {formatDate(
                                                        document.uploaded_at
                                                    )}
                                                </td>
                                                <td className="border border-slate-300 px-2 py-2">
                                                    {document.verified_by_approver
                                                        ? "Verified"
                                                        : "Not Verified"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>

                    {/* Query history */}
                    {queries.length > 0 && (
                        <section className="mt-7">
                            <h2 className="border-b border-slate-900 pb-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-900">
                                Query History
                            </h2>

                            <div className="mt-3 space-y-3">
                                {queries.map((query) => (
                                    <div
                                        key={query.id}
                                        className="rounded-lg border border-slate-300 p-3"
                                    >
                                        <p className="text-[10px] font-semibold text-slate-800">
                                            Question
                                        </p>
                                        <p className="mt-1 text-xs text-slate-700">
                                            {display(query.question)}
                                        </p>

                                        {query.approver_message && (
                                            <>
                                                <p className="mt-2 text-[10px] font-semibold text-slate-800">
                                                    Approver Message
                                                </p>
                                                <p className="mt-1 text-xs text-slate-700">
                                                    {display(
                                                        query.approver_message
                                                    )}
                                                </p>
                                            </>
                                        )}

                                        {query.response && (
                                            <>
                                                <p className="mt-2 text-[10px] font-semibold text-slate-800">
                                                    Response
                                                </p>
                                                <p className="mt-1 text-xs text-slate-700">
                                                    {display(query.response)}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Authorized signatures */}
                    <section className="mt-10 break-inside-avoid page-break-inside-avoid">
                        <div className="border-b-2 border-slate-900 pb-2">
                            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-900">
                                Authorized Signatures
                            </h2>
                            <p className="mt-1 text-[9px] text-slate-500">
                                Signature status is derived from the existing Shipping Bill workflow. No new signature fields are stored.
                            </p>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-5">
                            {[
                                ["unit_maker", "Unit Maker"],
                                ["unit_approver", "Unit Approver"],
                                ["dc_customs", "DC Customs"],
                                ["ac_customs", "AC Customs"],
                            ].map(([key, fallbackLabel]) => {
                                const entry = signatures[key] || {};
                                const completed = Boolean(entry.completed);

                                return (
                                    <div
                                        key={key}
                                        className="relative min-h-[128px] rounded-sm border border-slate-400 bg-white px-4 py-3 break-inside-avoid page-break-inside-avoid"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-900">
                                                    {entry.label || fallbackLabel}
                                                </p>
                                                <p className={`mt-1 text-[9px] font-semibold uppercase tracking-[0.08em] ${completed ? "text-emerald-700" : "text-slate-500"}`}>
                                                    {completed ? (entry.action || "Completed") : "Pending"}
                                                </p>
                                            </div>

                                            {completed && (
                                                <span className="rounded border border-emerald-300 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-emerald-700">
                                                    ✓ Verified
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-7 border-b border-slate-800 pb-1 text-center">
                                            {completed ? (
                                                <span className="font-serif text-sm italic text-slate-800">
                                                    Signature
                                                </span>
                                            ) : (
                                                <span className="text-[9px] text-slate-400">
                                                    Signature will appear after action
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-2 grid grid-cols-2 gap-3 text-[9px] text-slate-600">
                                            <div>
                                                <span className="font-semibold text-slate-800">Name: </span>
                                                {display(entry.name || (completed ? "Authorized Officer" : ""))}
                                            </div>
                                            <div className="text-right">
                                                <span className="font-semibold text-slate-800">Date: </span>
                                                {signatureDate(entry) || ""}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* Footer */}
                    <div className="mt-8 border-t-2 border-slate-900 pt-4 text-[9px] text-slate-500">
                        <div className="flex justify-between gap-4">
                            <span>
                                Generated from ISC Portal — Read Only
                            </span>
                            <span>
                                SB:{" "}
                                {display(
                                    bill.shipping_bill_no ||
                                    bill.request_id
                                )}
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 10mm;
                    }

                    html,
                    body {
                        background: #fff !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* Print ONLY the Shipping Bill document. */
                    body * {
                        visibility: hidden !important;
                    }

                    #shipping-bill-print-document,
                    #shipping-bill-print-document * {
                        visibility: visible !important;
                    }

                    #shipping-bill-print-document {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: #fff !important;
                    }

                    #shipping-bill-print-document > div {
                        width: 100% !important;
                        max-width: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                    }

                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                    }

                    tr,
                    img {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }

                    h1,
                    h2 {
                        break-after: avoid !important;
                        page-break-after: avoid !important;
                    }

                    .print\:hidden {
                        display: none !important;
                    }

                    .page-break-inside-avoid {
                        break-inside: avoid !important;
                        page-break-inside: avoid !important;
                    }
                }
            `}</style>
        </div>
    );
}
