import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser } from "../services/authService";

const roles = [
  {
    id: "unit_maker",
    name: "Unit Maker",
    desc: "Prepare and submit shipping bills for your unit.",
  },
  {
    id: "unit_approver",
    name: "Unit Approver",
    desc: "Verify shipping bills, submit & handle customs queries raised.",
  },
  {
    id: "dc_customs",
    name: "DC Customs",
    desc: "Verify registered companies and assess submitted shipping bills.",
  },
  {
    id: "harbor_customs",
    name: "AC Customs",
    desc: "Grant final port clearance after EGM filing is complete.",
  },
];

const ROLE_ICONS = {
  unit_maker: "fi fi-ss-file-signature",
  unit_approver: "fi fi-ss-badge-check",
  dc_customs: "fi fi-ss-stamp",
  harbor_customs: "fi fi-ss-anchor",
};

const NO_SELF_REGISTER_ROLES = ["dc_customs", "harbor_customs"];

const ROLE_MAPPING = {
  unit_maker: "UNIT_MAKER",
  unit_approver: "UNIT_APPROVER",
  dc_customs: "DC_CUSTOMS",
  harbor_customs: "AC_CUSTOMS",
};

const EyeIcon = ({ open }) => (
  <i className={`fi ${open ? "fi-ss-eye-crossed" : "fi-ss-eye"} text-xs`} />
);

