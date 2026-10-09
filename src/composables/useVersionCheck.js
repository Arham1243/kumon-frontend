const POLLING_INTERVAL = 30000;

let currentVersion = null;
let intervalId = null;

function versionUrl() {
    const base = import.meta.env.BASE_URL || '/';
    const root = base.endsWith('/') ? base : `${base}/`;
    return `${root}version.json`;
}

async function fetchVersion() {
    try {
        const response = await fetch(`${versionUrl()}?t=${Date.now()}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache'
            }
        });
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}

async function checkVersion() {
    const versionData = await fetchVersion();
    if (!versionData) return;
    if (currentVersion === null) {
        currentVersion = versionData.timestamp;
        return;
    }
    if (versionData.timestamp !== currentVersion) {
        window.location.reload();
    }
}

/**
 * Polls version.json (generated at build) and reloads the app when a new deployment is detected.
 */
export function startVersionCheck() {
    if (import.meta.env.DEV || intervalId != null) {
        return;
    }

    checkVersion();
    intervalId = setInterval(checkVersion, POLLING_INTERVAL);
}
