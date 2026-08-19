import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import JoinAsMaker from "./pages/JoinAsMaker";

import MakerDashboard from "./pages/MakerDashboard";
import ApproverDashboard from "./pages/ApproverDashboard";
import DCDashboard from "./pages/DCDashboard";
import ACDashboard from "./pages/ACDashboard";

import ProtectedRoute from "./components/ProtectedRoute";

import CheckStatus from "./pages/CheckStatus";
import CreateShippingBill from "./pages/CreateShippingBill";

import MakerInboxHome from "./pages/shipping/MakerInboxHome";
import ShippingBillInbox from "./pages/shipping/ShippingBillInbox";
import ShippingBillDetails from "./pages/shipping/ShippingBillDetails";

import ShippingBillApproverInbox from "./pages/approver/ShippingBillApproverInbox";
import ShippingBillApproverReview from "./pages/approver/ShippingBillApproverReview";
import UnitMakerRequests from "./pages/approver/UnitMakerRequests";

import DCShippingBillInbox from "./pages/dc/DCShippingBillInbox";
import DCShippingBillDetails from "./pages/dc/DCShippingBillDetails";
import DCUnitApproverRequests from "./pages/dc/DCUnitApproverRequests";
import HSNMaster from "./pages/HSNMaster";
import ShippingBillPrint from "./pages/shipping/ShippingBillPrint";
import ShippingBillPrintPreview from "./pages/shipping/ShippingBillPrintPreview";


