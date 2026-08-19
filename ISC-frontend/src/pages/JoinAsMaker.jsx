import { useState } from "react";
import { Link } from "react-router-dom";
import { registerMaker } from "../services/makerService";

const EyeIcon = ({ open }) => (
  <i className={`fi ${open ? "fi-ss-eye-crossed" : "fi-ss-eye"} text-xs`} />
);

export default function JoinAsMaker() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    companyCode: "",
    fullName: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptedTerms: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setSuccess("");
      setError("");

      const response = await registerMaker({
        company_code: form.companyCode,
        full_name: form.fullName,
        username: form.username,
        email: form.email,
        password: form.password,
        confirm_password: form.confirmPassword,
      });

      setSuccess(response.data.message);

      setForm({
        companyCode: "",
        fullName: "",
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        acceptedTerms: false,
      });
    } catch (err) {
      if (err.response?.data) {
        const firstError = Object.values(err.response.data)[0];

        setError(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        setError("Registration Failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordsMismatch =
    form.confirmPassword.length > 0 && form.password !== form.confirmPassword;

  const canSubmit =
    form.password.length > 0 &&
    form.password === form.confirmPassword &&
    form.acceptedTerms;

  return (
    <div className="isc-login-root h-screen w-full flex flex-col lg:flex-row overflow-hidden">
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

      <div className="w-full lg:w-1/2 h-full shrink-0 bg-[#f5f2eb] flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-xl px-5 py-6 sm:px-7 sm:py-8 flex flex-col flex-1">
          <Link
            to="/"
            className="inline-flex flex-row items-center whitespace-nowrap gap-1.5 px-2.5 py-1 rounded-full bg-[#eef2f7] border border-[#d5dce6] text-[9px] font-bold uppercase tracking-[0.13em] text-[#344054] hover:bg-[#e4eaf2] hover:text-[#0f1f35] transition-colors w-fit mb-6"
          >
            <span className="text-sm leading-none">←</span>
            <span className="whitespace-nowrap">Back to Home</span>
          </Link>

          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg bg-[#0f1f35] text-white flex items-center justify-center shadow-sm shrink-0">
              <i className="fi fi-ss-file-signature text-sm leading-none flex items-center justify-center" />
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

          <div className="max-w-xl">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold text-[#b77a12] mb-2">
              Unit Maker Onboarding
            </p>

            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#172033] leading-[1.15]">
              Join as a Unit Maker
            </h1>

            <p className="mt-3 text-xs leading-5 text-[#667085]">
              Enter your company's registration code to request a Unit Maker
              account. Your company's Unit Approver will need to approve your
              request before you can prepare shipping bills.
            </p>
          </div>

          <div className="mt-30 pb-5">
            <div className="border-t border-[#ddd9d0] pt-3">
              <p className="text-[11px] text-[#7b8190] mb-2">
                Setting up a new company?
              </p>

              <div className="flex flex-col gap-y-1.5">
                <Link
                  to="/register"
                  className="text-xs font-semibold text-[#b77a12] hover:text-[#8f620c] transition-colors"
                >
                  Register your company →
                </Link>

                <Link
                  to="/login"
                  className="text-xs font-semibold text-[#667085] hover:text-[#0f1f35] transition-colors"
                >
                  Already have an account? Sign in →
                </Link>

                <div className="ledger-rule pt-5 space-y-2 text-sm">
                    <p className= "text-[11px] text-[#7b8190]">Need to Check you Account Status ?</p>
                  <Link to="/check-status" className="text-xs font-semibold text-amber-600 hover:text-amber-700">
                    Check Status →
                  </Link>
                </div>
                <p className="text-[11px] text-[#7b8190] mt-5">
                  Don't know your company's registration code? Ask your Unit
              Approver, or check your company's confirmation email from
              registration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          RIGHT SIDE - REQUEST ACCESS
      ===================================================== */}

      <div className="w-full lg:w-1/2 h-full bg-white flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-lg px-5 py-6 sm:px-7 sm:py-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f7f6f2] border border-[#e3dfd6] text-[9px] font-bold uppercase tracking-[0.13em] text-[#667085] mb-4">
            <span className="w-1 h-1 rounded-full bg-[#b77a12]" />
            ISC Authentication
          </div>

          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#172033]">
            Request access
          </h2>

          <p className="text-xs text-[#667085] mt-1 mb-4">
            Look up your company, then create your Unit Maker account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label
                htmlFor="companyCode"
                className="block text-[11px] font-semibold text-[#344054] mb-1.5"
              >
                Company Registration Code
              </label>
              <input
                id="companyCode"
                type="text"
                placeholder="e.g. SEZ-MEPZ-00231"
                value={form.companyCode}
                onChange={update("companyCode")}
                className="w-full h-9 px-3 rounded-xl border border-[#d9d5cc] bg-white text-xs text-[#172033] placeholder:text-[#9aa1ad] outline-none transition-all focus:border-[#0f1f35] focus:ring-2 focus:ring-[#0f1f35]/5"
              />
            </div>

            <div className="rounded-xl border border-[#e3dfd6] bg-[#faf9f6] px-3 py-3 mt-2">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] font-bold text-[#8a8f98] mb-3">
                Your Details
              </p>

              <div className="space-y-3.5">
                <div>
                  <label
                    htmlFor="fullName"
                    className="block text-[11px] font-semibold text-[#344054] mb-1.5"
                  >
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={form.fullName}
                    onChange={update("fullName")}
                    className="w-full h-9 px-3 rounded-xl border border-[#d9d5cc] bg-white text-xs text-[#172033] placeholder:text-[#9aa1ad] outline-none transition-all focus:border-[#0f1f35] focus:ring-2 focus:ring-[#0f1f35]/5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                      placeholder="Choose a username"
                      value={form.username}
                      onChange={update("username")}
                      className="w-full h-9 px-3 rounded-xl border border-[#d9d5cc] bg-white text-xs text-[#172033] placeholder:text-[#9aa1ad] outline-none transition-all focus:border-[#0f1f35] focus:ring-2 focus:ring-[#0f1f35]/5"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="block text-[11px] font-semibold text-[#344054] mb-1.5"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={form.email}
                      onChange={update("email")}
                      className="w-full h-9 px-3 rounded-xl border border-[#d9d5cc] bg-white text-xs text-[#172033] placeholder:text-[#9aa1ad] outline-none transition-all focus:border-[#0f1f35] focus:ring-2 focus:ring-[#0f1f35]/5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                        placeholder="Create a password"
                        value={form.password}
                        onChange={update("password")}
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

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-[11px] font-semibold text-[#344054] mb-1.5"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Re-enter password"
                        value={form.confirmPassword}
                        onChange={update("confirmPassword")}
                        className={`w-full h-9 px-3 pr-9 rounded-xl border bg-white text-xs text-[#172033] placeholder:text-[#9aa1ad] outline-none transition-all focus:ring-2 ${
                          passwordsMismatch
                            ? "border-red-400 focus:border-red-500 focus:ring-red-500/10"
                            : "border-[#d9d5cc] focus:border-[#0f1f35] focus:ring-[#0f1f35]/5"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                        className="absolute right-0 top-0 h-9 w-9 flex items-center justify-center text-[#8a8f98] hover:text-[#172033] transition-colors"
                      >
                        <EyeIcon open={showConfirmPassword} />
                      </button>
                    </div>
                  </div>
                </div>

                {passwordsMismatch && (
                  <p className="text-[11px] text-red-600 -mt-1.5">
                    Passwords do not match.
                  </p>
                )}
              </div>
            </div>

            <label className="flex items-start gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={form.acceptedTerms}
                onChange={(e) =>
                  setForm({ ...form, acceptedTerms: e.target.checked })
                }
                className="mt-0.5 w-3 h-3 rounded-xl accent-[#0f1f35]"
              />
              <span className="text-[11px] text-[#667085] leading-4">
                I hereby accept the{" "}
                <Link
                  to="/terms"
                  className="font-semibold text-[#b77a12] hover:text-[#8f620c] transition-colors"
                >
                  Terms &amp; Conditions
                </Link>{" "}
                and confirm that the details provided above are accurate.
              </span>
            </label>

            {success && (
              <div className="flex items-start gap-1.5 px-3 py-2 rounded-md bg-green-50 border border-green-200 text-green-700 text-[11px] leading-4">
                <i className="fi fi-ss-check text-xs mt-0.5" />
                <p>{success}</p>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-1.5 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-red-600 text-[11px] leading-4">
                <i className="fi fi-ss-exclamation text-xs mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!canSubmit || loading}
              className="w-full h-9 rounded-xl bg-[#0f1f35] text-white text-xs font-semibold shadow-[0_3px_10px_rgba(15,31,53,0.15)] hover:bg-[#b77a12] hover:shadow-[0_4px_12px_rgba(183,122,18,0.20)] active:scale-[0.99] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#0f1f35] disabled:active:scale-100"
            >
              {loading ? "Sending Request..." : "Send Request to Unit Approver"}
            </button>
          </form>

          <p className="text-center mt-5 text-xs text-[#667085]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#b77a12] hover:text-[#8f620c] transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}