import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getShippingBills } from "../../services/shippingBillService";

const PAGE_SIZE = 5;

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

const ACTIONABLE_STATUSES = [
    "SUBMITTED_TO_APPROVER",
    "QUERY_RAISED",
    "QUERY_RESPONDED",
    "MAKER_RESPONDED",
];

const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
        return "—";
    }

    return value;
};

const getStatusLabel = (status) => {
    const labels = {
        QUERY_FORWARDED: "QUERY FORWARDED",
        QUERY_RAISED: "QUERY RAISED",
        QUERY_RESPONDED: "MAKER RESPONDED",
        MAKER_RESPONDED: "MAKER RESPONDED",
        SUBMITTED_TO_APPROVER: "PENDING APPROVAL",
        SUBMITTED_TO_CUSTOMS: "SUBMITTED TO CUSTOMS",
        LET_EXPORT: "LET EXPORT",
        APPROVED: "APPROVED",
        SENT_BACK: "SENT BACK",
        DRAFT: "DRAFT",
        SUBMITTED: "SUBMITTED",
        REJECTED: "REJECTED",
    };

    return labels[status] || formatValue(status).replaceAll("_", " ");
};

const getCurrentLevel = (bill) => {
    return (
        bill.current_level ||
        bill.currentLevel ||
        bill.current_stage ||
        bill.currentStage ||
        "UNIT APPROVER"
    );
};

