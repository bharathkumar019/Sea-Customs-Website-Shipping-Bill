import { useEffect, useState } from "react";
import { listHSN } from "../services/hsnService";

const EMPTY_FILTERS = {
    product_category: "",
    unit: "",
    risk_category: "",
    exportable: "",
};

function flag(value) {
    return value ? "Yes" : "No";
}

function shortDescription(value, maxLength = 30) {
    if (!value) return "—";
    const text = String(value).trim();
    return text.length > maxLength
        ? `${text.slice(0, maxLength).trimEnd()}...`
        : text;
}

function riskTheme(risk) {
    const value = String(risk || "").toUpperCase();

    if (value === "HIGH") {
        return {
            panel: "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-red-50",
            header: "border-rose-200 bg-gradient-to-r from-rose-100 to-red-50",
            accent: "text-rose-900",
            badge: "bg-rose-100 text-rose-700 border-rose-200",
        };
    }

    if (value === "MEDIUM") {
        return {
            panel: "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50",
            header: "border-amber-200 bg-gradient-to-r from-amber-100 to-yellow-50",
            accent: "text-amber-900",
            badge: "bg-amber-100 text-amber-700 border-amber-200",
        };
    }

    return {
        panel: "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-green-50",
        header: "border-emerald-200 bg-gradient-to-r from-emerald-100 to-green-50",
        accent: "text-emerald-900",
        badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
}

function yesNoClass(value) {
    return value
        ? "bg-rose-100 text-rose-700 border-rose-200"
        : "bg-emerald-100 text-emerald-700 border-emerald-200";
}

export default function HSNMaster() {
    const [items, setItems] = useState([]);

    const [filterOptions, setFilterOptions] = useState({
        product_categories: [],
        units: [],
        risk_categories: [],
    });

    const [selected, setSelected] = useState(null);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const visibleCount = items.length;

    const updateFilter = (key, value) => {
        setFilters((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const clearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setSearch("");
    };

    useEffect(() => {
        let active = true;

        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                setError("");

                const response = await listHSN({
                    q: search.trim(),
                    ...filters,
                });

                if (!active) return;

                const results = response.data?.results || [];

                setItems(results);

                setFilterOptions(
                    response.data?.filter_options || {
                        product_categories: [],
                        units: [],
                        risk_categories: [],
                    }
                );

                setSelected((currentSelected) => {
                    if (!results.length) return null;

                    const matchingSelected = currentSelected
                        ? results.find(
                              (item) =>
                                  item.hsn_code === currentSelected.hsn_code
                          )
                        : null;

                    return matchingSelected || results[0];
                });
            } catch (err) {
                if (!active) return;

                setError(
                    err.response?.data?.error ||
                        "Unable to load HSN master list."
                );

                setItems([]);
                setSelected(null);
            } finally {
                if (active) setLoading(false);
            }
        }, 250);

        return () => {
            active = false;
            clearTimeout(timer);
        };
    }, [search, filters]);

    return (
        <div className="w-full min-w-0">
            {/* HSN MASTER HEADER - NO BACKGROUND TAB */}
            <div className="mb-4 flex items-center justify-between gap-3 px-1 py-1">
                <div>
                    <h1 className="text-xl font-bold text-indigo-900">
                        HSN Master
                    </h1>

                    <p className="mt-1 text-xs text-slate-500">
                        Search, filter and view HSN code details.
                    </p>
                </div>

                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                    {loading ? "Loading..." : `${visibleCount} HSN codes`}
                </span>
            </div>

            {/* COMPACT SEARCH + FILTER TOOLBAR */}
            <section className="mb-4 rounded-xl border border-indigo-100 bg-white p-2.5 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Search */}
                    <div className="relative min-w-[260px] flex-[2.8]">
                        <input
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search HSN code, description or product category..."
                            className="h-10 w-full rounded-lg border border-indigo-200 bg-indigo-50/30 px-3.5 pr-9 text-xs outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                        />

                        {search ? (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-base leading-none text-slate-400 hover:text-indigo-700"
                                aria-label="Clear search"
                            >
                                ×
                            </button>
                        ) : null}
                    </div>

                    {/* Category */}
                    <select
                        value={filters.product_category}
                        onChange={(e) =>
                            updateFilter(
                                "product_category",
                                e.target.value
                            )
                        }
                        className="h-10 min-w-[125px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 outline-none transition hover:border-indigo-200 focus:border-indigo-500 focus:bg-white"
                    >
                        <option value="">Category: All</option>

                        {filterOptions.product_categories.map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </select>

                    {/* Risk */}
                    <select
                        value={filters.risk_category}
                        onChange={(e) =>
                            updateFilter(
                                "risk_category",
                                e.target.value
                            )
                        }
                        className="h-10 min-w-[105px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 outline-none transition hover:border-indigo-200 focus:border-indigo-500 focus:bg-white"
                    >
                        <option value="">Risk: All</option>

                        {filterOptions.risk_categories.map((value) => (
                            <option key={value} value={value}>
                                {value}
                            </option>
                        ))}
                    </select>

                    {/* Exportable */}
                    <select
                        value={filters.exportable}
                        onChange={(e) =>
                            updateFilter(
                                "exportable",
                                e.target.value
                            )
                        }
                        className="h-10 min-w-[125px] flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-medium text-slate-700 outline-none transition hover:border-indigo-200 focus:border-indigo-500 focus:bg-white"
                    >
                        <option value="">Exportable: All</option>
                        <option value="true">Exportable: Yes</option>
                        <option value="false">Exportable: No</option>
                    </select>

                    {/* Clear */}
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="h-10 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                        title="Clear all filters"
                    >
                        Clear
                    </button>
                </div>
            </section>

            {/* HSN LIST + DETAILS */}
            {/* SAME HEIGHT FOR BOTH SECTIONS */}
            <div className="grid min-w-0 items-stretch grid-cols-1 gap-4 lg:grid-cols-2 lg:h-[calc(100vh-300px)]">

                {/* LEFT - LIST */}
                <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                    <div className="flex shrink-0 items-center justify-between border-b border-indigo-100 bg-indigo-50/70 px-4 py-3">
                        <div>
                            <h2 className="text-sm font-bold text-slate-800">
                                HSN Code List
                            </h2>

                            <p className="mt-0.5 text-[11px] text-slate-400">
                                Click any row to view details
                            </p>
                        </div>

                        <span className="text-xs font-semibold text-slate-500">
                            {loading ? "Loading..." : visibleCount}
                        </span>
                    </div>

                    {error ? (
                        <div className="m-3 shrink-0 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                            {error}
                        </div>
                    ) : null}

                    {/* LIST SCROLLS INSIDE SAME HEIGHT */}
                    <div className="min-h-0 flex-1 overflow-auto">
                        <table className="min-w-full text-left text-xs">
                            <thead className="sticky top-0 z-10 bg-white shadow-sm">
                                <tr className="border-b border-slate-200 text-slate-500">
                                    <th className="px-3 py-2.5 font-bold">
                                        HSN Code
                                    </th>

                                    <th className="px-3 py-2.5 font-bold">
                                        Description
                                    </th>

                                    <th className="px-3 py-2.5 font-bold">
                                        Risk
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {items.map((item) => (
                                    <tr
                                        key={item.hsn_code}
                                        onClick={() => setSelected(item)}
                                        className={`cursor-pointer border-b border-slate-100 transition hover:bg-indigo-50/60 ${
                                            selected?.hsn_code ===
                                            item.hsn_code
                                                ? "bg-indigo-50"
                                                : ""
                                        }`}
                                    >
                                        {/* REDUCED WHITE SPACE */}
                                        <td className="whitespace-nowrap px-4 py-2 font-bold text-indigo-700">
                                            {item.hsn_code}
                                        </td>

                                        <td className="max-w-[300px] px-4 py-2 text-slate-700">
                                            <span className="block truncate">
                                                {shortDescription(
                                                    item.description,
                                                    30
                                                )}
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-2">
                                            <span
                                                className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                                                    String(
                                                        item.risk_category || ""
                                                    ).toUpperCase() === "HIGH"
                                                        ? "bg-rose-100 text-rose-700"
                                                        : String(
                                                              item.risk_category ||
                                                                  ""
                                                          ).toUpperCase() ===
                                                          "MEDIUM"
                                                        ? "bg-amber-100 text-amber-700"
                                                        : "bg-emerald-100 text-emerald-700"
                                                }`}
                                            >
                                                {item.risk_category || "—"}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {!loading && !items.length && !error ? (
                            <div className="p-10 text-center text-sm text-slate-500">
                                No HSN codes match your search or filters.
                            </div>
                        ) : null}
                    </div>
                </section>

                {/* RIGHT - DETAILS */}
                <aside
                    className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border shadow-sm ${
                        riskTheme(selected?.risk_category).panel
                    }`}
                >
                    <div
                        className={`shrink-0 border-b px-4 py-3 ${
                            riskTheme(selected?.risk_category).header
                        }`}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <h2
                                className={`text-sm font-bold ${
                                    riskTheme(selected?.risk_category).accent
                                }`}
                            >
                                HSN Details
                            </h2>

                            {selected?.risk_category ? (
                                <span
                                    className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                                        riskTheme(selected.risk_category).badge
                                    }`}
                                >
                                    {selected.risk_category}
                                </span>
                            ) : null}
                        </div>
                    </div>

                    {/* DETAIL CONTENT SCROLLS IF REQUIRED */}
                    <div className="min-h-0 flex-1 overflow-auto">
                        {!selected ? (
                            <div className="flex min-h-full items-center justify-center px-6 text-center text-sm text-slate-400">
                                Select an HSN code from the list to view
                                details.
                            </div>
                        ) : (
                            <div className="p-5">
                                <div className="mb-4 border-b border-slate-200 pb-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                                                HSN Code
                                            </p>

                                            <h3 className="mt-1 font-mono text-2xl font-bold text-indigo-900">
                                                {selected.hsn_code}
                                            </h3>
                                        </div>

                                        <span
                                            className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                                                riskTheme(
                                                    selected.risk_category
                                                ).badge
                                            }`}
                                        >
                                            {selected.risk_category ||
                                                "No Risk"}
                                        </span>
                                    </div>

                                    <p
                                        className="mt-2 max-w-full truncate text-sm leading-5 text-slate-700"
                                        title={selected.description || ""}
                                    >
                                        {shortDescription(
                                            selected.description,
                                            90
                                        ) || "No description available."}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        [
                                            "Category",
                                            selected.product_category,
                                        ],
                                        ["Unit", selected.unit],
                                        [
                                            "Exportable",
                                            flag(selected.exportable),
                                        ],
                                        [
                                            "Restricted",
                                            flag(selected.restricted),
                                        ],
                                        [
                                            "Prohibited",
                                            flag(selected.prohibited),
                                        ],
                                        [
                                            "Hazardous",
                                            flag(selected.hazardous),
                                        ],
                                    ].map(([label, value]) => (
                                        <div
                                            key={label}
                                            className="rounded-lg border border-indigo-100 bg-gradient-to-br from-slate-50 to-indigo-50/50 px-3 py-2.5"
                                        >
                                            <p className="text-[10px] uppercase tracking-wide text-slate-400">
                                                {label}
                                            </p>

                                            <p
                                                className={`mt-1 inline-flex w-fit rounded-md border px-2 py-1 text-xs font-bold ${
                                                    [
                                                        "Exportable",
                                                        "Restricted",
                                                        "Prohibited",
                                                        "Hazardous",
                                                    ].includes(label)
                                                        ? yesNoClass(
                                                              value === "Yes"
                                                          )
                                                        : "border-transparent bg-white/70 text-slate-800"
                                                }`}
                                            >
                                                {value || "—"}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 rounded-lg border border-sky-100 bg-sky-50/40 p-3">
                                    <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                                        Duty / Tax
                                    </h3>

                                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                        {[
                                            [
                                                "Export Duty",
                                                selected.export_duty_rate,
                                            ],
                                            ["GST", selected.gst_rate],
                                            ["IGST", selected.igst_rate],
                                            [
                                                "Other Duty",
                                                selected.other_duty_rate,
                                            ],
                                            [
                                                "Total Tax / Duty",
                                                selected.total_tax_duty,
                                            ],
                                        ].map(([label, value]) => (
                                            <div
                                                key={label}
                                                className="flex items-center justify-between gap-2 border-b border-slate-100 py-1.5 last:border-0"
                                            >
                                                <span className="text-slate-500">
                                                    {label}
                                                </span>

                                                <span className="font-semibold text-slate-800">
                                                    {value ?? "—"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}