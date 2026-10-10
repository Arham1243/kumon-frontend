<script setup>
import { computed, nextTick, onBeforeMount, onBeforeUnmount, ref } from 'vue';
import { useRoute } from 'vue-router';
import dayjs from '@/plugins/dayjs';
import {
    fetchKioskCompany,
    isKioskCompanyUuid,
    parseKioskCompanyResponse,
    parseKioskPunchResponse,
    punch
} from '@/modules/core/services/Kiosk.service';
import Loader from '@/components/common/Loader.vue';

const route = useRoute();

const companyUuid = computed(() => String(route.params.companyUuid ?? ''));

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
const successLabel = ref('');
const successStudentName = ref('');
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
    attendance_complete: "You're already checked out for today.",
    wait_before_checkout:
        "You're checked in. Please wait at least one minute before checking out.",
    unable_to_record: 'Unable to record attendance. Please try again.',
    rate_limited: 'Too many attempts. Please wait a moment.'
};

function resolveStatusTone(code) {
    if (NOTICE_CODES.has(code)) {
        return 'notice';
    }
    if (ERROR_CODES.has(code)) {
        return 'error';
    }
    return 'notice';
}

function showSuccessCheck(code, studentName) {
    successStudentName.value = String(studentName ?? '').trim();
    successLabel.value =
        code === 'checked_out' ? 'Checked out' : 'Checked in';
    successFlashKey.value += 1;
    successCheckVisible.value = true;
    if (successCheckTimer) {
        clearTimeout(successCheckTimer);
    }
    successCheckTimer = setTimeout(async () => {
        successCheckVisible.value = false;
        await focusInput();
    }, 2000);
}

function showStatus(code, studentName = '') {
    if (SUCCESS_CODES.has(code)) {
        statusVisible.value = false;
        showSuccessCheck(code, studentName);
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
    }, 4000);
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
        if (!loadFailure.value) {
            await focusInput();
        }
    }
}