export default function Login() {
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState("unit_maker");
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");

  const currentRole = roles.find((role) => role.id === selectedRole);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const response = await loginUser(formData);
      const { access_token, refresh_token, user } = response.data;
      const expectedRole = ROLE_MAPPING[selectedRole];

      if (user.role !== expectedRole) {
        setError(
          <>
            Please login using the{" "}
            <strong>
              {roles.find((r) => r.id === selectedRole).name}
            </strong>{" "}
            account.
          </>
        );
        return;
      }

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("refresh_token", refresh_token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("username", user.username || "");
      localStorage.setItem("full_name", user.full_name || "");
      localStorage.setItem("role", user.role || "");
      localStorage.setItem("company", user.company || "");
      localStorage.setItem("company_code", user.company_code || "");

      switch (user.role) {
        case "UNIT_MAKER":
          navigate("/maker-dashboard");
          break;
        case "UNIT_APPROVER":
          navigate("/approver-dashboard");
          break;
        case "DC_CUSTOMS":
          navigate("/dc-dashboard");
          break;
        case "AC_CUSTOMS":
          navigate("/ac-dashboard");
          break;
        default:
          navigate("/");
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      console.log("STATUS:", err.response?.status);
      console.log("RESPONSE DATA:", err.response?.data);
      console.log("REQUEST URL:", err.config?.url);
      console.log("REQUEST DATA:", err.config?.data);

      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;

        if (status === 401) {
          setError(
            data?.detail ||
            data?.message ||
            "Incorrect username or password."
          );
        } else if (status === 403) {
          setError("You don't have permission to access this account.");
        } else if (status === 404) {
          setError("Account not found.");
        } else if (status === 429) {
          setError("Too many attempts. Please try again later.");
        } else if (status >= 500) {
          setError("Server error. Please try again in a few moments.");
        } else {
          setError(
            data?.detail ||
            data?.message ||
            "Login failed. Please try again."
          );
        }
      } else if (err.request) {
        setError(
          "Unable to connect to the server. Please check whether Django is running."
        );
      } else {
        setError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="isc-login-root min-h-screen w-full flex flex-col lg:flex-row">
      <style>{`
        .isc-login-root {
          background: var(--color-navy-100);
          font-family: var(--font-sans);
          color: var(--color-ink);
        }
        .font-display {
          font-family: var(--font-display);
        }
        .font-mono {
          font-family: var(--font-mono);
        }
      `}</style>

      {/* =====================================================
          LEFT SIDE - BRANDING
      ===================================================== */}

      <div className="w-full lg:w-1/2 min-h-screen bg-[#f5f2eb] flex items-center justify-center">
        <div className="w-full max-w-xl px-5 py-6 sm:px-7 sm:py-8 flex flex-col flex-1">
          {/* Back to Home */}
          <Link to="/" className="inline-flex flex-row items-center whitespace-nowrap gap-1.5 px-2.5 py-1 rounded-full bg-[#eef2f7] border border-[#d5dce6] text-[9px] font-bold uppercase tracking-[0.13em] text-[#344054] hover:bg-[#e4eaf2] hover:text-[#0f1f35] transition-colors w-fit mb-6">
            <span className="text-sm leading-none">←</span>
            <span className="whitespace-nowrap">Back to Home</span>
          </Link>

          {/* BRAND */}
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#0f1f35] text-white flex items-center justify-center shadow-sm shrink-0">
              <i className={`${ROLE_ICONS[selectedRole]} text-sm leading-none flex items-center justify-center`} />
            </div>

            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#b77a12]">
                Customs Directorate
              </p>
              <p className="text-[11px] text-[#667085] mt-0.5">
                International Shipping Clearance
              </p>
            </div>
          </div>

          {/* PORTAL TITLE */}
          <div className="max-w-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold text-[#b77a12] mb-2">
              ISC Portal
            </p>

            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#172033] leading-[1.15]">
              Shipping Bill Management Portal
            </h1>

            <p className="mt-3 text-xs leading-5 text-[#667085]">
              Manage shipping bills from company registration through
              verification, assessment and final customs clearance in one
              secure portal.
            </p>
          </div>

          {/* CLEARANCE WORKFLOW */}
          <div className="mt-8 w-full max-w-md pb-20">

            <p className="font-mono text-[9px] uppercase tracking-[0.16em] font-bold text-[#8a8f98] mb-4">
              Clearance Workflow
            </p>

            <div className="relative">

              {/* single continuous line, positioned through the vertical center of the circles */}
              <div className="absolute top-3 left-3 right-3 h-px bg-[#cfcac0]" />

              {/* circles row */}
              <div className="relative flex items-center justify-between">
                {[
                  { n: 1, label: "Registration" },
                  { n: 2, label: "Verification" },
                  { n: 3, label: "Assessment" },
                  { n: 4, label: "Clearance" },
                ].map((step, i) => (
                  <div key={step.n} className="flex flex-col items-center gap-2 bg-transparent">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0 ${
                        i === 3 ? "bg-[#b77a12]" : "bg-[#0f1f35]"
                      }`}
                    >
                      {step.n}
                    </div>
                    <span className="text-[8px] text-[#7b8190] text-center w-16">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

            </div>

          </div>

          {/* LEFT BOTTOM LINKS */}
          <div className="pb-5">
            <div className="border-t border-[#ddd9d0] pt-3">
              <p className="text-[11px] text-[#7b8190] mb-2">
                Need onboarding?
              </p>

              <div className="flex flex-col gap-y-1.5">
                <Link
                  to="/register"
                  className="text-xs font-semibold text-[#b77a12] hover:text-[#8f620c] transition-colors"
                >
                  Register a new company →
                </Link>

                <Link
                  to="/unit-maker-register"
                  className="text-xs font-semibold text-[#b77a12] hover:text-[#8f620c] transition-colors"
                >
                  Register Unit Maker →
                </Link>

                <Link
                  to="/check-status"
                  className="text-xs font-semibold text-[#667085] hover:text-[#0f1f35] transition-colors"
                >
                  Check account status →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          RIGHT SIDE - LOGIN
      ===================================================== */}

      <div className="w-full lg:w-1/2 min-h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-lg px-5 py-6 sm:px-7 sm:py-8">
          {/* AUTH BADGE */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f7f6f2] border border-[#e3dfd6] text-[9px] font-bold uppercase tracking-[0.13em] text-[#667085] mb-4">
            <span className="w-1 h-1 rounded-full bg-[#b77a12]" />
            ISC Authentication
          </div>

          {/* TITLE */}
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#172033]">
            Sign in
          </h2>

          <p className="text-xs text-[#667085] mt-1 mb-4">
            Select your role and sign in with your registered account.
          </p>

          {/* ROLE SELECTOR */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-xl bg-[#f5f3ee] border border-[#e3dfd6] mb-3">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                title={role.name}
                className={`min-h-[58px] px-1.5 py-2 rounded-xl flex flex-col items-center justify-center gap-1 text-center transition-all duration-200 ${
                  selectedRole === role.id
                    ? "bg-[#0f1f35] text-white shadow-sm"
                    : "text-[#667085] hover:bg-white hover:text-[#172033]"
                }`}
              >
                <i className={`${ROLE_ICONS[role.id]} text-xs leading-none flex items-center justify-center`} />
                <span className="text-[9px] font-semibold leading-tight">
                  {role.name}
                </span>
              </button>
            ))}
          </div>

          {/* SELECTED ROLE */}
          <div className="rounded-xl border border-[#e3dfd6] bg-[#faf9f6] px-3 py-2.5 mb-10">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#0f1f35]/5 flex items-center justify-center shrink-0">
                <i className={`${ROLE_ICONS[selectedRole]} text-[#0f1f35] text-xs leading-none flex items-center justify-center`} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-bold text-[#172033]">
                  {currentRole.name}
                </p>
                <p className="text-[10px] text-[#667085] mt-0.5 leading-4">
                  {currentRole.desc}
                </p>
              </div>
            </div>
          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleLogin} className="space-y-3.5">
            {/* USERNAME */}
            <div>
              <label
                htmlFor="username"
                className="block text-[11px] font-semibold text-[#344054] mb-1.5"
              >
                Username
              </label>

              <input
                id="username"
                type="text"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                className="w-full h-9 px-3 rounded-xl border border-[#d9d5cc] bg-white text-xs text-[#172033] placeholder:text-[#9aa1ad] outline-none transition-all focus:border-[#0f1f35] focus:ring-2 focus:ring-[#0f1f35]/5"
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-semibold text-[#344054] mb-1.5"
              >
                Password
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full h-9 px-3 pr-9 rounded-xl border border-[#d9d5cc] bg-white text-xs text-[#172033] placeholder:text-[#9aa1ad] outline-none transition-all focus:border-[#0f1f35] focus:ring-2 focus:ring-[#0f1f35]/5"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center text-[#8a8f98] hover:text-[#172033] transition-colors"
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </div>

            {/* OPTIONS */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px]">
              <label className="flex items-center gap-1.5 text-[#667085] cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe((v) => !v)}
                  className="w-3 h-3 rounded-xl accent-[#0f1f35]"
                />
                Save login information
              </label>

              <Link
                to="/forgot-password"
                className="font-semibold text-[#b77a12] hover:text-[#8f620c] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* ERROR */}
            {error && (
              <div className="flex items-start gap-1.5 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-red-600 text-[11px] leading-4">
                <i className="fi fi-ss-exclamation text-xs mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="w-full h-9 rounded-xl bg-[#0f1f35] text-white text-xs font-semibold shadow-[0_3px_10px_rgba(15,31,53,0.15)] hover:bg-[#b77a12] hover:shadow-[0_4px_12px_rgba(183,122,18,0.20)] active:scale-[0.99] transition-all duration-200"
            >
              Login
            </button>
          </form>

          {/* REGISTER / INFORMATION */}
          {!NO_SELF_REGISTER_ROLES.includes(selectedRole) ? (
            <p className="text-center mt-5 text-xs text-[#667085]">
              Don't have an account?{" "}
              <Link
                to={
                  selectedRole === "unit_maker"
                    ? "/unit-maker-register"
                    : "/register"
                }
                className="font-semibold text-[#b77a12] hover:text-[#8f620c] transition-colors"
              >
                {selectedRole === "unit_maker"
                  ? "Register as Unit Maker"
                  : "Register as Unit Approver"}
              </Link>
            </p>
          ) : (
            <div className="mt-5 px-3 py-2.5 rounded-xl bg-[#f7f6f2] border border-[#e3dfd6] text-center">
              <p className="text-[11px] leading-4 text-[#667085]">
                Check your Go letter or visit your Zone HQ to get login
                details.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}