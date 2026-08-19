import { Link } from 'react-router-dom';

const ROLES = [
  {
    icon: "fi fi-ss-document",
    title: "Unit Maker / CHA",
    desc: "Prepares shipping bills — General, Shipment, Invoice, and Item details — and submits for approval.",
  },
  {
    icon: "fi fi-ss-user-check",
    title: "Unit Approver",
    desc: "Verifies bills, submits to customs, pays export duty, and manages Unit Maker accounts.",
  },
  {
    icon: "fi fi-ss-shield-check",
    title: "DC Customs",
    desc: "Verifies new company registrations and assesses shipping bills before granting export permission.",
  },
  {
    icon: "fi fi-ss-ship",
    title: "Harbor Customs",
    desc: "Final port-of-exit clearance after EGM filing — holds, queries, or clears the shipment.",
  },
];

const FEATURES = [
  {
    icon: "fi fi-ss-search",
    title: "Search Request",
    desc: "Find any shipping bill instantly by Request ID, Shipping Bill No., or consignee.",
  },
  {
    icon: "fi fi-ss-book-open-cover",
    title: "HSN Code Directory",
    desc: "414 real RITC/HSN codes with duty rates and restricted-item flags, searchable in seconds.",
  },
  {
    icon: "fi fi-ss-money-check-edit",
    title: "Duty Payment",
    desc: "Auto-computed export duty per item, paid and receipted without leaving the request.",
  },
  {
    icon: "fi fi-ss-print",
    title: "Printable Documents",
    desc: "Shipping Bill and Duty Receipt, formatted for real submission — original, duplicate, triplicate.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <header className="border-b border-paper-line">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full border-2 border-navy-900 flex items-center justify-center">
              <span className="font-display text-[10px] text-navy-900">ISC</span>
            </div>
            <span className="font-display text-base text-ink">India's Sea Export Customs</span>
          </div>
          <div className="flex items-center gap-5">
            <Link to="/check-status" className="text-sm text-ink-soft hover:text-amber-600 hidden sm:inline">
              Check Status
            </Link>
            <Link to="/login" className="text-sm font-medium text-ink hover:text-amber-600">
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-navy-900 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-amber-600 transition-colors"
            >
              Register Company
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src="/images/harbor-aerial.jpg"
          alt="Aerial view of a container port with cranes and cargo ships"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 photo-scrim-left"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32">
          <div className="max-w-xl">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber-600 mb-4">
              Special Economic Zone · Online System
            </p>
            <h1 className="font-display text-4xl md:text-5xl text-ink leading-tight mb-5">
              One portal, from company registration to shipment cleared.
            </h1>
            <p className="text-ink-soft leading-relaxed mb-8">
              Registration, verification, shipping bill preparation, customs assessment,
              duty payment, and port clearance — all in a single connected workflow across
              four roles who never see each other's queues by accident.
            </p>
            <div className="flex flex-wrap gap-4 mb-12">
              <Link
                to="/register"
                className="bg-amber-600 text-white text-sm font-medium px-5 py-3 rounded-md hover:bg-amber-500 transition-colors"
              >
                Register your Company →
              </Link>
              <Link
                to="/login"
                className="border border-navy-900/20 bg-white/70 backdrop-blur-sm text-navy-900 text-sm font-medium px-5 py-3 rounded-md hover:bg-white transition-colors"
              >
                Sign In
              </Link>
            </div>

            <div className="flex flex-wrap gap-8 border-t border-navy-900/15 pt-6">
              <div>
                <p className="font-display text-2xl text-navy-900">4</p>
                <p className="text-xs text-ink-soft font-mono uppercase tracking-wide">Connected roles</p>
              </div>
              <div>
                <p className="font-display text-2xl text-navy-900">414</p>
                <p className="text-xs text-ink-soft font-mono uppercase tracking-wide">HSN codes indexed</p>
              </div>
              <div>
                <p className="font-display text-2xl text-navy-900">3</p>
                <p className="text-xs text-ink-soft font-mono uppercase tracking-wide">SEZ / MEPS zones live</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-widest text-amber-600 mb-2 text-center">
          How It Works
        </p>
        <h2 className="font-display text-2xl text-ink text-center mb-14">
          Three stages, four roles, one shipment
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          <StageCard
            step="01"
            icon={<i className="fi fi-ss-shield-check text-amber-600 text-2xl"></i>}
            title="Onboarding"
            desc="A company registers, gets auto-mapped to its DC Customs office by zone, and its Unit Approver is activated once verified."
          />

          <StageCard
            step="02"
            icon={<i className="fi fi-ss-operating-system-upgrade text-amber-600 text-2xl"></i>}
            title="Export Processing"
            desc="Unit Maker prepares the bill, Unit Approver submits it, DC Customs assesses it and grants export permission."
          />

          <StageCard
            step="03"
            icon={<i className="fi fi-ss-ship text-amber-600 text-2xl"></i>}
            title="Port Clearance"
            desc="EGM is filed, the shipment forwards to Harbor Customs, and clears for departure — or is held for query."
          />
        </div>
      </section>

      {/* Roles */}
      <section className="paper-surface border-y border-paper-line">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <p className="font-mono text-[11px] uppercase tracking-widest text-amber-600 mb-2 text-center">
            Roles
          </p>

          <h2 className="font-display text-2xl text-ink text-center mb-14">
            Every role sees only what's theirs
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {ROLES.map((r) => (
              <div
                key={r.title}
                className="bg-white border border-paper-line rounded-lg p-5"
              >
                <i className={`${r.icon} text-amber-600 text-xl mb-3 block`}></i>

                <p className="font-display text-base text-ink mb-1.5">
                  {r.title}
                </p>

                <p className="text-sm text-ink-soft leading-relaxed">
                  {r.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Full-bleed banner */}
      <section className="relative">
        <img
          src="/images/container-ship-ocean.jpg"
          alt="Container ship carrying cargo across open ocean"
          className="w-full h-85 md:h-105 object-cover"
        />
        <div className="absolute inset-0 photo-scrim-left" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-6xl mx-auto px-6 w-full">
            <div className="max-w-md">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber-600 mb-3">
                From Zone to Vessel
              </p>
              <h2 className="font-display text-2xl md:text-3xl text-ink leading-snug mb-4">
                Every shipping bill traced from the SEZ unit to the ship that carries it.
              </h2>
              <p className="text-ink-soft text-sm leading-relaxed">
                No handoff is invisible — every query, approval, and duty payment stays on
                the record, right up to Harbor Customs clearing it for departure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features — manifest / line-item style */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="font-mono text-[11px] uppercase tracking-widest text-amber-600 mb-2 text-center">
          Built In
        </p>

        <h2 className="font-display text-2xl text-ink text-center mb-3">
          Everything a request needs, in one place
        </h2>
        <p className="text-sm text-ink-soft text-center mb-12">
          Read top to bottom like a manifest — each line is a capability already on the form.
        </p>

        <div className="max-w-3xl mx-auto border-t border-paper-line">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group flex items-start gap-5 py-6 border-b border-paper-line"
            >
              <span className="font-mono text-xs text-amber-600 pt-3 w-6 shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>

              <div className="h-10 w-10 shrink-0 rounded-md border border-navy-900/15 bg-navy-100 flex items-center justify-center group-hover:border-amber-600/50 transition-colors">
                <i className={`${f.icon} text-navy-900 text-base`}></i>
              </div>

              <div className="min-w-0">
                <p className="font-display text-base text-ink mb-1">
                  {f.title}
                </p>
                <p className="text-sm text-ink-soft leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <img
          src="/images/ship.jpg"
          alt="Cargo ship at sea"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 photo-scrim-center" />
        <div className="relative max-w-6xl mx-auto px-6 py-24 text-center">
          <h2 className="font-display text-2xl md:text-3xl text-ink mb-4">
            Ready to move your first shipment through?
          </h2>
          <p className="text-ink-soft text-sm mb-8 max-w-md mx-auto">
            Register your company to get started, or sign in if your account is already active.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/register"
              className="bg-amber-600 text-white text-sm font-medium px-5 py-3 rounded-md hover:bg-amber-500 transition-colors"
            >
              Register your Company →
            </Link>
            <Link
              to="/login"
              className="border border-navy-900/25 bg-white/70 backdrop-blur-sm text-navy-900 text-sm font-medium px-5 py-3 rounded-md hover:bg-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-paper-line">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-soft">
          <p>SEZ Online — Shipping Bill Portal.</p>
          <div className="flex gap-5">
            <Link to="/check-status" className="hover:text-amber-600">Check Status</Link>
            <Link to="/unit-maker-register" className="hover:text-amber-600">Join as Unit Maker</Link>
            <Link to="/hsn-codes" className="hover:text-amber-600">HSN Codes</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StageCard({ step, icon, title, desc }) {
  return (
    <div className="relative bg-white border border-paper-line rounded-lg p-6 pt-8">
      <span className="absolute -top-3 left-6 bg-white px-2 font-mono text-xs text-amber-600">
        {step}
      </span>

      {icon}

      <h3 className="font-display text-lg text-ink mt-4 mb-2">
        {title}
      </h3>

      <p className="text-sm text-ink-soft leading-relaxed">
        {desc}
      </p>
    </div>
  );
}