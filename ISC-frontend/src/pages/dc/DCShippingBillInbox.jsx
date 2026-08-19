import {
    useEffect,
    useState,
} from "react";

import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import {
    getDCShippingBills,
} from "../../services/dcShippingBillService";


const ACTIONABLE_STATUSES = [

    "SUBMITTED_TO_CUSTOMS",

    "QUERY_RESPONDED",

    "QUERY_RESOLVED",

];


const getStatusClass = (status) => {
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

    return statusClasses[status] || "border-gray-300 bg-gray-100 text-gray-700";
};


const getStatusText = (
    status
) => {

    switch (status) {

        case "SUBMITTED_TO_CUSTOMS":

            return "NEW / ASSESSMENT";


        case "QUERY_RESPONDED":

            return "QUERY RESPONSE RECEIVED";


        case "QUERY_RESOLVED":

            return "QUERY RESOLVED";


        case "SUBMITTED_TO_APPROVER":

            return "SUBMITTED TO APPROVER";


        case "LET_EXPORT":

            return "LET EXPORT";


        default:

            return (
                status || "UNKNOWN"
            ).replaceAll(
                "_",
                " "
            );

    }

};


export default function DCShippingBillInbox() {

    const navigate = useNavigate();

    const location = useLocation();


    const [bills, setBills] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    const isSubmittedPage =
        location.pathname ===
        "/dc-dashboard/submitted";


    /* ========================================================= */
    /* LOAD SHIPPING BILLS */
    /* ========================================================= */

    const loadBills = async () => {

        try {

            setLoading(true);

            setError("");


            const response =
                await getDCShippingBills();


            console.log(
                "DC Shipping Bills:",
                response.data
            );


            const data =
                Array.isArray(
                    response.data
                )
                    ? response.data
                    : Array.isArray(
                        response.data?.results
                    )
                        ? response.data.results
                        : [];


            /* ================================================= */
            /* INBOX */
            /* ================================================= */

            if (!isSubmittedPage) {

                const actionableBills =
                    data.filter(
                        (bill) =>
                            ACTIONABLE_STATUSES.includes(
                                bill.status
                            )
                    );


                setBills(
                    actionableBills
                );

            }

            /* ================================================= */
            /* SUBMITTED / IN PROGRESS */
            /* ================================================= */

            else {

                setBills(data);

            }

        } catch (err) {

            console.error(
                "DC Shipping Bill Error:",
                err.response?.data ||
                err
            );


            setError(
                err.response?.data?.error ||
                "Unable to load Shipping Bills."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        loadBills();

    }, [
        isSubmittedPage,
    ]);


    return (

        <section
            className="
                w-full
                px-8
                py-8
                lg:px-10
            "
        >

            <div
                className="
                    mx-auto
                    max-w-6xl
                "
            >

                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

                <div
                    className="
                        flex
                        flex-col
                        gap-4
                        sm:flex-row
                        sm:items-start
                        sm:justify-between
                    "
                >

                    <div>

                        <p
                            className="
                                font-mono
                                text-[9px]
                                font-bold
                                uppercase
                                tracking-[0.16em]
                                text-[#b77a12]
                            "
                        >
                            DC Customs
                        </p>


                        <h1
                            className="
                                mt-1.5
                                font-display
                                text-2xl
                                font-bold
                                tracking-tight
                                text-[#172033]
                            "
                        >
                            {isSubmittedPage
                                ? "Submitted / In Progress"
                                : "Inbox"}
                        </h1>


                        <p
                            className="
                                mt-1
                                text-xs
                                text-[#667085]
                            "
                        >
                            {isSubmittedPage
                                ? "Every Shipping Bill that has entered the DC Customs workflow"
                                : "Shipping Bills currently requiring Customs action"}
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={loadBills}
                        disabled={loading}
                        className="
                            h-9
                            rounded-xl
                            border
                            border-[#d9d5cc]
                            bg-white
                            px-4
                            text-xs
                            font-semibold
                            text-[#172033]
                            transition
                            hover:bg-[#faf9f6]
                            disabled:opacity-50
                        "
                    >
                        {loading
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>

                </div>


                {/* ================================================= */}
                {/* COUNT */}
                {/* ================================================= */}

                <div
                    className="
                        mt-7
                        flex
                        items-center
                        gap-2
                    "
                >

                    <h2
                        className="
                            text-xs
                            font-bold
                            text-[#172033]
                        "
                    >
                        {isSubmittedPage
                            ? "All Shipping Bills in DC workflow"
                            : "Needs your action"}
                    </h2>


                    <span
                        className="
                            font-mono
                            text-[10px]
                            text-[#8a8f98]
                        "
                    >
                        ({bills.length})
                    </span>

                </div>


                {/* ================================================= */}
                {/* ERROR */}
                {/* ================================================= */}

                {error && (

                    <div
                        className="
                            mt-4
                            rounded-xl
                            border
                            border-red-200
                            bg-red-50
                            px-4
                            py-3
                            text-xs
                            text-red-700
                        "
                    >
                        {error}
                    </div>

                )}


                {/* ================================================= */}
                {/* TABLE */}
                {/* ================================================= */}

                <div
                    className="
                        mt-4
                        overflow-hidden
                        rounded-xl
                        border
                        border-[#e3dfd6]
                        bg-white
                    "
                >

                    {loading ? (

                        <div
                            className="
                                px-6
                                py-14
                                text-center
                                text-xs
                                text-[#667085]
                            "
                        >
                            Loading Shipping Bills...
                        </div>

                    ) : bills.length === 0 ? (

                        <div
                            className="
                                px-6
                                py-14
                                text-center
                                text-xs
                                text-[#667085]
                            "
                        >
                            {isSubmittedPage
                                ? "No Shipping Bills found."
                                : "No Shipping Bills waiting for Customs action."}
                        </div>

                    ) : (

                        <div
                            className="
                                overflow-x-auto
                            "
                        >

                            <table
                                className="
                                    min-w-full
                                    text-left
                                "
                            >

                                <thead
                                    className="
                                        border-b
                                        border-[#e3dfd6]
                                    "
                                >

                                    <tr
                                        className="
                                            bg-[#faf9f6]
                                            font-mono
                                            text-[9px]
                                            font-bold
                                            uppercase
                                            tracking-[0.14em]
                                            text-[#8a8f98]
                                        "
                                    >

                                        <th className="px-5 py-3">
                                            Request ID
                                        </th>

                                        <th className="px-5 py-3">
                                            Shipping Bill No.
                                        </th>

                                        <th className="px-5 py-3">
                                            Company Name
                                        </th>

                                        <th className="px-5 py-3">
                                            Invoice Value
                                        </th>

                                        <th className="px-5 py-3">
                                            Status
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {bills.map(
                                        (bill) => (

                                            <tr
                                                key={
                                                    bill.id
                                                }
                                                onClick={() =>
                                                    navigate(
                                                        `/dc-dashboard/shipping-bill/${bill.id}`
                                                    )
                                                }
                                                className="
                                                    cursor-pointer
                                                    border-b
                                                    border-[#f0ede5]
                                                    last:border-b-0
                                                    transition
                                                    hover:bg-[#faf9f6]
                                                "
                                            >

                                                <td
                                                    className="
                                                        px-5
                                                        py-4
                                                        font-mono
                                                        text-xs
                                                        text-[#172033]
                                                    "
                                                >
                                                    {
                                                        bill.request_id ||
                                                        "—"
                                                    }
                                                </td>


                                                <td
                                                    className="
                                                        px-5
                                                        py-4
                                                        font-mono
                                                        text-xs
                                                    "
                                                >
                                                    {
                                                        bill.shipping_bill_no ||
                                                        "—"
                                                    }
                                                </td>


                                                <td
                                                    className="
                                                        px-5
                                                        py-4
                                                        text-xs
                                                    "
                                                >
                                                    {
                                                        bill.exporter_company_name ||
                                                        bill.exporter_name ||
                                                        "—"
                                                    }
                                                </td>


                                                <td
                                                    className="
                                                        px-5
                                                        py-4
                                                        text-xs
                                                    "
                                                >
                                                    {
                                                        bill.currency ||
                                                        "—"
                                                    }{" "}

                                                    {
                                                        bill.total_invoice_value ??
                                                        "0.00"
                                                    }

                                                </td>


                                                <td
                                                    className="
                                                        px-5
                                                        py-4
                                                    "
                                                >

                                                    <span
                                                        className={[
                                                            "inline-flex rounded-full border px-2.5 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.08em]",

                                                            getStatusClass(
                                                                bill.status
                                                            ),
                                                        ].join(
                                                            " "
                                                        )}
                                                    >
                                                        {
                                                            getStatusText(
                                                                bill.status
                                                            )
                                                        }
                                                    </span>

                                                </td>

                                            </tr>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                    )}

                </div>

            </div>

        </section>

    );

}