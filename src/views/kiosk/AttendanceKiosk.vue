<script setup>
import { computed, nextTick, onBeforeMount, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import dayjs from '@/plugins/dayjs';
import {
    fetchKioskCompany,
    isKioskCompanyUuid,
    parseKioskCompanyResponse,
    parseKioskPunchResponse,
    punch,
    punchByCard
} from '@/modules/core/services/Kiosk.service';
import { useCardReader } from '@/composables';
import Loader from '@/components/common/Loader.vue';
import KioskCelebration from '@/views/kiosk/KioskCelebration.vue';

const route = useRoute();

const companyUuid = computed(() => String(route.params.companyUuid ?? ''));

const kioskMode = computed(() =>
    route.meta.kioskMode === 'id' ? 'id' : 'card'
);
const isCardMode = computed(() => kioskMode.value === 'card');
const isIdMode = computed(() => kioskMode.value === 'id');

const loading = ref(true);
const loadFailure = ref(null);
const company = ref(null);
const studentIdInput = ref('');
const inputRef = ref(null);
const busy = ref(false);
const statusMessage = ref('');
const statusTone = ref('notice');
const statusVisible = ref(false);
const successCheckVisible = ref(false);
const successStudentName = ref('');
const successMode = ref('in');
const successFlashKey = ref(0);
let statusTimer = null;
let successCheckTimer = null;
let clockTimer = null;

const SUCCESS_CODES = new Set(['checked_in', 'checked_out']);
const NOTICE_CODES = new Set([
    'wait_before_checkout',
    'attendance_complete'
]);
const ERROR_CODES = new Set([
    'invalid_student_id',
    'card_not_registered',
    'unable_to_record',
    'rate_limited'
]);
const now = ref(dayjs());

const formatMap = {
    'mm/dd/yy': 'MM/DD/YYYY',
    'dd/mm/yy': 'DD/MM/YYYY',
    'yy-mm-dd': 'YYYY-MM-DD'
};

const timezone = computed(() => {
    const tz = company.value?.timezone;
    if (typeof tz === 'string' && tz.trim() !== '') {
        return tz.trim();
    }
    return 'America/New_York';
});

const dateLine = computed(() => {
    if (!company.value) {
        return '';
    }
    const fmt =
        formatMap[company.value.date_format] ||
        formatMap['mm/dd/yy'];
    const localized = now.value.tz(timezone.value);
    const weekday = localized.format('dddd');
    const datePart = localized.format(fmt);
    return `${weekday} - ${datePart}`;
});

const STATUS_MESSAGES = {
    checked_in: 'Checked in successfully.',
    checked_out: 'Checked out successfully.',
    invalid_student_id: 'Student ID is not valid.',
    card_not_registered: 'This card is not registered.',
    attendance_complete: "You're already checked out for today.",
    wait_before_checkout:
        "You're checked in. Please wait at least one minute before checking out.",
    unable_to_record: 'Unable to record attendance. Please try again.',
    rate_limited: 'Too many attempts. Please wait a moment.'
};

const { readerStatus, onCard } = useCardReader({ enabled: isCardMode });

const readerConnected = computed(
    () => readerStatus.value === 'connected'
);

const showIdleHint = computed(
    () =>
        !busy.value &&
        !successCheckVisible.value &&
        !statusVisible.value
);

const canAcceptTap = computed(
    () =>
        !busy.value &&
        !loadFailure.value &&
        !!company.value &&
        !successCheckVisible.value &&
        !statusVisible.value
);

function resolveStatusTone(code) {
    if (NOTICE_CODES.has(code)) {
        return 'notice';
    }
    if (ERROR_CODES.has(code)) {
        return 'error';
    }
    return 'notice';
}

function showSuccessCheck(code, studentName, displayMs = 2000) {
    successStudentName.value = String(studentName ?? '').trim();
    successMode.value = code === 'checked_out' ? 'out' : 'in';
    successFlashKey.value += 1;
    successCheckVisible.value = true;
    if (successCheckTimer) {
        clearTimeout(successCheckTimer);
    }
    successCheckTimer = setTimeout(async () => {
        successCheckVisible.value = false;
        if (isIdMode.value) {
            await focusInput();
        }
    }, displayMs);
}

function showStatus(code, studentName = '', displayMs = 4000) {
    if (SUCCESS_CODES.has(code)) {
        statusVisible.value = false;
        showSuccessCheck(code, studentName, displayMs === 4000 ? 2000 : displayMs);
        return;
    }

    successStudentName.value = '';

    statusMessage.value = STATUS_MESSAGES[code] ?? STATUS_MESSAGES.unable_to_record;
    statusTone.value = resolveStatusTone(
        STATUS_MESSAGES[code] ? code : 'unable_to_record'
    );
    statusVisible.value = true;
    successCheckVisible.value = false;
    if (statusTimer) {
        clearTimeout(statusTimer);
    }
    statusTimer = setTimeout(() => {
        statusVisible.value = false;
    }, displayMs);
}

async function focusInput() {
    await nextTick();
    inputRef.value?.focus?.();
}

async function loadCompany() {
    loading.value = true;
    loadFailure.value = null;
    company.value = null;

    if (!isKioskCompanyUuid(companyUuid.value)) {
        loadFailure.value = 'not_found';
        loading.value = false;
        return;
    }

    try {
        const res = await fetchKioskCompany(companyUuid.value);
        company.value = parseKioskCompanyResponse(res);
    } catch (err) {
        if (err.response?.status === 404) {
            loadFailure.value = 'not_found';
        } else {
            loadFailure.value = 'error';
        }
        company.value = null;
    } finally {
        loading.value = false;
        if (!loadFailure.value && isIdMode.value) {
            await focusInput();
        }
    }
}

function handlePunchError(err) {
    if (err.code === 'kiosk_bad_response') {
        loadFailure.value = 'error';
        company.value = null;
        return;
    }
    if (err.response?.status === 404) {
        const message = err.response?.data?.message;
        if (message === 'Card not registered') {
            showStatus('card_not_registered');
            return;
        }
        loadFailure.value = 'not_found';
        company.value = null;
        return;
    }
    if (err.response?.status === 429) {
        showStatus('rate_limited');
    } else if (err.response?.status === 422) {
        showStatus('invalid_student_id');
    } else {
        showStatus('unable_to_record');
    }
}

function applyPunchResult(result) {
    showStatus(result.code, result.studentName);
}

async function submitPunch() {
    const code = studentIdInput.value.trim();

    if (!code || busy.value || loadFailure.value || !company.value) {
        return;
    }

    busy.value = true;
    inputRef.value?.blur?.();

    try {
        const res = await punch(companyUuid.value, code);
        const result = parseKioskPunchResponse(res);
        studentIdInput.value = '';
        applyPunchResult(result);
    } catch (err) {
        handlePunchError(err);
    } finally {
        busy.value = false;
        if (isIdMode.value) {
            await focusInput();
        }
    }
}

async function submitCardPunch(uid) {
    if (!uid || !canAcceptTap.value) {
        return;
    }

    busy.value = true;

    try {
        const res = await punchByCard(companyUuid.value, uid);
        const result = parseKioskPunchResponse(res);
        applyPunchResult(result);
    } catch (err) {
        handlePunchError(err);
    } finally {
        busy.value = false;
    }
}

let unsubscribeCard = null;

watch(
    isCardMode,
    (card) => {
        if (typeof unsubscribeCard === 'function') {
            unsubscribeCard();
            unsubscribeCard = null;
        }
        if (card) {
            unsubscribeCard = onCard(({ uid }) => {
                submitCardPunch(uid);
            });
        }
    },
    { immediate: true }
);

function onInputBlur() {
    // Phone and iPad numeric keyboards often close on Go instead of sending Enter.
    if (busy.value || !studentIdInput.value.trim()) {
        return;
    }
    submitPunch();
}

function onKeydown(event) {
    if (event.key === 'Enter' || event.keyCode === 13) {
        event.preventDefault();
        submitPunch();
        return;
    }

    if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
    }

    const allowedControlKeys = new Set([
        'Backspace',
        'Delete',
        'Tab',
        'ArrowLeft',
        'ArrowRight',
        'ArrowUp',
        'ArrowDown',
        'Home',
        'End'
    ]);

    if (allowedControlKeys.has(event.key)) {
        return;
    }

    if (event.key.length === 1 && !/^\d$/.test(event.key)) {
        event.preventDefault();
    }
}

