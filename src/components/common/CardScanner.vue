<script setup>
import { computed, onBeforeUnmount } from 'vue';
import { useCardReader } from '@/composables';

const props = defineProps({
    capturedUid: { type: String, default: '' },
    busy: { type: Boolean, default: false },
    error: { type: String, default: '' },
    /** When true, simulates the idle success UI (connected bridge and reader, optional sample UID). */
    tempUiPreview: { type: Boolean, default: false },
    tempPreviewUid: {
        type: String,
        default: 'A1B2C3D4E5F67890'
    }
});

const emit = defineEmits(['scan']);

const { status, readerStatus, onCard } = useCardReader();

const unsubscribe = onCard(({ uid }) => {
    if (props.busy) {
        return;
    }
    emit('scan', uid);
});

onBeforeUnmount(() => {
    unsubscribe();
});

const displayUid = computed(() => {
    const trimmed = String(props.capturedUid ?? '').trim();
    if (trimmed) {
        return trimmed;
    }
    if (props.tempUiPreview) {
        return String(props.tempPreviewUid ?? '').trim() || 'A1B2C3D4E5F67890';
    }
    return '';
});

const isReaderIdleSuccess = computed(
    () =>
        !props.busy &&
        (props.tempUiPreview ||
            (status.value === 'connected' &&
                readerStatus.value === 'connected'))
);

const statusMessage = computed(() => {
    if (props.busy) {
        return 'Saving card…';
    }
    if (props.tempUiPreview) {
        return '';
    }
    if (status.value === 'connecting') {
        return 'Connecting to card reader…';
    }
    if (status.value !== 'connected') {
        return 'Card reader bridge is not running. Start the card bridge on this computer.';
    }
    if (readerStatus.value !== 'connected') {
        return 'Waiting for NFC reader. Plug in the reader if needed.';
    }
    return '';
});

const isWaiting = computed(
    () => isReaderIdleSuccess.value && !displayUid.value
);

const statusMessageClass = computed(() => {
    const base = 'mt-5 mb-0 max-w-md normal-case';
    if (!statusMessage.value) {
        return base;
    }
    if (props.busy) {
        return `${base} text-base font-medium text-primary`;
    }
    if (status.value === 'disconnected') {
        return `${base} text-sm font-normal text-red-600 dark:text-red-400`;
    }
    return `${base} text-sm font-normal text-muted-color`;
});
</script>

<template>
    <div class="col-span-12 flex flex-col items-center text-center">
        <div
            class="relative flex flex-col items-center justify-center gap-1.5 w-40 h-40 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900"
            :class="{ 'animate-pulse': isWaiting }"
        >
            <span
                class="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-sm"
            />
            <span
                class="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-sm"
            />
            <span
                class="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-sm"
            />
            <span
                class="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-sm"
            />
            <span
                v-if="displayUid"
                class="text-lg font-semibold text-primary tracking-wide"
            >
                {{ displayUid }}
            </span>
            <span
                v-else
                class="text-lg font-semibold text-primary tracking-wide"
            >
                Scan Card
            </span>
            <i
                class="pi pi-id-card !text-4xl text-primary opacity-80"
                aria-hidden="true"
            />
        </div>

        <p v-if="statusMessage" :class="statusMessageClass">
            {{ statusMessage }}
        </p>

        <p
            v-if="error"
            class="mt-3 mb-0 text-sm text-red-600 dark:text-red-400 max-w-md"
            role="alert"
        >
            {{ error }}
        </p>
    </div>
</template>
