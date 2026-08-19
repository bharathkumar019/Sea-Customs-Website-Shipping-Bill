import { useMemo } from "react";


const BACKEND_ORIGIN = "http://localhost:8000";
const DOCUMENT_FOLDER = "shipping_bill_documents";


/* ============================================================
   DOCUMENT URL
   ============================================================ */

const getDocumentUrl = (document) => {
    const rawUrl =
        document?.file_url ||
        document?.file;

    if (!rawUrl) {
        return "";
    }

    let value = String(rawUrl).trim();

    if (!value) {
        return "";
    }

    // --------------------------------------------------------
    // Absolute URL
    // --------------------------------------------------------

    if (/^https?:\/\//i.test(value)) {
        try {
            const parsed = new URL(value);
            let pathname = parsed.pathname;

            // Fix:
            // /shipping_bill_documents/
            // shipping_bill_documents/file.pdf
            // -> /shipping_bill_documents/file.pdf
            const duplicateFolder =
                "/shipping_bill_documents/" +
                "shipping_bill_documents/";

            const correctFolder =
                "/shipping_bill_documents/";

            while (pathname.includes(duplicateFolder)) {
                pathname = pathname.replace(
                    duplicateFolder,
                    correctFolder,
                );
            }

            // Convert old Vite URLs to Django.
            if (
                (parsed.hostname === "localhost" ||
                    parsed.hostname === "127.0.0.1") &&
                parsed.port === "5173"
            ) {
                return `${BACKEND_ORIGIN}${pathname}${parsed.search}`;
            }

            return `${parsed.origin}${pathname}${parsed.search}`;
        } catch {
            return value;
        }
    }

    // --------------------------------------------------------
    // Relative URL
    // --------------------------------------------------------

    value = value.replace(/^\/+/, "");

    const prefix = `${DOCUMENT_FOLDER}/`;

    // Remove repeated shipping_bill_documents/ prefixes.
    while (value.startsWith(prefix + prefix)) {
        value = value.substring(prefix.length);
    }

    // If only a filename/path is returned, add the media folder.
    if (!value.startsWith(prefix)) {
        value = `${prefix}${value}`;
    }

    return `${BACKEND_ORIGIN}/${value}`;
};


/* ============================================================
   FILE NAME
   ============================================================ */

const getFileName = (document) => {
    if (document?.file_name) {
        return document.file_name;
    }

    const rawUrl =
        document?.file_url ||
        document?.file ||
        "";

    const cleanUrl = String(rawUrl).split("?")[0];
    const name = cleanUrl.split("/").pop();

    return name || "Document";
};


/* ============================================================
   EXTENSION
   ============================================================ */

const getExtension = (fileName) => {
    const parts = fileName.split(".");

    if (parts.length <= 1) {
        return "";
    }

    return parts.pop().toLowerCase();
};


/* ============================================================
   FILE TYPES
   ============================================================ */

const isImage = (extension) =>
    [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "webp",
        "bmp",
        "svg",
        "avif",
    ].includes(extension);


const isPdf = (extension) =>
    extension === "pdf";


const isText = (extension) =>
    [
        "txt",
        "csv",
        "json",
        "xml",
    ].includes(extension);


/* ============================================================
   DOCUMENT VIEWER
   ============================================================ */

export default function DocumentViewer({
    document,
    onClose,
}) {
    const fileUrl = useMemo(
        () => getDocumentUrl(document),
        [document],
    );

    const fileName = useMemo(
        () => getFileName(document),
        [document],
    );

    const extension = useMemo(
        () => getExtension(fileName),
        [fileName],
    );

    const pdf = isPdf(extension);
    const image = isImage(extension);
    const text = isText(extension);

    console.log("Document:", document);
    console.log("Final document URL:", fileUrl);

    if (!document) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 sm:p-6">
            <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

                {/* HEADER */}
                <div className="flex shrink-0 items-center justify-between gap-4 border-b border-[#e3dfd6] bg-white px-5 py-3">
                    <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#172033]">
                            {fileName}
                        </p>

                        <p className="mt-0.5 text-[10px] text-[#8a8f98]">
                            Document Preview
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        {fileUrl && (
                            <a
                                href={fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg border border-[#d9d5cc] px-3 py-2 text-[11px] font-semibold text-[#172033] hover:bg-[#f5f2eb]"
                            >
                                Open in New Tab
                            </a>
                        )}

                        {fileUrl && (
                            <a
                                href={fileUrl}
                                download={fileName}
                                className="rounded-lg bg-[#0f1f35] px-3 py-2 text-[11px] font-semibold text-white hover:bg-[#1c304d]"
                            >
                                Download
                            </a>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-red-200 px-3 py-2 text-[11px] font-semibold text-red-600 hover:bg-red-50"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* VIEWER */}
                <div className="min-h-0 flex-1 overflow-hidden bg-[#f3f4f6]">
                    {!fileUrl && (
                        <div className="flex h-full items-center justify-center p-6">
                            <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-6 text-center">
                                <p className="text-sm font-bold text-red-700">
                                    Unable to preview document
                                </p>

                                <p className="mt-2 text-xs text-red-600">
                                    Document file URL is not available.
                                </p>
                            </div>
                        </div>
                    )}

                    {fileUrl && pdf && (
                        <iframe
                            src={fileUrl}
                            title={fileName}
                            className="h-full w-full border-0 bg-white"
                            allow="fullscreen"
                        />
                    )}

                    {fileUrl && image && (
                        <div className="flex h-full items-center justify-center overflow-auto bg-[#f3f4f6] p-6">
                            <img
                                src={fileUrl}
                                alt={fileName}
                                className="max-h-full max-w-full object-contain"
                            />
                        </div>
                    )}

                    {fileUrl && text && (
                        <iframe
                            src={fileUrl}
                            title={fileName}
                            className="h-full w-full border-0 bg-white"
                        />
                    )}

                    {fileUrl && !pdf && !image && !text && (
                        <div className="flex h-full items-center justify-center p-6">
                            <div className="max-w-md rounded-xl border border-[#e3dfd6] bg-white p-7 text-center shadow-sm">
                                <div className="text-4xl">
                                    📄
                                </div>

                                <p className="mt-3 text-sm font-bold text-[#172033]">
                                    Preview is not available for this file type
                                </p>

                                <p className="mt-2 break-words text-xs text-[#667085]">
                                    {fileName}
                                </p>

                                <p className="mt-2 text-[11px] text-[#8a8f98]">
                                    You can open or download the original file using the buttons above.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