export default function ShippingBillApproverInbox() {
    const navigate = useNavigate();
    const location = useLocation();

    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);

    const isSubmittedPage = location.pathname.startsWith(
        "/approver-dashboard/submitted"
    );

    const loadBills = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getShippingBills();
            const allBills = Array.isArray(response.data)
                ? response.data
                : [];

            setBills(allBills);
        } catch (err) {
            console.error(
                "Approver Shipping Bills Error:",
                err.response?.data || err
            );
            setError("Unable to load Shipping Bills.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBills();
    }, []);

    const actionableBills = useMemo(() => {
        return bills.filter((bill) =>
            ACTIONABLE_STATUSES.includes(bill.status)
        );
    }, [bills]);

    const statuses = useMemo(() => {
        const uniqueStatuses = Array.from(
            new Set(
                bills
                    .map((bill) => bill.status)
                    .filter(Boolean)
            )
        );

        return ["ALL", ...uniqueStatuses];
    }, [bills]);

    const filteredBills = useMemo(() => {
        const source = isSubmittedPage ? bills : actionableBills;
        const searchValue = search.trim().toLowerCase();

        return source.filter((bill) => {
            const matchesSearch =
                !searchValue ||
                [
                    bill.request_id,
                    bill.shipping_bill_no,
                    bill.shipping_bill_number,
                    bill.destination_company_name,
                    bill.exporter_name,
                    bill.status,
                ]
                    .filter(Boolean)
                    .some((value) =>
                        String(value)
                            .toLowerCase()
                            .includes(searchValue)
                    );

            const matchesStatus =
                statusFilter === "ALL" ||
                bill.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [
        bills,
        actionableBills,
        isSubmittedPage,
        search,
        statusFilter,
    ]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, isSubmittedPage]);

    const totalPages = Math.max(
        1,
        Math.ceil(filteredBills.length / PAGE_SIZE)
    );

    const paginatedBills = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        return filteredBills.slice(start, start + PAGE_SIZE);
    }, [filteredBills, currentPage]);

    const rangeStart =
        filteredBills.length === 0
            ? 0
            : (currentPage - 1) * PAGE_SIZE + 1;

    const rangeEnd = Math.min(
        currentPage * PAGE_SIZE,
        filteredBills.length
    );

    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const pageList = useMemo(() => {
        if (totalPages <= 5) {
            return Array.from(
                { length: totalPages },
                (_, index) => index + 1
            );
        }

        if (currentPage <= 3) {
            return [1, 2, 3, "...", totalPages];
        }

        if (currentPage >= totalPages - 2) {
            return [
                1,
                "...",
                totalPages - 2,
                totalPages - 1,
                totalPages,
            ];
        }

        return [
            1,
            "...",
            currentPage,
            "...",
            totalPages,
        ];
    }, [currentPage, totalPages]);

    const openBill = (id) => {
        navigate(
            `/approver-dashboard/shipping-bill/${id}`
        );
    };

    return (
        <div className="w-full px-8 py-8 lg:px-10">
            <style>{`
                .font-display { font-family: var(--font-display); }
                .font-mono { font-family: var(--font-mono); }
            `}</style>

            <div className="mx-auto max-w-6xl">
                {/* ================================================= */}
                {/* INBOX */}
                {/* ================================================= */}

                {!isSubmittedPage && (
                    <>
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#b77a12]">
                                    Unit Approver / Action Required
                                </p>

                                <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#172033]">
                                    Inbox
                                </h1>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h2 className="text-xs font-bold text-[#172033]">
                                Needs your action{" "}
                                <span className="font-mono text-[10px] font-normal text-[#8a8f98]">
                                    ({actionableBills.length})
                                </span>
                            </h2>
                        </div>
                    </>
                )}

                {/* ================================================= */}
                {/* SUBMITTED / IN PROGRESS */}
                {/* ================================================= */}

                {isSubmittedPage && (
                    <>
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
                                onClick={() =>
                                    navigate(
                                        "/approver-dashboard/inbox"
                                    )
                                }
                                className="h-9 rounded-xl bg-[#0f1f35] px-4 text-xs font-semibold text-white shadow-[0_3px_10px_rgba(15,31,53,0.15)] transition hover:bg-[#b77a12]"
                            >
                                Inbox
                            </button>
                        </div>

                        <div className="mt-6 flex flex-col gap-3 lg:flex-row">
                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search by Request ID, Shipping Bill No., or Consignee..."
                                className="h-10 w-full rounded-xl border border-[#d9d5cc] bg-white px-3 text-xs text-[#172033] outline-none placeholder:text-[#9aa1ad] focus:border-[#0f1f35] focus:ring-2 focus:ring-[#0f1f35]/5"
                            />

                            <select
                                value={statusFilter}
                                onChange={(event) =>
                                    setStatusFilter(event.target.value)
                                }
                                className="h-10 w-full rounded-xl border border-[#d9d5cc] bg-white px-3 text-xs text-[#172033] outline-none lg:max-w-[300px]"
                            >
                                {statuses.map((status) => (
                                    <option key={status} value={status}>
                                        {status === "ALL"
                                            ? "All statuses"
                                            : getStatusLabel(status)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>
                )}

                {error && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                        {error}
                    </div>
                )}

                {/* ================================================= */}
                {/* TABLE */}
                {/* ================================================= */}

                <div
                    className={
                        isSubmittedPage
                            ? "mt-7 overflow-hidden rounded-xl border border-[#e3dfd6] bg-white"
                            : "mt-3 overflow-hidden rounded-xl border border-[#e3dfd6] bg-white"
                    }
                >
                    {loading ? (
                        <div className="px-6 py-14 text-center text-xs text-[#667085]">
                            Loading Shipping Bills...
                        </div>
                    ) : filteredBills.length === 0 ? (
                        <div className="px-6 py-14 text-center text-xs text-[#667085]">
                            {isSubmittedPage
                                ? "No Shipping Bills found."
                                : "Nothing waiting on you right now."}
                        </div>
                    ) : isSubmittedPage ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left">
                                    <thead className="border-b border-[#e3dfd6]">
                                        <tr className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#8a8f98]">
                                            <th className="px-5 py-3">
                                                Request ID
                                            </th>
                                            <th className="px-5 py-3">
                                                Shipping Bill No.
                                            </th>
                                            <th className="px-5 py-3">
                                                Destination Company
                                            </th>
                                            <th className="px-5 py-3">
                                                Status
                                            </th>
                                            <th className="px-5 py-3">
                                                Current Level
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {paginatedBills.map((bill) => (
                                            <tr
                                                key={bill.id}
                                                onClick={() =>
                                                    openBill(bill.id)
                                                }
                                                className="cursor-pointer border-b border-[#f0ede5] transition hover:bg-[#faf9f6] last:border-b-0"
                                            >
                                                <td className="px-5 py-3.5 font-mono text-xs text-[#172033]">
                                                    {formatValue(
                                                        bill.request_id
                                                    )}
                                                </td>

                                                <td className="px-5 py-3.5 font-mono text-xs text-[#526078]">
                                                    {formatValue(
                                                        bill.shipping_bill_no ||
                                                            bill.shipping_bill_number ||
                                                            bill.shipping_bill
                                                    )}
                                                </td>

                                                <td className="px-5 py-3.5 text-xs text-[#172033]">
                                                    {formatValue(
                                                        bill.destination_company_name
                                                    )}
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <span
                                                        className={[
                                                            "inline-flex rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em]",
                                                            statusClasses[
                                                                bill.status
                                                            ] ||
                                                                "border-slate-200 bg-slate-50 text-slate-600",
                                                        ].join(" ")}
                                                    >
                                                        {getStatusLabel(
                                                            bill.status
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-orange-600">
                                                        {formatValue(
                                                            getCurrentLevel(
                                                                bill
                                                            )
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-between border-t border-[#e3dfd6] px-5 py-3.5">
                                <p className="font-mono text-[10px] text-[#8a8f98]">
                                    Showing {rangeStart}&ndash;{rangeEnd} of{" "}
                                    {filteredBills.length}
                                </p>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            goToPage(
                                                currentPage - 1
                                            )
                                        }
                                        disabled={currentPage === 1}
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d9d5cc] bg-white text-xs disabled:opacity-40"
                                    >
                                        &lsaquo;
                                    </button>

                                    {pageList.map((page, index) =>
                                        page === "..." ? (
                                            <span
                                                key={`ellipsis-${index}`}
                                                className="px-1 text-xs text-[#8a8f98]"
                                            >
                                                ...
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                type="button"
                                                onClick={() =>
                                                    goToPage(page)
                                                }
                                                className={[
                                                    "flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 font-mono text-[10px] font-semibold",
                                                    page === currentPage
                                                        ? "border-[#0f1f35] bg-[#0f1f35] text-white"
                                                        : "border-[#d9d5cc] bg-white text-[#4b556a]",
                                                ].join(" ")}
                                            >
                                                {page}
                                            </button>
                                        )
                                    )}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            goToPage(
                                                currentPage + 1
                                            )
                                        }
                                        disabled={
                                            currentPage ===
                                            totalPages
                                        }
                                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d9d5cc] bg-white text-xs disabled:opacity-40"
                                    >
                                        &rsaquo;
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="border-b border-[#e3dfd6]">
                                    <tr className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#8a8f98]">
                                        <th className="px-5 py-3">
                                            Request ID
                                        </th>
                                        <th className="px-5 py-3">
                                            Destination Company
                                        </th>
                                        <th className="px-5 py-3">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginatedBills.map((bill) => (
                                        <tr
                                            key={bill.id}
                                            onClick={() =>
                                                openBill(bill.id)
                                            }
                                            className="cursor-pointer border-b border-[#f0ede5] transition hover:bg-[#faf9f6] last:border-b-0"
                                        >
                                            <td className="px-5 py-3.5 font-mono text-xs text-[#172033]">
                                                {formatValue(
                                                    bill.request_id
                                                )}
                                            </td>

                                            <td className="px-5 py-3.5 text-xs text-[#172033]">
                                                {formatValue(
                                                    bill.destination_company_name
                                                )}
                                            </td>

                                            <td className="px-5 py-3.5">
                                                <span
                                                    className={[
                                                        "inline-flex rounded-full border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em]",
                                                        statusClasses[
                                                            bill.status
                                                        ] ||
                                                            "border-slate-200 bg-slate-50 text-slate-600",
                                                    ].join(" ")}
                                                >
                                                    {getStatusLabel(
                                                        bill.status
                                                    )}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex items-center justify-between border-t border-[#e3dfd6] px-5 py-3.5">
                            <p className="font-mono text-[10px] text-[#8a8f98]">
                                Showing {rangeStart}&ndash;{rangeEnd} of{" "}
                                {filteredBills.length}
                            </p>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d9d5cc] bg-white text-xs disabled:opacity-40"
                                >
                                    &lsaquo;
                                </button>

                                {pageList.map((page, index) =>
                                    page === "..." ? (
                                        <span
                                            key={`ellipsis-${index}`}
                                            className="px-1 text-xs text-[#8a8f98]"
                                        >
                                            ...
                                        </span>
                                    ) : (
                                        <button
                                            key={page}
                                            type="button"
                                            onClick={() => goToPage(page)}
                                            className={[
                                                "flex h-8 min-w-8 items-center justify-center rounded-lg border px-2 font-mono text-[10px] font-semibold",
                                                page === currentPage
                                                    ? "border-[#0f1f35] bg-[#0f1f35] text-white"
                                                    : "border-[#d9d5cc] bg-white text-[#4b556a]",
                                            ].join(" ")}
                                        >
                                            {page}
                                        </button>
                                    )
                                )}

                                <button
                                    type="button"
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#d9d5cc] bg-white text-xs disabled:opacity-40"
                                >
                                    &rsaquo;
                                </button>
                            </div>
                        </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}