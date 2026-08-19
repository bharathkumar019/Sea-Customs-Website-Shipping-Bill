import { useState } from "react";
import { Link } from "react-router-dom";
import { checkStatus } from "../services/statusService";

const STATUS_COLOR = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-400",
  APPROVED: "bg-green-100 text-green-700 border-green-400",
  REJECTED: "bg-red-100 text-red-700 border-red-400",
};

export default function CheckStatus() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheck = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const response = await checkStatus({
        username,
      });

      setResult(response.data);
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Unable to fetch registration status.");
      }
    } finally {
      setLoading(false);
    }
  };

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
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="M21 21l-4.65-4.65" />
              </svg>
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

          <div className="max-w-md">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] font-bold text-[#b77a12] mb-2">
              Online System
            </p>

            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#172033] leading-[1.15]">
              Shipping Bill Portal
            </h1>

            <p className="mt-3 text-xs leading-5 text-[#667085]">
              Check the current status of your registration request at any
              time using your account username.
            </p>
          </div>

          <div className="mt-20 pb-5">
            <div className="border-t border-[#ddd9d0] pt-3">
              <p className="text-[11px] text-[#7b8190] mb-2">
                Already registered?
              </p>

              <div className="flex flex-col gap-y-1.5">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-[#b77a12] hover:text-[#8f620c] transition-colors"
                >
                  Sign in to your account →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          RIGHT SIDE - CHECK STATUS
      ===================================================== */}

      <div className="w-full lg:w-1/2 h-full bg-white flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-lg px-5 py-6 sm:px-7 sm:py-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f7f6f2] border border-[#e3dfd6] text-[9px] font-bold uppercase tracking-[0.13em] text-[#667085] mb-4">
            <span className="w-1 h-1 rounded-full bg-[#b77a12]" />
            ISC Authentication
          </div>

          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-[#172033]">
            Check status
          </h2>

          <p className="text-xs text-[#667085] mt-1 mb-4">
            Enter your username to check your registration status.
          </p>

          <form onSubmit={handleCheck} className="space-y-3.5">
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
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full h-9 px-3 rounded-xl border border-[#d9d5cc] bg-white text-xs text-[#172033] placeholder:text-[#9aa1ad] outline-none transition-all focus:border-[#0f1f35] focus:ring-2 focus:ring-[#0f1f35]/5"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-9 rounded-xl bg-[#0f1f35] text-white text-xs font-semibold shadow-[0_3px_10px_rgba(15,31,53,0.15)] hover:bg-[#b77a12] hover:shadow-[0_4px_12px_rgba(183,122,18,0.20)] active:scale-[0.99] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#0f1f35] disabled:active:scale-100"
            >
              {loading ? "Checking..." : "Check Status"}
            </button>
          </form>

          {error && (
            <div className="flex items-start gap-1.5 px-3 py-2 mt-3.5 rounded-md bg-red-50 border border-red-200 text-red-600 text-[11px] leading-4">
              <i className="fi fi-ss-exclamation text-xs mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-5 relative rounded-xl border border-[#e3dfd6] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.08)] overflow-hidden">
              {/* Header strip */}
              <div className="bg-[#0f1f35] px-4 py-3.5 flex items-center justify-between">
                <div>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[#b77a12]">
                    Registration Record
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/50 mt-0.5">
                    Ref. {result.username}
                  </p>
                </div>

                <div className="h-8 w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <span className="font-display text-xs text-white">
                    {result.full_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
              </div>

              {/* Status stamp */}
              <span
                className={`absolute top-14 right-4 -rotate-6 px-2.5 py-1 rounded border-2 text-[10px] font-mono font-bold uppercase tracking-[0.13em] ${
                  STATUS_COLOR[result.status] ||
                  "bg-gray-100 border-gray-400 text-gray-700"
                }`}
              >
                {result.status}
              </span>

              {/* Body rows */}
              <div className="px-4 py-4">
                <h3 className="font-display text-lg text-[#172033] mb-3 pr-16">
                  {result.full_name}
                </h3>

                <dl className="divide-y divide-dashed divide-[#e3dfd6]">
                  <div className="flex items-center justify-between py-2">
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-[#667085]">
                      Username
                    </dt>
                    <dd className="text-xs text-[#172033] font-semibold">
                      {result.username}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-[#667085]">
                      Role
                    </dt>
                    <dd className="text-xs text-[#172033] font-semibold">
                      {result.role.replaceAll("_", " ")}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-[#667085]">
                      Account
                    </dt>
                    <dd className="flex items-center gap-1.5 text-xs font-semibold">
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          result.is_active ? "bg-green-500" : "bg-red-500"
                        }`}
                      />
                      <span
                        className={
                          result.is_active ? "text-green-600" : "text-red-600"
                        }
                      >
                        {result.is_active ? "Active" : "Inactive"}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          <p className="text-center mt-5 text-xs text-[#667085]">
            <Link
              to="/login"
              className="font-semibold text-[#b77a12] hover:text-[#8f620c] transition-colors"
            >
              ← Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}