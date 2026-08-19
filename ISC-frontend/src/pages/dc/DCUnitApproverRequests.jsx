import {
    useEffect,
    useState,
} from "react";

import {
    getPendingCompanies,
    companyApproval,
} from "../../services/dcService";


export default function DCUnitApproverRequests() {

    const [companies, setCompanies] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [processingId, setProcessingId] =
        useState(null);


    /* ========================================================= */
    /* LOAD REQUESTS */
    /* ========================================================= */

    const loadCompanies = async () => {

        try {

            setLoading(true);

            setError("");


            const response =
                await getPendingCompanies();


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


            setCompanies(data);

        } catch (err) {

            console.error(
                "DC Unit Approver Requests Error:",
                err.response?.data ||
                err
            );


            setError(
                err.response?.data?.error ||
                "Unable to load Unit Approver requests."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        loadCompanies();

    }, []);


    /* ========================================================= */
    /* APPROVE / REJECT */
    /* ========================================================= */

    const handleApproval =
        async (
            id,
            action
        ) => {

            const message =
                action === "approve"
                    ? "Approve this Unit Approver request?"
                    : "Reject this Unit Approver request?";


            const confirmed =
                window.confirm(
                    message
                );


            if (!confirmed) {

                return;

            }


            try {

                setProcessingId(id);

                setError("");


                await companyApproval(
                    id,
                    action
                );


                alert(
                    action === "approve"
                        ? "Unit Approver request approved successfully."
                        : "Unit Approver request rejected successfully."
                );


                await loadCompanies();

            } catch (err) {

                console.error(
                    "Unit Approver Approval Error:",
                    err.response?.data ||
                    err
                );


                setError(
                    err.response?.data?.error ||
                    "Unable to process the request."
                );

            } finally {

                setProcessingId(null);

            }

        };


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
                            Company Login Approval
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
                            Unit Approver Requests
                        </h1>


                        <p
                            className="
                                mt-1
                                text-xs
                                text-[#667085]
                            "
                        >
                            Company requests for Unit
                            Approver login approval.
                        </p>

                    </div>


                    <button
                        type="button"
                        onClick={loadCompanies}
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
                        Pending Requests
                    </h2>


                    <span
                        className="
                            font-mono
                            text-[10px]
                            text-[#8a8f98]
                        "
                    >
                        ({companies.length})
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
                {/* LOADING */}
                {/* ================================================= */}

                {loading ? (

                    <div
                        className="
                            mt-4
                            rounded-xl
                            border
                            border-[#e3dfd6]
                            bg-white
                            px-6
                            py-14
                            text-center
                            text-xs
                            text-[#667085]
                        "
                    >
                        Loading Unit Approver
                        requests...
                    </div>

                ) : companies.length ===
                  0 ? (

                    <div
                        className="
                            mt-4
                            rounded-xl
                            border
                            border-[#e3dfd6]
                            bg-white
                            px-6
                            py-14
                            text-center
                            text-xs
                            text-[#667085]
                        "
                    >
                        No Pending Unit Approver
                        Requests.
                    </div>

                ) : (

                    <div
                        className="
                            mt-4
                            space-y-4
                        "
                    >

                        {companies.map(
                            (company) => (

                                <div
                                    key={
                                        company.id
                                    }
                                    className="
                                        rounded-xl
                                        border
                                        border-[#e3dfd6]
                                        bg-white
                                        p-6
                                    "
                                >

                                    <div
                                        className="
                                            flex
                                            flex-col
                                            gap-6
                                            lg:flex-row
                                            lg:items-start
                                            lg:justify-between
                                        "
                                    >

                                        {/* COMPANY DETAILS */}

                                        <div
                                            className="
                                                min-w-0
                                                flex-1
                                            "
                                        >

                                            <div
                                                className="
                                                    flex
                                                    flex-wrap
                                                    items-center
                                                    gap-3
                                                "
                                            >

                                                <h3
                                                    className="
                                                        font-display
                                                        text-lg
                                                        font-bold
                                                        text-[#172033]
                                                    "
                                                >
                                                    {
                                                        company.company_name ||
                                                        "Company"
                                                    }
                                                </h3>


                                                <span
                                                    className="
                                                        inline-flex
                                                        rounded-full
                                                        border
                                                        border-amber-200
                                                        bg-amber-50
                                                        px-2.5
                                                        py-1
                                                        font-mono
                                                        text-[9px]
                                                        font-bold
                                                        uppercase
                                                        tracking-[0.08em]
                                                        text-amber-700
                                                    "
                                                >
                                                    {
                                                        company.status ||
                                                        "PENDING"
                                                    }
                                                </span>

                                            </div>


                                            <div
                                                className="
                                                    mt-5
                                                    grid
                                                    gap-x-8
                                                    gap-y-4
                                                    sm:grid-cols-2
                                                    lg:grid-cols-3
                                                "
                                            >

                                                <Info
                                                    label="Company Code"
                                                    value={
                                                        company.company_code ||
                                                        "Not Generated"
                                                    }
                                                />


                                                <Info
                                                    label="IEC Code"
                                                    value={
                                                        company.iec_code
                                                    }
                                                />


                                                <Info
                                                    label="GSTIN"
                                                    value={
                                                        company.gstin
                                                    }
                                                />


                                                <Info
                                                    label="Zone"
                                                    value={
                                                        company.zone_name
                                                    }
                                                />


                                                <Info
                                                    label="Unit Approver"
                                                    value={
                                                        company.approver_name
                                                    }
                                                />


                                                <Info
                                                    label="Address"
                                                    value={
                                                        company.address
                                                    }
                                                />

                                            </div>

                                        </div>


                                        {/* ACTIONS */}

                                        <div
                                            className="
                                                flex
                                                shrink-0
                                                gap-2
                                            "
                                        >

                                            <button
                                                type="button"
                                                disabled={
                                                    processingId ===
                                                    company.id
                                                }
                                                onClick={() =>
                                                    handleApproval(
                                                        company.id,
                                                        "approve"
                                                    )
                                                }
                                                className="
                                                    rounded-xl
                                                    bg-[#0f1f35]
                                                    px-4
                                                    py-2.5
                                                    text-xs
                                                    font-semibold
                                                    text-white
                                                    transition
                                                    hover:bg-emerald-600
                                                    disabled:opacity-50
                                                "
                                            >
                                                {processingId ===
                                                company.id
                                                    ? "Processing..."
                                                    : "Approve"}
                                            </button>


                                            <button
                                                type="button"
                                                disabled={
                                                    processingId ===
                                                    company.id
                                                }
                                                onClick={() =>
                                                    handleApproval(
                                                        company.id,
                                                        "reject"
                                                    )
                                                }
                                                className="
                                                    rounded-xl
                                                    border
                                                    border-red-200
                                                    bg-white
                                                    px-4
                                                    py-2.5
                                                    text-xs
                                                    font-semibold
                                                    text-red-600
                                                    transition
                                                    hover:bg-red-50
                                                    disabled:opacity-50
                                                "
                                            >
                                                Reject
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            )
                        )}

                    </div>

                )}

            </div>

        </section>

    );

}


/* ============================================================= */
/* INFO FIELD */
/* ============================================================= */

function Info({
    label,
    value,
}) {

    return (

        <div>

            <p
                className="
                    font-mono
                    text-[9px]
                    uppercase
                    tracking-[0.12em]
                    text-[#8a8f98]
                "
            >
                {label}
            </p>


            <p
                className="
                    mt-1
                    break-words
                    text-xs
                    font-medium
                    text-[#172033]
                "
            >
                {value ||
                    "—"}
            </p>

        </div>

    );

}