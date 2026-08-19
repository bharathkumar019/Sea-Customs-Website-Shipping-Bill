import { useEffect, useState } from "react";
import { logout } from "../utils/auth";
import DocumentViewer from "../components/DocumentViewer";
import {
    getACShippingBills,
    acShipmentAction,
} from "../services/shippingBillService";

const statusText = (status) =>
    (status || "UNKNOWN").replaceAll("_", " ");

export default function ACDashboard() {

    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [selectedBill, setSelectedBill] = useState(null);
    const [submittingId, setSubmittingId] = useState(null);
    const [previewDocument, setPreviewDocument] = useState(null);

    const loadBills = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getACShippingBills();
            const data = Array.isArray(response.data)
                ? response.data
                : Array.isArray(response.data?.results)
                    ? response.data.results
                    : [];

            setBills(data);

            if (selectedBill) {
                const refreshed = data.find(
                    (bill) => bill.id === selectedBill.id
                );
                setSelectedBill(refreshed || null);
            }
        } catch (err) {
            console.error("AC Customs inbox error:", err.response?.data || err);
            setError(
                err.response?.data?.error ||
                "Unable to load Shipping Bills submitted to AC Customs."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBills();
    }, []);

    const handleShipmentSuccess = async (bill) => {
        if (!window.confirm("Mark this Shipping Bill as Shipment Success?")) {
            return;
        }

        try {
            setSubmittingId(bill.id);
            setError("");
            setSuccess("");

            const response = await acShipmentAction(
                bill.id,
                "shipment-success"
            );

            setSuccess(
                response.data?.message ||
                "Shipment marked as successful."
            );
            setSelectedBill(null);
            await loadBills();
        } catch (err) {
            console.error("Shipment success error:", err.response?.data || err);
            setError(
                err.response?.data?.error ||
                "Unable to mark Shipment Success."
            );
        } finally {
            setSubmittingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#f5f2eb] text-[#172033]">
            <header className="border-b border-[#e3dfd6] bg-white px-8 py-5">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
                    <div>
                        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#b77a12]">
                            AC Customs / Final Clearance
                        </p>
                        <h1 className="mt-1 text-2xl font-bold">
                            AC Customs Dashboard
                        </h1>
                        <p className="mt-1 text-xs text-[#667085]">
                            Shipping Bills submitted by Unit Approver after final EGM details are saved.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() =>
                                (window.location.href = "/ac-dashboard/print-sb")
                            }
                            className="h-10 rounded-xl border border-[#d9d5cc] bg-white px-4 text-xs font-semibold text-[#344054]"
                        >
                            Print SB
                        </button>

                        <button
                            type="button"
                            onClick={logout}
                            className="h-10 rounded-xl border border-[#d9d5cc] bg-white px-4 text-xs font-semibold text-[#344054]"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-8 py-8">

                {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">

                    <section className="rounded-xl border border-[#e3dfd6] bg-white p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold">
                                    AC Customs Inbox
                                </h2>
                                <p className="mt-1 text-[11px] text-[#667085]">
                                    {bills.length} Shipping Bill{bills.length === 1 ? "" : "s"} received
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={loadBills}
                                className="rounded-lg border border-[#d9d5cc] px-3 py-2 text-[11px] font-semibold"
                            >
                                Refresh
                            </button>
                        </div>

                        <div className="mt-5 space-y-2">
                            {loading ? (
                                <p className="py-8 text-center text-xs text-[#667085]">
                                    Loading...
                                </p>
                            ) : bills.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-[#d9d5cc] p-6 text-center">
                                    <p className="text-xs font-semibold">
                                        No Shipping Bills received
                                    </p>
                                    <p className="mt-1 text-[11px] text-[#667085]">
                                        Bills submitted by Unit Approver will appear here.
                                    </p>
                                </div>
                            ) : (
                                bills.map((bill) => (
                                    <button
                                        key={bill.id}
                                        type="button"
                                        onClick={() => setSelectedBill(bill)}
                                        className={`w-full rounded-xl border p-4 text-left transition ${
                                            selectedBill?.id === bill.id
                                                ? "border-[#0f1f35] bg-[#f8f9fb]"
                                                : "border-[#e3dfd6] bg-white hover:bg-[#faf9f6]"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-mono text-xs font-bold">
                                                    {bill.shipping_bill_no || bill.request_id || `SB-${bill.id}`}
                                                </p>
                                                <p className="mt-1 text-[11px] text-[#667085]">
                                                    {bill.exporter_name || "Exporter not available"}
                                                </p>
                                            </div>
                                            <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[9px] font-bold uppercase text-blue-700">
                                                {statusText(bill.status)}
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </section>

                    <section className="rounded-xl border border-[#e3dfd6] bg-white p-6">
                        {!selectedBill ? (
                            <div className="flex min-h-[420px] items-center justify-center text-center">
                                <div>
                                    <p className="text-sm font-semibold">
                                        Select a Shipping Bill
                                    </p>
                                    <p className="mt-1 text-xs text-[#667085]">
                                        Review the EGM details and complete final shipment clearance.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e3dfd6] pb-5">
                                    <div>
                                        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#b77a12]">
                                            Shipping Bill
                                        </p>
                                        <h2 className="mt-1 text-xl font-bold">
                                            {selectedBill.shipping_bill_no || selectedBill.request_id}
                                        </h2>
                                    </div>

                                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-bold uppercase text-emerald-700">
                                        Submitted to AC Customs
                                    </span>
                                </div>

                                <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                                    <Info label="Request ID" value={selectedBill.request_id} />
                                    <Info label="Shipping Bill Date" value={selectedBill.shipping_bill_date} />
                                    <Info label="Exporter" value={selectedBill.exporter_name} />
                                    <Info label="Consignee" value={selectedBill.consignee_name} />
                                    <Info label="Port of Loading" value={selectedBill.port_of_loading} />
                                    <Info label="Port of Discharge" value={selectedBill.port_of_discharge} />
                                    <Info label="Let Export Date" value={selectedBill.let_export_date} />
                                    <Info label="Final EGM Number" value={selectedBill.egm_number} />
                                    <Info label="Final EGM Date" value={selectedBill.egm_date} />
                                </div>

                                <div className="mt-7 rounded-xl border border-[#e3dfd6] bg-[#faf9f6] p-5">
                                    <h3 className="text-sm font-bold">
                                        Shipping Bill Documents
                                    </h3>

                                    <div className="mt-4 space-y-2">
                                        {(selectedBill.documents || []).length === 0 ? (
                                            <p className="text-xs text-[#667085]">
                                                No documents available.
                                            </p>
                                        ) : (
                                            selectedBill.documents.map((document) => (
                                                <div
                                                    key={document.id}
                                                    className="flex items-center justify-between rounded-lg border border-[#e3dfd6] bg-white px-4 py-3"
                                                >
                                                    <span className="text-xs font-semibold">
                                                        {document.document_type_display || document.document_type || "Document"}
                                                    </span>
                                                    {document.file_url || document.file ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewDocument(document)}
                                                            className="text-xs font-semibold text-blue-700 hover:underline"
                                                        >
                                                            View
                                                        </button>
                                                    ) : null}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="mt-7 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => handleShipmentSuccess(selectedBill)}
                                        disabled={submittingId === selectedBill.id}
                                        className="h-11 rounded-xl bg-emerald-700 px-6 text-xs font-bold text-white disabled:opacity-50"
                                    >
                                        {submittingId === selectedBill.id
                                            ? "Processing..."
                                            : "Shipment Success"}
                                    </button>
                                </div>
                            </>
                        )}
                    </section>
                </div>
            </main>

        {previewDocument && (
            <DocumentViewer
                document={previewDocument}
                onClose={() => setPreviewDocument(null)}
            />
        )}
        </div>
    );
}

function Info({ label, value }) {
    return (
        <div>
            <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#8a8f98]">
                {label}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-[#172033]">
                {value || "—"}
            </p>
        </div>
    );
}