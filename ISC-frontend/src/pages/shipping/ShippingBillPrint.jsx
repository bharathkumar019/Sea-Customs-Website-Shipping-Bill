import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPrintableShippingBills } from "../../services/shippingBillService";

const statusText = (status) =>
    (status || "UNKNOWN").replaceAll("_", " ");

const statusClass = (status) => {
    const map = {
        DRAFT: "border-slate-200 bg-slate-50 text-slate-600",
        SENT_BACK: "border-orange-200 bg-orange-50 text-orange-600",
        QUERY_FORWARDED: "border-amber-200 bg-amber-50 text-amber-600",
        QUERY_RAISED: "border-red-200 bg-red-50 text-red-600",
        SUBMITTED_TO_APPROVER: "border-orange-200 bg-orange-50 text-orange-600",
        SUBMITTED_TO_CUSTOMS: "border-indigo-200 bg-indigo-50 text-indigo-600",
        SUBMITTED_TO_AC: "border-indigo-200 bg-indigo-50 text-indigo-600",
        LET_EXPORT: "border-emerald-200 bg-emerald-50 text-emerald-600",
        EGM_SUBMITTED: "border-emerald-200 bg-emerald-50 text-emerald-600",
        SHIPMENT_SUCCESS: "border-emerald-200 bg-emerald-50 text-emerald-600",
        PROOF_OF_EXPORT: "border-emerald-200 bg-emerald-50 text-emerald-600",
    };

    return map[status] || "border-slate-200 bg-slate-50 text-slate-600";
};

const formatDate = (value) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

export default function ShippingBillPrint() {
    const navigate = useNavigate();

    const [bills, setBills] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadBills = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getPrintableShippingBills();

            const data = Array.isArray(response.data)
                ? response.data
                : Array.isArray(response.data?.results)
                    ? response.data.results
                    : [];

            setBills(data);
        } catch (err) {
            console.error(
                "Print SB list error:",
                err.response?.data || err
            );

            setError(
                err.response?.data?.error ||
                "Unable to load Shipping Bills for printing."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBills();
    }, []);

    const statuses = useMemo(() => {
        const values = bills
            .map((bill) => bill.status)
            .filter(Boolean);

        return [...new Set(values)];
    }, [bills]);

    const filteredBills = useMemo(() => {
        const term = search.trim().toLowerCase();

        return bills.filter((bill) => {
            const matchesSearch =
                !term ||
                String(
                    bill.shipping_bill_no ||
                    ""
                ).toLowerCase().includes(term) ||
                String(
                    bill.request_id ||
                    ""
                ).toLowerCase().includes(term) ||
                String(
                    bill.exporter_name ||
                    bill.exporter_company_name ||
                    ""
                ).toLowerCase().includes(term) ||
                String(
                    bill.consignee_name ||
                    ""
                ).toLowerCase().includes(term);

            const matchesStatus =
                statusFilter === "ALL" ||
                bill.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [bills, search, statusFilter]);

    return (
        <div className="h-full overflow-y-auto bg-[#f5f2eb] p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">

                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#b77a12]">
                            Read Only
                        </p>

                        <h1 className="mt-1 text-2xl font-bold text-[#172033]">
                            Print Shipping Bill
                        </h1>

                        <p className="mt-1 text-xs text-[#667085]">
                            Print only. No edit, save, submit, query or workflow action is available here.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={loadBills}
                        className="rounded-xl border border-[#d9d5cc] bg-white px-4 py-2.5 text-xs font-semibold text-[#344054] hover:bg-[#faf9f6]"
                    >
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                        {error}
                    </div>
                )}

                <section className="rounded-2xl border border-[#e3dfd6] bg-white shadow-sm">
                    <div className="border-b border-[#eeeae2] p-5">
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_220px]">
                            <div>
                                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#667085]">
                                    Search Shipping Bill
                                </label>

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="SB Number / Request ID / Exporter / Consignee"
                                    className="h-10 w-full rounded-xl border border-[#d9d5cc] bg-white px-3 text-xs outline-none focus:border-[#0f1f35]"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#667085]">
                                    Status
                                </label>

                                <select
                                    value={statusFilter}
                                    onChange={(event) =>
                                        setStatusFilter(event.target.value)
                                    }
                                    className="h-10 w-full rounded-xl border border-[#d9d5cc] bg-white px-3 text-xs outline-none focus:border-[#0f1f35]"
                                >
                                    <option value="ALL">
                                        All Statuses
                                    </option>

                                    {statuses.map((status) => (
                                        <option
                                            key={status}
                                            value={status}
                                        >
                                            {statusText(status)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-[11px] text-[#667085]">
                            <span>
                                {filteredBills.length} Shipping Bill
                                {filteredBills.length === 1 ? "" : "s"}
                            </span>

                            <span>
                                Printing is read-only
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-[#eeeae2] bg-[#faf9f6] text-left">
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#667085]">
                                        Shipping Bill
                                    </th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#667085]">
                                        Exporter
                                    </th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#667085]">
                                        Date
                                    </th>
                                    <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#667085]">
                                        Status
                                    </th>
                                    <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-[0.1em] text-[#667085]">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="px-5 py-12 text-center text-xs text-[#667085]"
                                        >
                                            Loading Shipping Bills...
                                        </td>
                                    </tr>
                                ) : filteredBills.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="5"
                                            className="px-5 py-12 text-center"
                                        >
                                            <p className="text-xs font-semibold text-[#172033]">
                                                No Shipping Bills found
                                            </p>

                                            <p className="mt-1 text-[11px] text-[#667085]">
                                                Inbox and Submitted / In Progress Shipping Bills available to your login will appear here.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBills.map((bill) => (
                                        <tr
                                            key={bill.id}
                                            className="border-b border-[#f0ede7] last:border-b-0"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-mono text-xs font-bold text-[#172033]">
                                                    {bill.shipping_bill_no ||
                                                        bill.request_id ||
                                                        `SB-${bill.id}`}
                                                </p>

                                                {bill.shipping_bill_no && (
                                                    <p className="mt-1 text-[10px] text-[#98a2b3]">
                                                        {bill.request_id || "-"}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-xs text-[#344054]">
                                                {bill.exporter_name ||
                                                    bill.exporter_company_name ||
                                                    "-"}
                                            </td>

                                            <td className="px-5 py-4 text-xs text-[#667085]">
                                                {formatDate(
                                                    bill.shipping_bill_date
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold ${statusClass(
                                                        bill.status
                                                    )}`}
                                                >
                                                    {statusText(bill.status)}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            `${bill.id}`
                                                        )
                                                    }
                                                    className="inline-flex items-center gap-2 rounded-xl bg-[#0f1f35] px-4 py-2 text-[11px] font-semibold text-white hover:bg-[#182b46]"
                                                >
                                                    🖨 Print
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </div>
    );
}
