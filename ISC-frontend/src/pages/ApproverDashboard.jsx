import {
    Outlet,
    useLocation,
    useNavigate,
} from "react-router-dom";

import { logout } from "../utils/auth";


const navItems = [
    {
        key: "inbox",
        label: "Inbox",
        path: "/approver-dashboard/inbox",
    },

    {
        key: "submitted",
        label: "Submitted / In Progress",
        path: "/approver-dashboard/submitted",
    },

    {
        key: "unit-maker-requests",
        label: "Unit Maker Requests",
        path: "/approver-dashboard/unit-maker-requests",
    },

    {
        label: "Print SB",
        path: "/approver-dashboard/print-sb",

        match: (pathname) =>
            pathname === "/approver-dashboard/print-sb" ||
            pathname.startsWith("/approver-dashboard/print-sb/"),
    },

    {
        key: "hsn-master",
        label: "HSN Master",
        path: "/approver-dashboard/hsn-master",
    },
];


export default function ApproverDashboard() {

    const navigate = useNavigate();

    const location = useLocation();


    const displayName =
        localStorage.getItem("full_name") ||
        localStorage.getItem("username") ||
        "User";


    const company =
        localStorage.getItem("company") ||
        "Unit";

    const companyCode =
        localStorage.getItem("company_code") ||
        "Company_code";


    /*
     * ============================================================
     * DETERMINE ACTIVE SIDEBAR SECTION
     * ============================================================
     *
     * Only ONE section can be active at a time.
     */

    const pathname =
        location.pathname.replace(/\/+$/, "");


    let activeKey = "inbox";


    if (pathname === "/approver-dashboard/hsn-master") {

        activeKey = "hsn-master";

    } else if (
        pathname ===
        "/approver-dashboard/unit-maker-requests"
    ) {

        activeKey =
            "unit-maker-requests";

    } else if (
        pathname ===
        "/approver-dashboard/submitted"
    ) {

        activeKey =
            "submitted";

    } else if (
        pathname ===
            "/approver-dashboard/inbox" ||
        pathname.startsWith(
            "/approver-dashboard/shipping-bill/"
        )
    ) {

        activeKey =
            "inbox";

    }


    return (

        <div
            className="
                h-screen
                overflow-hidden
                bg-[#f5f2eb]
                text-[#172033]
            "
        >

            <style>{`

                .font-display {
                    font-family: var(--font-display);
                }

                .font-mono {
                    font-family: var(--font-mono);
                }

            `}</style>


            {/* ================================================= */}
            {/* FIXED LEFT SIDEBAR */}
            {/* ================================================= */}

            <aside
                className="
                    fixed
                    inset-y-0
                    left-0
                    z-50
                    flex
                    h-screen
                    w-[274px]
                    flex-col
                    justify-between
                    overflow-y-auto
                    bg-[#0f1f35]
                    px-5
                    py-6
                    text-[#d5ddf0]
                "
            >

                <div>

                    {/* ================================================= */}
                    {/* LOGO */}
                    {/* ================================================= */}

                    <div
                        className="
                            font-display
                            text-lg
                            font-bold
                            tracking-tight
                            text-white
                        "
                    >
                        ISC Portal
                    </div>


                    <p
                        className="
                            mt-1
                            font-mono
                            text-[9px]
                            uppercase
                            tracking-[0.16em]
                            text-[#8a93ab]
                        "
                    >
                        Shipping Bill Portal
                    </p>


                    <div
                        className="
                            mt-6
                            border-t
                            border-white/10
                        "
                    />


                    {/* ================================================= */}
                    {/* SIDEBAR NAVIGATION */}
                    {/* ================================================= */}

                    <nav
                        className="
                            mt-4
                            space-y-1.5
                        "
                    >

                        {navItems.map(
                            (item) => {

                                const active =
                                    activeKey ===
                                    item.key;


                                return (

                                    <button
                                        key={
                                            item.key
                                        }
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                item.path
                                            )
                                        }
                                        className={[
                                            `
                                                flex
                                                w-full
                                                items-center
                                                justify-between
                                                rounded-xl
                                                px-3
                                                py-3
                                                text-left
                                                text-xs
                                                font-semibold
                                                transition
                                            `,

                                            active
                                                ? `
                                                    bg-[#293d59]
                                                    text-white
                                                `
                                                : `
                                                    text-[#aebbd6]
                                                    hover:bg-[#1b304a]
                                                    hover:text-white
                                                `,
                                        ].join(" ")}
                                    >

                                        <span>
                                            {
                                                item.label
                                            }
                                        </span>

                                    </button>

                                );

                            }
                        )}

                    </nav>

                </div>


                {/* ================================================= */}
                {/* SIDEBAR FOOTER */}
                {/* ================================================= */}

                <p
                    className="
                        text-[10px]
                        leading-4
                        text-[#8a93ab]
                    "
                >
                    Demo build modeled on the
                    SEZ Online shipping bill
                    workflow.
                </p>

            </aside>


            {/* ================================================= */}
            {/* RIGHT SIDE */}
            {/* ================================================= */}

            <div
                className="
                    ml-[274px]
                    flex
                    h-screen
                    min-h-0
                    flex-col
                "
            >

                {/* ================================================= */}
                {/* HEADER */}
                {/* ================================================= */}

                <header
                    className="
                        flex
                        min-h-[76px]
                        shrink-0
                        items-start
                        justify-between
                        border-b
                        border-[#e3dfd6]
                        bg-white
                        px-8
                        py-5
                    "
                >

                    <div>

                        <h2
                            className="
                                font-display
                                text-base
                                font-bold
                                text-[#172033]
                            "
                        >
                            {displayName}
                        </h2>


                        <p
                            className="
                                mt-0.5
                                text-xs
                                text-[#667085]
                            "
                        >
                            Unit Approver ·{" "}
                            {company}
                        </p>

                    </div>


                    <div className="flex flex-col items-end gap-1">
                        <button
                            type="button"
                            onClick={logout}
                            className="
                                text-xs
                                font-semibold
                                text-[#b77a12]
                                transition
                                hover:text-[#8f620c]
                            "
                        >
                            Sign out
                        </button>

                        <p
                            className="
                                text-[10px] 
                                font-medium 
                                tracking-wide
                                text-[#667085]
                            "
                        >
                            Company Code ·{" "}
                            {companyCode}
                        </p>
                    </div>

                </header>


                {/* ================================================= */}
                {/* RIGHT CONTENT - ONLY THIS SCROLLS */}
                {/* ================================================= */}

                <main
                    className="
                        min-h-0
                        flex-1
                        overflow-y-auto
                        overflow-x-hidden
                    "
                >
                    <div
                        className="
                            mx-auto
                            w-full
                            max-w-6xl
                            px-6
                            py-8
                            lg:px-10
                        "
                    >
                        <Outlet />
                    </div>
                </main>

            </div>

        </div>

    );

}