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

// Statuses that mean "this needs the Unit Maker to act on it"
const ACTIONABLE_STATUSES = ["DRAFT", "SENT_BACK", "QUERY_FORWARDED"];

const formatValue = (value) => {
    if (value === null || value === undefined || value === "") {
        return "\u2014";
    }

    return value;
};

export default function MakerInboxHome() {
    const navigate = useNavigate();

    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadBills = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await getShippingBills();
                setBills(Array.isArray(response.data) ? response.data : []);
            } catch (err) {
                console.error("Maker inbox error:", err.response?.data || err);
                setError("Unable to load your inbox.");
            } finally {
                setLoading(false);
            }
        };

        loadBills();
    }, []);

    const actionableBills = useMemo(
        () => bills.filter((bill) => ACTIONABLE_STATUSES.includes(bill.status)),
        [bills]
    );

    return (
        <div>
            <style>{`
                .font-display { font-family: var(--font-display); }
                .font-mono { font-family: var(--font-mono); }
            `}</style>

            {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-600">
                    {error}
                </div>
            )}
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#b77a12]">
                        Unit Maker / CHA
                    </p>
                    <h1 className="mt-1.5 font-display text-2xl font-bold tracking-tight text-[#172033]">
                         Inbox
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

            <div className="mt-8">
                <h2 className="text-xs font-bold text-[#172033]">
                    Needs your action{" "}
                    <span className="font-mono text-[10px] font-normal text-[#8a8f98]">
                        ({actionableBills.length})
                    </span>
                </h2>

                <div className="mt-3 overflow-hidden rounded-xl border border-[#e3dfd6] bg-white">
                    {loading ? (
                        <div className="px-6 py-14 text-center text-xs text-[#667085]">
                            Loading your inbox...
                        </div>
                    ) : actionableBills.length === 0 ? (
                        <div className="px-6 py-14 text-center text-xs text-[#667085]">
                            Nothing waiting on you right now.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-left">
                                <thead className="border-b border-[#e3dfd6]">
                                    <tr className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#8a8f98]">
                                        <th className="px-5 py-3">Request ID</th>
                                        <th className="px-5 py-3">Destination Company</th>
                                        <th className="px-5 py-3">Status</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {actionableBills.map((bill) => (
                                        <tr
                                            key={bill.id}
                                            onClick={() =>
                                                navigate(`/maker-dashboard/shipping-bill/${bill.id}`)
                                            }
                                            className="cursor-pointer border-b border-[#f0ede5] transition hover:bg-[#faf9f6] last:border-b-0"
                                        >
                                            <td className="px-5 py-3.5 font-mono text-xs text-[#172033]">
                                                {formatValue(bill.request_id)}
                                            </td>

                                            <td className="px-5 py-3.5 text-xs text-[#172033]">
                                                {formatValue(bill.destination_company_name)}
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}