function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* ================================================= */}
                {/* PUBLIC */}
                {/* ================================================= */}

                <Route
                    path="/"
                    element={<Landing />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

                <Route
                    path="/unit-maker-register"
                    element={<JoinAsMaker />}
                />

                <Route
                    path="/check-status"
                    element={<CheckStatus />}
                />


                {/* ================================================= */}
                {/* UNIT MAKER */}
                {/* ================================================= */}

                <Route
                    path="/maker-dashboard"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "UNIT_MAKER",
                            ]}
                        >
                            <MakerDashboard />
                        </ProtectedRoute>
                    }
                >

                    {/* Default → Inbox */}

                    <Route
                        index
                        element={
                            <MakerInboxHome />
                        }
                    />


                    {/* Submitted / In Progress */}

                    <Route
                        path="shipping-bills"
                        element={
                            <ShippingBillInbox />
                        }
                    />


                    {/* Shipping Bill Details */}

                    <Route
                        path="shipping-bill/:id"
                        element={
                            <ShippingBillDetails />
                        }
                    />


                    {/* Create Shipping Bill */}

                    <Route
                        path="create-shipping-bill"
                        element={
                            <CreateShippingBill />
                        }
                    />

                    {/* Print Shipping Bill - READ ONLY */}
                    <Route
                        path="print-sb"
                        element={<ShippingBillPrint />}
                    />

                    <Route
                        path="print-sb/:id"
                        element={<ShippingBillPrintPreview />}
                    />

                    {/* HSN Master */}
                    <Route
                        path="hsn-master"
                        element={
                            <HSNMaster />
                        }
                    />

                </Route>


                {/* ================================================= */}
                {/* UNIT APPROVER */}
                {/* ================================================= */}

                <Route
                    path="/approver-dashboard"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "UNIT_APPROVER",
                            ]}
                        >
                            <ApproverDashboard />
                        </ProtectedRoute>
                    }
                >

                    {/* ----------------------------------------- */}
                    {/* DEFAULT → INBOX */}
                    {/* ----------------------------------------- */}

                    <Route
                        index
                        element={
                            <Navigate
                                to="inbox"
                                replace
                            />
                        }
                    />


                    {/* ----------------------------------------- */}
                    {/* 1. INBOX */}
                    {/* ----------------------------------------- */}

                    <Route
                        path="inbox"
                        element={
                            <ShippingBillApproverInbox />
                        }
                    />


                    {/* ----------------------------------------- */}
                    {/* 2. SUBMITTED / IN PROGRESS */}
                    {/* ----------------------------------------- */}

                    <Route
                        path="submitted"
                        element={
                            <ShippingBillApproverInbox />
                        }
                    />


                    {/* ----------------------------------------- */}
                    {/* 3. UNIT MAKER REQUESTS */}
                    {/* ----------------------------------------- */}

                    <Route
                        path="unit-maker-requests"
                        element={
                            <UnitMakerRequests />
                        }
                    />

                    {/* Print Shipping Bill - READ ONLY */}
                    <Route
                        path="print-sb"
                        element={<ShippingBillPrint />}
                    />

                    <Route
                        path="print-sb/:id"
                        element={<ShippingBillPrintPreview />}
                    />

                    {/* HSN Master */}
                    <Route
                        path="hsn-master"
                        element={
                            <HSNMaster />
                        }
                    />


                    {/* ----------------------------------------- */}
                    {/* SHIPPING BILL REVIEW */}
                    {/* ----------------------------------------- */}

                    <Route
                        path="shipping-bill/:id"
                        element={
                            <ShippingBillApproverReview />
                        }
                    />

                </Route>


                {/* ================================================= */}
                {/* DC CUSTOMS */}
                {/* ================================================= */}

                <Route
                    path="/dc-dashboard"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "DC_CUSTOMS",
                            ]}
                        >
                            <DCDashboard />
                        </ProtectedRoute>
                    }
                >

                    {/* ----------------------------------------- */}
                    {/* DEFAULT → INBOX */}
                    {/* ----------------------------------------- */}

                    <Route
                        index
                        element={
                            <Navigate
                                to="inbox"
                                replace
                            />
                        }
                    />


                    {/* ----------------------------------------- */}
                    {/* 1. INBOX */}
                    {/* ----------------------------------------- */}

                    <Route
                        path="inbox"
                        element={
                            <DCShippingBillInbox />
                        }
                    />


                    {/* ----------------------------------------- */}
                    {/* 2. SUBMITTED / IN PROGRESS */}
                    {/* ----------------------------------------- */}

                    <Route
                        path="submitted"
                        element={
                            <DCShippingBillInbox />
                        }
                    />


                    {/* ----------------------------------------- */}
                    {/* 3. UNIT APPROVER REQUESTS */}
                    {/* ----------------------------------------- */}

                    <Route
                        path="unit-approver-requests"
                        element={
                            <DCUnitApproverRequests />
                        }
                    />


                    {/* ----------------------------------------- */}
                    {/* SHIPPING BILL DETAILS */}
                    {/* ----------------------------------------- */}

                    <Route
                        path="shipping-bill/:id"
                        element={
                            <DCShippingBillDetails />
                        }
                    />

                    {/* Print Shipping Bill - READ ONLY */}
                    <Route
                        path="print-sb"
                        element={<ShippingBillPrint />}
                    />

                    <Route
                        path="print-sb/:id"
                        element={<ShippingBillPrintPreview />}
                    />

                    {/* HSN Master */}
                    <Route
                        path="hsn-master"
                        element={
                            <HSNMaster />
                        }
                    />

                </Route>


                {/* ================================================= */}
                {/* AC CUSTOMS */}
                {/* ================================================= */}

                <Route
                    path="/ac-dashboard"
                    element={
                        <ProtectedRoute
                            allowedRoles={[
                                "AC_CUSTOMS",
                            ]}
                        >
                            <ACDashboard />
                        </ProtectedRoute>
                    }
                >
                    <Route
                        path="hsn-master"
                        element={
                            <HSNMaster />
                        }
                    />
                </Route>

                {/* ================================================= */}
                {/* AC CUSTOMS - PRINT SB (READ ONLY) */}
                {/* ================================================= */}

                <Route
                    path="/ac-dashboard/print-sb"
                    element={
                        <ProtectedRoute
                            allowedRoles={["AC_CUSTOMS"]}
                        >
                            <ShippingBillPrint />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="/ac-dashboard/print-sb/:id"
                    element={
                        <ProtectedRoute
                            allowedRoles={["AC_CUSTOMS"]}
                        >
                            <ShippingBillPrintPreview />
                        </ProtectedRoute>
                    }
                />

            </Routes>

        </BrowserRouter>

    );

}


export default App;