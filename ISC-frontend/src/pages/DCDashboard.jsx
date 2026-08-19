import {
    useLocation,
    useNavigate,
    Outlet,
} from "react-router-dom";

import { logout } from "../utils/auth";


const navItems = [

    {
        label: "Inbox",
        path: "/dc-dashboard/inbox",

        match: (pathname) =>
            pathname ===
                "/dc-dashboard/inbox" ||
            pathname.startsWith(
                "/dc-dashboard/shipping-bill/"
            ),
    },

    {
        label: "Submitted / In Progress",
        path: "/dc-dashboard/submitted",

        match: (pathname) =>
            pathname ===
                "/dc-dashboard/submitted",
    },

    {
        label: "Unit Approver Requests",
        path:
            "/dc-dashboard/unit-approver-requests",

        match: (pathname) =>
            pathname.startsWith(
                "/dc-dashboard/unit-approver-requests"
            ),
    },

    {
        label: "Print SB",
        path: "/dc-dashboard/print-sb",

        match: (pathname) =>
            pathname === "/dc-dashboard/print-sb" ||
            pathname.startsWith("/dc-dashboard/print-sb/"),
    },

    {
        label: "HSN Master",
        path: "/dc-dashboard/hsn-master",

        match: (pathname) =>
            pathname === "/dc-dashboard/hsn-master",
    },

];


export default function DCDashboard() {

    const navigate = useNavigate();

    const location = useLocation();


    const displayName =
        localStorage.getItem("full_name") ||
        localStorage.getItem("username") ||
        "DC Customs";


    const company =
        localStorage.getItem("company") ||
        "Customs";


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
            {/* FIXED SIDEBAR */}
            {/* ================================================= */}

            <aside
                className="
                    fixed
                    inset-y-0
                    left-0
                    z-50
                    flex
                    h-screen
                    w-[240px]
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

                    {/* LOGO */}

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
                    {/* NAVIGATION */}
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
                                    item.match(
                                        location.pathname
                                    );


                                return (

                                    <button
                                        key={
                                            item.label
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
                                                    bg-white/10
                                                    text-white
                                                `
                                                : `
                                                    text-[#aebbd6]
                                                    hover:bg-white/5
                                                    hover:text-white
                                                `,
                                        ].join(" ")}
                                    >

                                        {item.label}

                                    </button>

                                );

                            }
                        )}

                    </nav>

                </div>


                {/* FOOTER */}

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
                    ml-[240px]
                    flex
                    h-screen
                    min-h-0
                    flex-col
                "
            >

                {/* ================================================= */}
                {/* FIXED HEADER */}
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
                                text-xs
                                text-[#667085]
                            "
                        >
                            DC Customs ·{" "}
                            {company}
                        </p>

                    </div>


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

                </header>


                {/* ================================================= */}
                {/* ONLY RIGHT SIDE SCROLLS */}
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