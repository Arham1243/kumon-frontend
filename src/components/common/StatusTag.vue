<script setup>
import { computed } from 'vue';

const props = defineProps({
    status: {
        type: String
    }
});

const tagProps = computed(() => {
    const rawStatus = props.status || '-';
    const value = rawStatus.replace(/_/g, ' ').toUpperCase();

    switch (rawStatus.toLowerCase()) {
        case 'yes':
        case 'active':
        case 'billed':
        case 'paid':
        case 'connected':
        case 'approved':
        case 'posted':
        case 'settled':
        case 'assigned':
            return { value, severity: 'success' };
        case 'no':
        case 'inactive':
        case 'not_connected':
        case 'not_posted':
        case 'declined':
        case 'cancelled':
            return { value, severity: 'danger' };
        case 'unbilled':
        case 'pending':
        case 'manual_run':
        case 'submitted':
        case 'partially_paid':
        case 'cancelling':
        case 'expired':
            return { value, severity: 'warn' };
        case 'draft':
        case 'unpaid':
        case 'unassigned':
            return { value, class: '!bg-gray-200 !text-gray-500' };
        case 'new':
            return { value, severity: 'info' };
        case 'working':
            return { value, severity: 'warn' };
        case 'ignore':
            return { value, severity: 'secondary' };
        case 'resolved':
            return { value, severity: 'success' };
        case 'queued':
            return { value, severity: 'warn' };
        case 'accepted':
            return { value, severity: 'info' };
        case 'sent':
        case 'delivered':
            return { value, severity: 'success' };
        case 'opened':
            return {
                value,
                class: '!shadow-none !ring-0 !border-0 !outline-none !bg-emerald-700 !text-white dark:!bg-emerald-800 dark:!text-white'
            };
        case 'failed':
        case 'send_failed':
        case 'complained':
            return { value, severity: 'danger' };
        case 'temporary_failed':
            return { value, severity: 'warn' };
        case 'maths':
            return {
                value,
                class: '!bg-violet-100 !text-violet-900 dark:!bg-violet-950 dark:!text-violet-100'
            };
        case 'reading':
            return {
                value,
                class: '!bg-sky-100 !text-sky-900 dark:!bg-sky-950 dark:!text-sky-100'
            };
        default:
            return { value, severity: 'contrast' };
    }
});
</script>

<template>
    <Tag
        class="!text-xs"
        v-bind="$attrs"
        :value="tagProps.value"
        :severity="tagProps.severity"
        :class="tagProps.class"
    />
</template>
