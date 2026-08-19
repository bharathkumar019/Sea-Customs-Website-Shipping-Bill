import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getShippingBills } from "../../services/shippingBillService";

const statusClasses = {
    DRAFT: "border-slate-300 bg-slate-100 text-slate-700",
    SENT_BACK: "border-orange-300 bg-orange-100 text-orange-700",
    QUERY_FORWARDED: "border-amber-300 bg-amber-100 text-amber-700",
    QUERY_RAISED: "border-red-300 bg-red-100 text-red-700",
    QUERY_RESPONDED: "border-yellow-300 bg-yellow-100 text-yellow-700",
    MAKER_RESPONDED: "border-cyan-300 bg-cyan-100 text-cyan-700",
    SUBMITTED: "border-blue-300 bg-blue-100 text-blue-700",
    SUBMITTED_TO_APPROVER: "border-purple-300 bg-purple-100 text-purple-700",
    SUBMITTED_TO_CUSTOMS: "border-indigo-300 bg-indigo-100 text-indigo-700",
    LET_EXPORT: "border-emerald-300 bg-emerald-100 text-emerald-700",
    SUBMITTED_TO_AC: "border-violet-300 bg-violet-100 text-violet-700",
    EGM_SUBMITTED: "border-teal-300 bg-teal-100 text-teal-700",
    SHIPMENT_SUCCESS: "border-green-300 bg-green-100 text-green-700",
    PROOF_OF_EXPORT: "border-lime-300 bg-lime-100 text-lime-700",
    APPROVED: "border-green-400 bg-green-100 text-green-800",
    REJECTED: "border-rose-300 bg-rose-100 text-rose-700",
    CANCELLED: "border-gray-400 bg-gray-200 text-gray-700",
};

const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
        return "\u2014";
    }

    return value;
};

const PAGE_SIZE = 5;

// Builds a compact page list like [1, 2, 3, '...', 10]
const buildPageList = (currentPage, totalPages) => {
    const pages = [];
    const siblingCount = 1;

    const start = Math.max(2, currentPage - siblingCount);
    const end = Math.min(totalPages - 1, currentPage + siblingCount);

    pages.push(1);

    if (start > 2) {
        pages.push("start-ellipsis");
    }

    for (let page = start; page <= end; page += 1) {
        pages.push(page);
    }

    if (end < totalPages - 1) {
        pages.push("end-ellipsis");
    }

    if (totalPages > 1) {
        pages.push(totalPages);
    }

    return pages;
};

