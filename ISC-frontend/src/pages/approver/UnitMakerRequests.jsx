import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    getPendingMakers,
    makerApproval,
} from "../../services/approverService";


const PAGE_SIZE = 5;


const statusClasses = {

    PENDING:
        "border-amber-200 bg-amber-50 text-amber-600",

    APPROVED:
        "border-emerald-200 bg-emerald-50 text-emerald-600",

    REJECTED:
        "border-red-200 bg-red-50 text-red-600",

};


const formatValue = (value) => {

    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {

        return "—";

    }

    return value;

};


export default function UnitMakerRequests() {

    const [makers, setMakers] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("ALL");

    const [currentPage, setCurrentPage] =
        useState(1);


    /* ========================================================= */
    /* LOAD REQUESTS */
    /* ========================================================= */

    const loadMakers = async () => {

        try {

            setLoading(true);

            setError("");


            const response =
                await getPendingMakers();


            const data =
                Array.isArray(response.data)
                    ? response.data
                    : [];


            setMakers(data);

        } catch (err) {

            console.error(
                "Unit Maker Requests Error:",
                err.response?.data ||
                err
            );


            setError(
                "Unable to load Unit Maker Requests."
            );

        } finally {

            setLoading(false);

        }

    };


    useEffect(() => {

        loadMakers();

    }, []);


    /* ========================================================= */
    /* APPROVE / REJECT */
    /* ========================================================= */

    const handleApproval =
        async (
            id,
            action
        ) => {

            try {

                await makerApproval(
                    id,
                    action
                );


                await loadMakers();

            } catch (err) {

                console.error(
                    "Maker Approval Error:",
                    err.response?.data ||
                    err
                );


                alert(
                    err.response?.data?.error ||
                    "Unable to process request."
                );

            }

        };


    /* ========================================================= */
    /* STATUS LIST */
    /* ========================================================= */

    const statuses =
        useMemo(() => {

            const unique =
                makers
                    .map(
                        (maker) =>
                            maker.status
                    )
                    .filter(Boolean);


            return [
                "ALL",
                ...new Set(unique),
            ];

        }, [makers]);


    /* ========================================================= */
    /* FILTER */
    /* ========================================================= */

    const filteredMakers =
        useMemo(() => {

            const searchValue =
                search
                    .trim()
                    .toLowerCase();


            return makers.filter(
                (maker) => {

                    const matchesSearch =
                        !searchValue ||
                        [
                            maker.full_name,
                            maker.username,
                            maker.email,
                        ]
                            .filter(Boolean)
                            .some(
                                (value) =>
                                    String(value)
                                        .toLowerCase()
                                        .includes(
                                            searchValue
                                        )
                            );


                    const matchesStatus =
                        statusFilter ===
                            "ALL" ||
                        maker.status ===
                            statusFilter;


                    return (
                        matchesSearch &&
                        matchesStatus
                    );

                }
            );

        }, [
            makers,
            search,
            statusFilter,
        ]);


    useEffect(() => {

        setCurrentPage(1);

    }, [
        search,
        statusFilter,
    ]);


    /* ========================================================= */
    /* PAGINATION */
    /* ========================================================= */

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredMakers.length /
                PAGE_SIZE
            )
        );


    const paginatedMakers =
        useMemo(() => {

            const start =
                (currentPage - 1) *
                PAGE_SIZE;


            return filteredMakers.slice(
                start,
                start + PAGE_SIZE
            );

        }, [
            filteredMakers,
            currentPage,
        ]);


    const rangeStart =
        filteredMakers.length === 0
            ? 0
            : (currentPage - 1) *
                PAGE_SIZE +
                1;


    const rangeEnd =
        Math.min(
            currentPage * PAGE_SIZE,
            filteredMakers.length
        );


    const goToPage =
        (page) => {

            if (
                page < 1 ||
                page > totalPages
            ) {

                return;

            }


            setCurrentPage(page);

        };


    const pageList =
        useMemo(() => {

            if (totalPages <= 5) {

                return Array.from(
                    {
                        length:
                            totalPages,
                    },
                    (_, index) =>
                        index + 1
                );

            }


            if (currentPage <= 3) {

                return [
                    1,
                    2,
                    3,
                    "...",
                    totalPages,
                ];

            }


            if (
                currentPage >=
                totalPages - 2
            ) {

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

        }, [
            currentPage,
            totalPages,
        ]);


    /* ========================================================= */
    /* UI */
    /* ========================================================= */

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
                        lg:flex-row
                        lg:items-start
                        lg:justify-between
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
                            Search Request
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
                            Unit Maker Requests
                        </h1>

                    </div>


                    <div
                        className="
                            h-fit
                            rounded
                            bg-blue-100
                            px-4
                            py-2
                            text-xs
                            text-blue-700
                        "
                    >
                        Pending Requests:
                        {" "}
                        {makers.length}
                    </div>

                </div>


                {/* ================================================= */}
                {/* ERROR */}
                {/* ================================================= */}

                {error && (

                    <div
                        className="
                            mt-5
                            rounded-xl
                            border
                            border-red-200
                            bg-red-50
                            px-3
                            py-2.5
                            text-xs
                            text-red-600
                        "
                    >
                        {error}
                    </div>

                )}


                {/* ================================================= */}
                {/* SEARCH */}
                {/* ================================================= */}

                <div
                    className="
                        mt-6
                        flex
                        flex-col
                        gap-3
                        lg:flex-row
                    "
                >

                    <input
                        type="text"
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                        placeholder="Search by Name, Username, or email..."
                        className="
                            h-10
                            w-full
                            rounded-xl
                            border
                            border-[#d9d5cc]
                            bg-white
                            px-3
                            text-xs
                            text-[#172033]
                            outline-none
                            placeholder:text-[#9aa1ad]
                            focus:border-[#0f1f35]
                            focus:ring-2
                            focus:ring-[#0f1f35]/5
                        "
                    />


                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                        className="
                            h-10
                            w-full
                            rounded-xl
                            border
                            border-[#d9d5cc]
                            bg-white
                            px-3
                            text-xs
                            text-[#172033]
                            outline-none
                            lg:max-w-[260px]
                        "
                    >

                        {statuses.map(
                            (status) => (

                                <option
                                    key={status}
                                    value={status}
                                >
                                    {
                                        status ===
                                        "ALL"
                                            ? "All statuses"
                                            : status.replaceAll(
                                                "_",
                                                " "
                                            )
                                    }
                                </option>

                            )
                        )}

                    </select>

                </div>


                {/* ================================================= */}
                {/* TABLE */}
                {/* ================================================= */}

                <div
                    className="
                        mt-6
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
                            Loading Unit Maker
                            Requests...
                        </div>

                    ) : filteredMakers.length ===
                      0 ? (

                        <div
                            className="
                                px-6
                                py-14
                                text-center
                                text-xs
                                text-[#667085]
                            "
                        >
                            No Unit Maker Requests
                            Found.
                        </div>

                    ) : (

                        <>

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
                                                font-mono
                                                text-[9px]
                                                font-bold
                                                uppercase
                                                tracking-[0.14em]
                                                text-[#8a8f98]
                                            "
                                        >

                                            <th className="px-5 py-3">
                                                Full Name
                                            </th>

                                            <th className="px-5 py-3">
                                                Username
                                            </th>

                                            <th className="px-5 py-3">
                                                Email
                                            </th>

                                            <th className="px-5 py-3">
                                                Status
                                            </th>

                                            <th className="px-5 py-3">
                                                Actions
                                            </th>

                                        </tr>

                                    </thead>


                                    <tbody>

                                        {paginatedMakers.map(
                                            (maker) => (

                                                <tr
                                                    key={
                                                        maker.id
                                                    }
                                                    className="
                                                        border-b
                                                        border-[#f0ede5]
                                                        last:border-b-0
                                                        hover:bg-[#faf9f6]
                                                    "
                                                >

                                                    <td className="px-5 py-3.5 text-xs text-[#172033]">
                                                        {
                                                            formatValue(
                                                                maker.full_name
                                                            )
                                                        }
                                                    </td>


                                                    <td className="px-5 py-3.5 font-mono text-xs text-[#4b556a]">
                                                        {
                                                            formatValue(
                                                                maker.username
                                                            )
                                                        }
                                                    </td>


                                                    <td className="px-5 py-3.5 text-xs text-[#172033]">
                                                        {
                                                            formatValue(
                                                                maker.email
                                                            )
                                                        }
                                                    </td>


                                                    <td className="px-5 py-3.5">

                                                        <span
                                                            className={[
                                                                "inline-flex rounded-full border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-[0.1em]",

                                                                statusClasses[
                                                                    maker.status
                                                                ] ||
                                                                    "border-slate-200 bg-slate-50 text-slate-600",
                                                            ].join(
                                                                " "
                                                            )}
                                                        >

                                                            {
                                                                formatValue(
                                                                    maker.status
                                                                ).replaceAll(
                                                                    "_",
                                                                    " "
                                                                )
                                                            }

                                                        </span>

                                                    </td>


                                                    <td className="px-5 py-3.5">

                                                        <div
                                                            className="
                                                                flex
                                                                gap-2
                                                            "
                                                        >

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleApproval(
                                                                        maker.id,
                                                                        "approve"
                                                                    )
                                                                }
                                                                className="
                                                                    h-7
                                                                    rounded-lg
                                                                    bg-[#0f1f35]
                                                                    px-3
                                                                    text-[10px]
                                                                    font-semibold
                                                                    text-white
                                                                    transition
                                                                    hover:bg-emerald-600
                                                                "
                                                            >
                                                                Approve
                                                            </button>


                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleApproval(
                                                                        maker.id,
                                                                        "reject"
                                                                    )
                                                                }
                                                                className="
                                                                    h-7
                                                                    rounded-lg
                                                                    border
                                                                    border-red-200
                                                                    bg-white
                                                                    px-3
                                                                    text-[10px]
                                                                    font-semibold
                                                                    text-red-600
                                                                    transition
                                                                    hover:bg-red-50
                                                                "
                                                            >
                                                                Reject
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>

                                            )
                                        )}

                                    </tbody>

                                </table>

                            </div>


                            {/* ================================================= */}
                            {/* PAGINATION */}
                            {/* ================================================= */}

                            {totalPages > 1 && (

                                <div
                                    className="
                                        flex
                                        flex-col
                                        items-center
                                        justify-between
                                        gap-3
                                        border-t
                                        border-[#e3dfd6]
                                        px-5
                                        py-3.5
                                        sm:flex-row
                                    "
                                >

                                    <p
                                        className="
                                            font-mono
                                            text-[10px]
                                            text-[#8a8f98]
                                        "
                                    >
                                        Showing{" "}
                                        {rangeStart}
                                        &ndash;
                                        {rangeEnd}
                                        {" "}
                                        of{" "}
                                        {
                                            filteredMakers.length
                                        }
                                    </p>


                                    <div
                                        className="
                                            flex
                                            items-center
                                            gap-1.5
                                        "
                                    >

                                        <button
                                            type="button"
                                            onClick={() =>
                                                goToPage(
                                                    currentPage -
                                                        1
                                                )
                                            }
                                            disabled={
                                                currentPage ===
                                                1
                                            }
                                            className="
                                                flex
                                                h-7
                                                w-7
                                                items-center
                                                justify-center
                                                rounded-lg
                                                border
                                                border-[#d9d5cc]
                                                bg-white
                                                text-xs
                                                disabled:opacity-40
                                            "
                                        >
                                            &lsaquo;
                                        </button>


                                        {pageList.map(
                                            (
                                                page,
                                                index
                                            ) =>

                                                page ===
                                                "..." ? (

                                                    <span
                                                        key={
                                                            `ellipsis-${index}`
                                                        }
                                                        className="
                                                            px-1
                                                            text-xs
                                                            text-[#8a8f98]
                                                        "
                                                    >
                                                        ...
                                                    </span>

                                                ) : (

                                                    <button
                                                        key={
                                                            page
                                                        }
                                                        type="button"
                                                        onClick={() =>
                                                            goToPage(
                                                                page
                                                            )
                                                        }
                                                        className={[
                                                            "flex h-7 min-w-7 items-center justify-center rounded-lg border px-2 font-mono text-[10px] font-semibold",

                                                            page ===
                                                            currentPage
                                                                ? "border-[#0f1f35] bg-[#0f1f35] text-white"
                                                                : "border-[#d9d5cc] bg-white text-[#4b556a]",
                                                        ].join(
                                                            " "
                                                        )}
                                                    >
                                                        {
                                                            page
                                                        }
                                                    </button>

                                                )
                                        )}


                                        <button
                                            type="button"
                                            onClick={() =>
                                                goToPage(
                                                    currentPage +
                                                        1
                                                )
                                            }
                                            disabled={
                                                currentPage ===
                                                totalPages
                                            }
                                            className="
                                                flex
                                                h-7
                                                w-7
                                                items-center
                                                justify-center
                                                rounded-lg
                                                border
                                                border-[#d9d5cc]
                                                bg-white
                                                text-xs
                                                disabled:opacity-40
                                            "
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

        </section>

    );

}