function onStudentIdInput(event) {
    const digits = event.target.value.replace(/\D/g, '');
    if (digits !== event.target.value) {
        studentIdInput.value = digits;
    }
}

function maybePreviewKioskState() {
    if (!import.meta.env.DEV) {
        return;
    }
    const preview = String(route.query.preview ?? '').toLowerCase();
    if (!preview || loadFailure.value || !company.value) {
        return;
    }

    const name = String(route.query.name ?? 'Arham').trim() || 'Arham';
    const PREVIEW_MS = 15000;

    if (preview === 'checkout' || preview === 'out') {
        showSuccessCheck('checked_out', name, PREVIEW_MS);
        return;
    }
    if (preview === 'checkin' || preview === 'in' || preview === 'success') {
        showSuccessCheck('checked_in', name, PREVIEW_MS);
        return;
    }

    const errorCode =
        preview === 'error' || preview === 'err'
            ? 'card_not_registered'
            : preview;

    if (STATUS_MESSAGES[errorCode] && !SUCCESS_CODES.has(errorCode)) {
        showStatus(errorCode, '', PREVIEW_MS);
    }
}

onBeforeMount(async () => {
    clockTimer = setInterval(() => {
        now.value = dayjs();
    }, 30_000);
    await loadCompany();
    maybePreviewKioskState();
});

