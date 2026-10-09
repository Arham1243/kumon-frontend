/** Demo helper — replace with real formatting in copied modules. */
export function formatExampleLabel(title) {
    const value = String(title ?? '').trim();
    return value || 'Example';
}