export default function ShippingBillInbox() {
    const navigate = useNavigate();

    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const loadBills = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await getShippingBills();
                setBills(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                console.error("Shipping bill inbox error:", err.response?.data || err);
                setError("Unable to load shipping bills.");
            } finally {
                setLoading(false);
            }
        };

        loadBills();
    }, []);

    const statuses = useMemo(() => {
        const unique = new Set(bills.map((bill) => bill.status).filter(Boolean));
        return ["ALL", ...Array.from(unique)];
    }, [bills]);

    const filteredBills = useMemo(() => {
        return bills.filter((bill) => {
            const matchesSearch =
                !search ||
                [bill.request_id, bill.shipping_bill_no, bill.consignee_name, bill.exporter_name]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(search.toLowerCase()));

            const matchesStatus = statusFilter === "ALL" || bill.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [bills, search, statusFilter]);

    // Reset to page 1 whenever the filtered result set changes shape
    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, bills.length]);

    const totalPages = Math.max(1, Math.ceil(filteredBills.length / PAGE_SIZE));

    const paginatedBills = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredBills.slice(start, start + PAGE_SIZE);
    }, [filteredBills, currentPage]);

    const pageList = useMemo(
        () => buildPageList(currentPage, totalPages),
        [currentPage, totalPages]
    );

    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const rangeStart = filteredBills.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
    const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredBills.length);

    return (
        <div>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#b77a12]">
                        Search Request
                    </p>
                    <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#172033]">
                        All Shipping Bills
                    </h1>
                </div>

                <button
                    type="button"
                    onClick={() => navigate("/maker-dashboard/create-shipping-bill")}
                    className="h-9 rounded-xl bg-[#0f1f35] px-4 text-xs font-semibold text-white shadow-[0_3px_10px_rgba(15,31,53,0.15)] transition hover:bg-[#b77a12]"
                >
                    + New Shipping Bill
                </button>
            </div>

            {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                    {error}
                </div>
            )}

            <div className="mt-6 flex flex-col gap-3 lg:flex-row">
                <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search by Request ID, Shipping Bill No., or Consignee..."
                    className="h-9 w-full rounded-xl border border-[#d9d5cc] bg-white px-3 text-xs text-[#172033] placeholder:text-[#9aa1ad] outline-none transition-all focus:border-[#0f1f35] focus:ring-2 focus:ring-[#0f1f35]/5"
                />

                <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="h-9 w-full rounded-xl border border-[#d9d5cc] bg-white px-3 text-xs text-[#172033] outline-none transition-all focus:border-[#0f1f35] focus:ring-2 focus:ring-[#0f1f35]/5 lg:max-w-[260px]"
                >
                    {statuses.map((status) => (
                        <option key={status} value={status}>
                            {status === "ALL" ? "All statuses" : status.replaceAll("_", " ")}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mt-6 overflow-hidden rounded-xl border border-[#e3dfd6] bg-white">
                {loading ? (
                    <div className="px-6 py-14 text-center text-xs text-[#667085]">
                        Loading shipping bills...
                    </div>
                ) : filteredBills.length === 0 ? (
                    <div className="px-6 py-14 text-center text-xs text-[#667085]">
                        Nothing waiting on you right now.
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="border-b border-[#e3dfd6]">
                                    <tr className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#8a8f98]">
                                        <th className="px-5 py-3">Request ID</th>
                                        <th className="px-5 py-3">Shipping Bill No.</th>
                                        <th className="px-5 py-3">Consignee</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Current Level</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginatedBills.map((bill) => (
                                        <tr
                                            key={bill.id}
                                            onClick={() => navigate(`/maker-dashboard/shipping-bill/${bill.id}`)}
                                            className="cursor-pointer border-b border-[#f0ede5] transition hover:bg-[#faf9f6] last:border-b-0"
                                        >
                                            <td className="px-5 py-3.5 font-mono text-xs text-[#172033]">
                                                {formatValue(bill.request_id)}
                                            </td>

                                            <td className="px-5 py-3.5 font-mono text-xs text-[#4b556a]">
                                                {formatValue(bill.shipping_bill_no)}
                                            </td>

                                            <td className="px-5 py-3.5 text-xs text-[#172033]">
                                                {formatValue(bill.consignee_name)}
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <span
                                                    className={[
                                                        "inline-flex rounded-full border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em]",
                                                        statusClasses[bill.status] ||
                                                            "border-slate-200 bg-slate-50 text-slate-600",
                                                    ].join(" ")}
                                                >
                                                    {formatValue(bill.status).replaceAll("_", " ")}
                                                </span>
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <span className="inline-flex rounded-full border border-[#e9c98a] bg-[#fdf3e0] px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#b77a12]">
                                                    Unit Approver
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex flex-col items-center justify-between gap-3 border-t border-[#e3dfd6] px-5 py-3.5 sm:flex-row">
                                <p className="font-mono text-[10px] text-[#8a8f98]">
                                    Showing {rangeStart}&ndash;{rangeEnd} of {filteredBills.length}
                                </p>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d9d5cc] bg-white text-xs text-[#4b556a] transition hover:bg-[#faf9f6] disabled:cursor-not-allowed disabled:opacity-40"
                                        aria-label="Previous page"
                                    >
                                        &lsaquo;
                                    </button>

                                    {pageList.map((page, index) =>
                                        typeof page === "number" ? (
                                            <button
                                                key={page}
                                                type="button"
                                                onClick={() => goToPage(page)}
                                                className={[
                                                    "flex h-7 min-w-7 items-center justify-center rounded-lg border px-2 font-mono text-[10px] font-semibold transition",
                                                    page === currentPage
                                                        ? "border-[#0f1f35] bg-[#0f1f35] text-white"
                                                        : "border-[#d9d5cc] bg-white text-[#4b556a] hover:bg-[#faf9f6]",
                                                ].join(" ")}
                                            >
                                                {page}
                                            </button>
                                        ) : (
                                            <span
                                                key={`${page}-${index}`}
                                                className="flex h-7 w-7 items-center justify-center font-mono text-[10px] text-[#8a8f98]"
                                            >
                                                &hellip;
                                            </span>
                                        )
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#d9d5cc] bg-white text-xs text-[#4b556a] transition hover:bg-[#faf9f6] disabled:cursor-not-allowed disabled:opacity-40"
                                        aria-label="Next page"
                                    >
                                        &rsaquo;
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}