onBeforeUnmount(() => {
    if (typeof unsubscribeCard === 'function') {
        unsubscribeCard();
    }
    if (statusTimer) {
        clearTimeout(statusTimer);
    }
    if (successCheckTimer) {
        clearTimeout(successCheckTimer);
    }
    if (clockTimer) {
        clearInterval(clockTimer);
    }
});
</script>

<template>
    <Teleport to="body">
        <KioskCelebration
            v-if="successCheckVisible"
            :name="successStudentName"
            :mode="successMode"
            :flash-key="successFlashKey"
        />
    </Teleport>
    <div class="kiosk-page">
        <div
            v-if="isCardMode && company && !loadFailure"
            class="kiosk-page__reader"
            :class="{
                'kiosk-page__reader--connected': readerConnected,
                'kiosk-page__reader--disconnected': !readerConnected
            }"
            aria-live="polite"
        >
            <span class="kiosk-page__reader-dot" aria-hidden="true" />
            {{
                readerConnected
                    ? 'Card reader connected'
                    : 'Card reader disconnected'
            }}
        </div>
        <div v-if="loading" class="kiosk-page__loader kiosk-page__message--centered">
            <Loader compact />
        </div>
        <div
            v-else-if="loadFailure === 'not_found'"
            class="kiosk-page__message kiosk-page__message--centered"
        >
            This page is not available.
        </div>
        <div
            v-else-if="loadFailure === 'error'"
            class="kiosk-page__message kiosk-page__message--centered"
        >
            Something went wrong.
        </div>
        <template v-else-if="company">
            <div class="kiosk-page__above">
                <img
                    v-if="company?.logo"
                    :src="company.logo"
                    :alt="company?.name ? `${company.name} logo` : 'Company logo'"
                    class="kiosk-page__logo-img"
                />

                <h1 class="kiosk-page__company">{{ company?.name }}</h1>
                <p class="kiosk-page__date">{{ dateLine }}</p>
            </div>

            <form
                v-if="isIdMode"
                class="kiosk-page__center"
                novalidate
                @submit.prevent="submitPunch"
            >
                <div
                    class="kiosk-page__field"
                    :class="{ 'kiosk-page__field--busy': busy }"
                >
                    <input
                        ref="inputRef"
                        v-model="studentIdInput"
                        type="text"
                        inputmode="numeric"
                        enterkeyhint="go"
                        pattern="[0-9]*"
                        autocomplete="off"
                        autocorrect="off"
                        spellcheck="false"
                        maxlength="20"
                        class="kiosk-page__input"
                        placeholder="Student ID"
                        :readonly="busy"
                        :aria-busy="busy"
                        @keydown="onKeydown"
                        @input="onStudentIdInput"
                        @blur="onInputBlur"
                    />
                    <span
                        v-if="busy"
                        class="kiosk-page__field-overlay"
                        aria-hidden="true"
                    />
                </div>
                <button type="submit" class="kiosk-page__submit" tabindex="-1">
                    Go
                </button>
                <div class="kiosk-page__message-slot" aria-live="polite">
                    <p
                        class="kiosk-page__status"
                        :class="[
                            `kiosk-page__status--${statusTone}`,
                            {
                                'kiosk-page__status--visible':
                                    statusVisible && !successCheckVisible
                            }
                        ]"
                    >
                        {{ statusMessage }}
                    </p>
                </div>
            </form>
            <div v-else class="kiosk-page__center">
                <div class="kiosk-page__message-slot" aria-live="polite">
                    <p v-show="showIdleHint" class="kiosk-page__hint">
                        Tap your card on the reader.
                    </p>
                    <p
                        class="kiosk-page__status"
                        :class="[
                            `kiosk-page__status--${statusTone}`,
                            {
                                'kiosk-page__status--visible':
                                    statusVisible && !successCheckVisible
                            }
                        ]"
                    >
                        {{ statusMessage }}
                    </p>
                </div>
            </div>
        </template>
        <div
            v-else
            class="kiosk-page__message kiosk-page__message--centered"
        >
            Something went wrong.
        </div>
    </div>
