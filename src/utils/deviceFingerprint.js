/**
 * Generate a unique device fingerprint based on browser characteristics
 * This creates a consistent identifier for the same device/browser combination
 */
export const generateDeviceFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    const canvasData = canvas.toDataURL();

    const components = [
        navigator.userAgent,
        navigator.language,
        screen.colorDepth,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        !!window.sessionStorage,
        !!window.localStorage,
        navigator.hardwareConcurrency || 'unknown',
        canvasData
    ];

    const fingerprint = components.join('|');
    return hashCode(fingerprint);
};

/**
 * Simple hash function to convert fingerprint string to a hash
 */
const hashCode = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
};

/**
 * Get device information for display purposes
 */
export const getDeviceInfo = () => {
    const userAgent = navigator.userAgent;
    let browser = 'Unknown';
    let platform = 'Unknown';

    // Detect browser
    if (userAgent.indexOf('Firefox') > -1) {
        browser = 'Firefox';
    } else if (userAgent.indexOf('Chrome') > -1) {
        browser = 'Chrome';
    } else if (userAgent.indexOf('Safari') > -1) {
        browser = 'Safari';
    } else if (userAgent.indexOf('Edge') > -1) {
        browser = 'Edge';
    } else if (
        userAgent.indexOf('MSIE') > -1 ||
        userAgent.indexOf('Trident') > -1
    ) {
        browser = 'Internet Explorer';
    }

    // Detect platform
    if (userAgent.indexOf('Win') > -1) {
        platform = 'Windows';
    } else if (userAgent.indexOf('Mac') > -1) {
        platform = 'MacOS';
    } else if (userAgent.indexOf('Linux') > -1) {
        platform = 'Linux';
    } else if (userAgent.indexOf('Android') > -1) {
        platform = 'Android';
    } else if (userAgent.indexOf('iOS') > -1) {
        platform = 'iOS';
    }

    return {
        browser,
        platform,
        device_name: `${browser} on ${platform}`
    };
};

/**
 * Store device fingerprint in localStorage
 */
export const storeDeviceFingerprint = (fingerprint) => {
    localStorage.setItem('device_fingerprint', fingerprint);
};

/**
 * Get stored device fingerprint from localStorage
 */
export const getStoredDeviceFingerprint = () => {
    return localStorage.getItem('device_fingerprint');
};

/**
 * Get or generate device fingerprint
 */
export const getDeviceFingerprint = () => {
    let fingerprint = getStoredDeviceFingerprint();

    if (!fingerprint) {
        fingerprint = generateDeviceFingerprint();
        storeDeviceFingerprint(fingerprint);
    }

    return fingerprint;
};
