import { onBeforeUnmount, ref, unref, watch } from 'vue';

const DEFAULT_WS_URL = 'ws://127.0.0.1:8765';
const INITIAL_RECONNECT_MS = 2000;
const MAX_RECONNECT_MS = 15000;

function normalizeUid(uid) {
    if (uid == null) {
        return '';
    }
    let s = String(uid).trim();
    if (s === '') {
        return '';
    }
    s = s.replace(/\s+/g, '').replace(/:/g, '').replace(/-/g, '');
    if (/^0x/i.test(s)) {
        s = s.slice(2);
    }
    return s.toUpperCase();
}

function resolveEnabled(enabled) {
    if (enabled === undefined || enabled === null) {
        return true;
    }
    return Boolean(unref(enabled));
}

export function useCardReader(options = {}) {
    const wsUrl = options.wsUrl ?? DEFAULT_WS_URL;
    const enabledOption = options.enabled;

    const status = ref('connecting');
    const readerStatus = ref('disconnected');

    const cardListeners = new Set();
    let ws = null;
    let reconnectTimer = null;
    let reconnectDelay = INITIAL_RECONNECT_MS;
    let desktopUnsubscribe = null;
    let intentionalClose = false;

    function emitCard(payload) {
        const uid = normalizeUid(payload?.uid);
        if (!uid) {
            return;
        }
        const ts = payload?.ts ?? Date.now();
        for (const listener of cardListeners) {
            try {
                listener({ uid, ts });
            } catch {
                // ignore listener errors
            }
        }
    }

    function handleMessage(raw) {
        let data;
        try {
            data = JSON.parse(raw);
        } catch {
            return;
        }

        if (data?.type === 'reader') {
            readerStatus.value =
                data.status === 'connected' ? 'connected' : 'disconnected';
            return;
        }

        if (data?.type === 'card') {
            emitCard(data);
        }
    }

    function scheduleReconnect() {
        if (!resolveEnabled(enabledOption) || intentionalClose || desktopUnsubscribe) {
            return;
        }
        status.value = 'disconnected';
        if (reconnectTimer) {
            return;
        }
        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            connectWebSocket();
            reconnectDelay = Math.min(reconnectDelay * 1.5, MAX_RECONNECT_MS);
        }, reconnectDelay);
    }

    function connectWebSocket() {
        if (!resolveEnabled(enabledOption) || intentionalClose) {
            return;
        }

        status.value = 'connecting';

        try {
            ws = new WebSocket(wsUrl);
        } catch {
            status.value = 'disconnected';
            scheduleReconnect();
            return;
        }

        ws.onopen = () => {
            status.value = 'connected';
            reconnectDelay = INITIAL_RECONNECT_MS;
        };

        ws.onmessage = (event) => {
            handleMessage(event.data);
        };

        ws.onerror = () => {
            status.value = 'disconnected';
        };

        ws.onclose = () => {
            ws = null;
            scheduleReconnect();
        };
    }

    function connectDesktopBridge() {
        const bridge = window.cardReader;
        if (!bridge || typeof bridge.onTap !== 'function') {
            return false;
        }

        status.value = 'connected';
        readerStatus.value = 'connected';

        desktopUnsubscribe = bridge.onTap((payload) => {
            emitCard(payload ?? {});
        });

        return true;
    }

    function connect() {
        if (!resolveEnabled(enabledOption)) {
            return;
        }
        intentionalClose = false;
        if (connectDesktopBridge()) {
            return;
        }
        connectWebSocket();
    }

    function disconnect() {
        intentionalClose = true;
        if (reconnectTimer) {
            clearTimeout(reconnectTimer);
            reconnectTimer = null;
        }
        if (typeof desktopUnsubscribe === 'function') {
            desktopUnsubscribe();
            desktopUnsubscribe = null;
        }
        if (ws) {
            try {
                ws.close();
            } catch {
                //
            }
            ws = null;
        }
        status.value = 'disconnected';
        readerStatus.value = 'disconnected';
    }

    function onCard(callback) {
        if (typeof callback !== 'function') {
            return () => {};
        }
        cardListeners.add(callback);
        return () => {
            cardListeners.delete(callback);
        };
    }

    if (enabledOption !== undefined && enabledOption !== null && typeof enabledOption === 'object') {
        watch(
            () => resolveEnabled(enabledOption),
            (active) => {
                if (active) {
                    connect();
                } else {
                    disconnect();
                }
            },
            { immediate: true }
        );
    } else if (resolveEnabled(enabledOption)) {
        connect();
    }

    onBeforeUnmount(() => {
        disconnect();
    });

    return {
        status,
        readerStatus,
        onCard,
        connect,
        disconnect
    };
}

export function waitForNextCardTap(onCard, timeoutMs = 15000) {
    return new Promise((resolve, reject) => {
        let settled = false;
        let timer = null;

        const unsubscribe = onCard(({ uid }) => {
            if (settled) {
                return;
            }
            settled = true;
            if (timer) {
                clearTimeout(timer);
            }
            unsubscribe();
            resolve(uid);
        });

        timer = setTimeout(() => {
            if (settled) {
                return;
            }
            settled = true;
            unsubscribe();
            reject(new Error('timeout'));
        }, timeoutMs);
    });
}