</template>

<style scoped>
.kiosk-page__reader {
    position: fixed;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.8125rem;
    font-weight: 600;
    padding: 0.35rem 0.65rem;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.85);
    box-shadow: 0 1px 4px rgba(74, 44, 122, 0.12);
    white-space: nowrap;
    pointer-events: none;
}

.kiosk-page__reader-dot {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 50%;
    flex-shrink: 0;
}

.kiosk-page__reader--connected {
    color: #1b6b3a;
}

.kiosk-page__reader--connected .kiosk-page__reader-dot {
    background: #28b856;
}

.kiosk-page__reader--disconnected {
    color: #8b2d5c;
}

.kiosk-page__reader--disconnected .kiosk-page__reader-dot {
    background: #c94f5b;
}

.kiosk-page {
    height: 100vh;
    height: 100lvh;
    max-height: 100vh;
    max-height: 100lvh;
    min-height: 0;
    overflow: hidden;
    display: grid;
    grid-template-rows: 1fr auto 1fr;
    align-items: stretch;
    justify-items: center;
    padding: clamp(1rem, 4vw, 1.5rem) clamp(1rem, 5vw, 1.5rem) 2rem;
    background-color: #f1e6fa;
    box-sizing: border-box;
}

.kiosk-page__above {
    grid-row: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    max-width: 42rem;
    padding-bottom: clamp(1rem, 4vw, 1.75rem);
}

.kiosk-page__center {
    position: relative;
    grid-row: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(0.85rem, 3vw, 1.35rem);
    width: 100%;
    max-width: min(100%, 52rem);
    padding-inline: clamp(0.5rem, 3vw, 1.25rem);
    margin: 0;
}

