export const XLSX_MIME =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export const PDF_MIME = 'application/pdf';

/**
 * Trigger a browser download from binary response data.
 *
 * @param {BlobPart} data
 * @param {string} filename
 * @param {string} [mimeType]
 */
export function downloadBlob(data, filename, mimeType = XLSX_MIME) {
    const blob = new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
}

/**
 * @param {BlobPart} data
 * @param {{ filenameBase: string, format: 'excel' | 'pdf' | string }} options
 */
export function downloadTabularExport(data, { filenameBase, format }) {
    const isPdf = format === 'pdf';
    downloadBlob(
        data,
        `${filenameBase}.${isPdf ? 'pdf' : 'xlsx'}`,
        isPdf ? PDF_MIME : XLSX_MIME
    );
}