async function submitPunch() {
    const code = studentIdInput.value.trim();
    studentIdInput.value = '';
    await focusInput();

    if (!code || busy.value || loadFailure.value || !company.value) {
        return;
    }

    busy.value = true;
    try {
        const res = await punch(companyUuid.value, code);
        const result = parseKioskPunchResponse(res);
        showStatus(result.code, result.studentName);
    } catch (err) {
        if (err.code === 'kiosk_bad_response') {
            loadFailure.value = 'error';
            company.value = null;
            return;
        }
        if (err.response?.status === 404) {
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
    } finally {
        busy.value = false;
        await focusInput();
    }
}

function onKeydown(event) {
    if (event.key === 'Enter') {
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

onBeforeMount(async () => {
    clockTimer = setInterval(() => {
        now.value = dayjs();
    }, 30_000);
    await loadCompany();
});

onBeforeUnmount(() => {
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
    <div class="kiosk-page">
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

            <div class="kiosk-page__center">
                <input
                    ref="inputRef"
                    v-model="studentIdInput"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    autocomplete="off"
                    autocorrect="off"
                    spellcheck="false"
                    maxlength="20"
                    class="kiosk-page__input"
                    placeholder="Student ID"
                    :disabled="busy"
                    @keydown="onKeydown"
                    @input="onStudentIdInput"
                />
                <div class="kiosk-page__feedback" aria-live="polite">
                    <Transition name="kiosk-success-banner">
                        <div
                            v-if="successCheckVisible"
                            :key="successFlashKey"
                            class="kiosk-page__success-banner"
                            :aria-label="
                                successStudentName
                                    ? `${successStudentName} ${successLabel}`
                                    : successLabel
                            "
                        >
                            <p
                                v-if="successStudentName"
                                class="kiosk-page__student-name"
                            >
                                {{ successStudentName }}
                            </p>
                            <div class="kiosk-page__success-status">
                                <div class="kiosk-checkmark-circle">
                                    <svg
                                        viewBox="0 0 52 52"
                                        class="kiosk-checkmark-svg"
                                    >
                                        <circle
                                            class="kiosk-checkmark-fill"
                                            cx="26"
                                            cy="26"
                                            r="24"
                                        />
                                        <path
                                            class="kiosk-checkmark-path"
                                            fill="none"
                                            d="M14 27l7.8 7.8L38 17"
                                        />
                                    </svg>
                                </div>
                                <p class="kiosk-page__success-label">
                                    {{ successLabel }}
                                </p>
                            </div>
                        </div>
                    </Transition>
                    <p
                        class="kiosk-page__status"
                        :class="{
                            'kiosk-page__status--visible':
                                statusVisible && !successCheckVisible,
                            [`kiosk-page__status--${statusTone}`]:
                                statusVisible && !successCheckVisible
                        }"
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
.kiosk-page {
    min-height: 100vh;
    min-height: 100dvh;
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
    grid-row: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(0.75rem, 3vw, 1.25rem);
    width: 100%;
    max-width: 30rem;
    padding-inline: 0.25rem;
}

.kiosk-page__feedback {
    position: relative;
    width: 100%;
    min-height: clamp(4.25rem, 18vw, 5.75rem);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.kiosk-page__success-banner {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: clamp(0.85rem, 3vw, 1.25rem);
    width: 100%;
    padding: 0.25rem 0.5rem;
    box-sizing: border-box;
}

.kiosk-page__student-name {
    margin: 0;
    color: #4a2c7a;
    font-size: clamp(1.5rem, 6.5vw, 2.75rem);
    font-weight: 800;
    line-height: 1.15;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    max-width: 36rem;
}

.kiosk-page__success-status {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: clamp(0.75rem, 4vw, 1.25rem);
}

.kiosk-page__success-label {
    margin: 0;
    color: #4a2c7a;
    font-size: clamp(1.75rem, 6.5vw, 2.125rem);
    font-weight: 700;
    line-height: 1.2;
    text-align: left;
}

.kiosk-checkmark-circle {
    flex-shrink: 0;
    width: clamp(2.35rem, 10vw, 2.85rem);
    height: clamp(2.35rem, 10vw, 2.85rem);
}

.kiosk-checkmark-svg {
    width: 100%;
    height: 100%;
    display: block;
}

.kiosk-checkmark-fill {
    fill: #28b856;
    transform-origin: 26px 26px;
    transform: scale(0.55);
    opacity: 0;
    animation: kiosk-check-pop 0.28s ease-out forwards;
}

.kiosk-checkmark-path {
    stroke: #ffffff;
    stroke-width: 3.25;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 34;
    stroke-dashoffset: 34;
    animation: kiosk-check-draw 0.3s ease-out 0.22s forwards;
}

@keyframes kiosk-check-pop {
    to {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes kiosk-check-draw {
    to {
        stroke-dashoffset: 0;
    }
}

.kiosk-success-banner-enter-active,
.kiosk-success-banner-leave-active {
    transition:
        opacity 0.2s ease,
        transform 0.2s ease;
}

.kiosk-success-banner-enter-from,
.kiosk-success-banner-leave-to {
    opacity: 0;
    transform: translateY(-0.35rem);
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

.kiosk-page__input {
    width: 100%;
    margin: 0;
    padding: 0.55em 1em;
    font-size: clamp(1.75rem, 6.5vw, 2.125rem);
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

.kiosk-page__input::placeholder {
    color: #757575;
    font-size: 1em;
    font-weight: 600;
    opacity: 0.9;
}

.kiosk-page__input:focus {
    box-shadow: 0 0 0 3px rgba(201, 79, 155, 0.25);
}

.kiosk-page__input:disabled {
    opacity: 0.7;
}

.kiosk-page__status {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    margin-inline: auto;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-block: 0;
    padding: 0 0.75rem;
    box-sizing: border-box;
    color: #4a2c7a;
    font-size: clamp(1.0625rem, 3.5vw, 1.25rem);
    font-weight: 600;
    line-height: 1.35;
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
    font-weight: 500;
    font-size: clamp(1.125rem, 4vw, 1.375rem);
    line-height: 1.45;
}

.kiosk-page__status--error {
    color: #8b2d5c;
    font-weight: 700;
}
</style>