.kiosk-page__submit {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}

.kiosk-page__message-slot {
    position: relative;
    width: 100%;
    height: clamp(7.5rem, 26vw, 10.5rem);
    min-height: clamp(7.5rem, 26vw, 10.5rem);
    flex-shrink: 0;
    overflow: hidden;
}

.kiosk-page__hint {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: min(100%, calc(100vw - 2.5rem));
    margin: 0;
    padding: 0 0.5rem;
    color: #4a2c7a;
    font-size: clamp(1rem, 2.85vw, 1.5rem);
    font-weight: 700;
    line-height: 1.3;
    text-align: center;
    text-wrap: balance;
    box-sizing: border-box;
}

.kiosk-page__message {
    color: #4a2c7a;
    font-size: 1.25rem;
    font-weight: 600;
}

.kiosk-page__message--centered {
    grid-row: 1 / -1;
    align-self: center;
}

.kiosk-page__loader {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
}

.kiosk-page__logo-img {
    width: auto;
    max-width: min(100%, clamp(11rem, 46vw, 17rem));
    max-height: clamp(5.5rem, 22vw, 8.5rem);
    object-fit: contain;
    margin-bottom: clamp(0.75rem, 3vw, 1.25rem);
}

.kiosk-page__company {
    margin: 0 0 clamp(0.75rem, 3vw, 1.25rem);
    color: #4a2c7a;
    font-size: clamp(1.5rem, 6.5vw, 2.75rem);
    font-weight: 800;
    line-height: 1.15;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    max-width: 36rem;
}

.kiosk-page__date {
    margin: 0;
    color: #4a2c7a;
    font-size: clamp(1.125rem, 4.5vw, 1.875rem);
    font-weight: 700;
    line-height: 1.25;
    text-align: center;
}

.kiosk-page__field {
    position: relative;
    width: min(100%, clamp(12.5rem, 52vw, 18rem));
    max-width: 18rem;
}

.kiosk-page__field-overlay {
    position: absolute;
    inset: 0;
    border-radius: 9999px;
    background: rgba(74, 44, 122, 0.06);
    pointer-events: auto;
}

.kiosk-page__input {
    width: 100%;
    margin: 0;
    padding: 0.5em 1em;
    font-size: clamp(1.875rem, 7vw, 2.375rem);
    font-weight: 600;
    line-height: 1.2;
    text-align: center;
    color: #4a2c7a;
    background: #fff;
    border: 3px solid #c94f9b;
    border-radius: 9999px;
    outline: none;
    box-sizing: border-box;
    -webkit-appearance: none;
    appearance: none;
}

.kiosk-page__field--busy .kiosk-page__input {
    color: #4a2c7a;
    background: #f1e6fa;
    border-color: #c94f9b;
    pointer-events: none;
}

.kiosk-page__input::placeholder {
    color: #757575;
    font-size: 1em;
    font-weight: 600;
    opacity: 0.9;
}

.kiosk-page__input:focus {
    box-shadow: 0 0 0 3px rgba(201, 79, 155, 0.25);
}

.kiosk-page__field--busy .kiosk-page__input:focus {
    box-shadow: none;
}

.kiosk-page__status {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    width: auto;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    margin: 0;
    padding: 0 0.75rem;
    box-sizing: border-box;
    color: #5f4f7a;
    font-size: clamp(1.125rem, 4vw, 1.375rem);
    font-weight: 500;
    line-height: 1.45;
    text-align: center;
    text-wrap: balance;
    opacity: 0;
    transition: opacity 0.35s ease;
    pointer-events: none;
}

.kiosk-page__status--visible {
    opacity: 1;
}

.kiosk-page__status--notice {
    color: #5f4f7a;
}

.kiosk-page__status--error {
    color: #8b2d5c;
    font-weight: 700;
}
</style>
