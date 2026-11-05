<script setup>
import { computed, onBeforeUnmount } from 'vue';
import { useCardReader } from '@/composables';

const props = defineProps({
    capturedUid: { type: String, default: '' },
    busy: { type: Boolean, default: false },
    error: { type: String, default: '' }
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

const statusMessage = computed(() => {
    if (props.busy) {
        return 'Saving card…';
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
    return 'Ready. Tap the Student Card on the Reader.';
});

const isWaiting = computed(
    () =>
        !props.busy &&
        status.value === 'connected' &&
        readerStatus.value === 'connected'
);
</script>

<template>
    <div class="col-span-12 flex flex-col items-center text-center py-2">
        <div
            class="relative flex items-center justify-center w-44 h-44 rounded-xl border-2 border-dashed border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-900"
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
            <i
                class="pi pi-id-card text-5xl text-primary opacity-80"
                aria-hidden="true"
            />
        </div>

        <p
            class="mt-5 mb-0 max-w-md normal-case"
            :class="
                isWaiting
                    ? 'text-base font-medium text-primary'
                    : 'text-sm font-normal text-muted-color'
            "
        >
            {{ statusMessage }}
        </p>

        <p
            v-if="capturedUid"
            class="mt-4 mb-0 text-sm font-mono text-surface-700 dark:text-surface-200 break-all max-w-md"
        >
            Card UID: {{ capturedUid }}
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
