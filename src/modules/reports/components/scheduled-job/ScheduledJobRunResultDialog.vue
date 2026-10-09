<script setup>
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useHelpers } from '@/composables/useHelpers';
import { DIALOG_CLASS } from '@/config/dialogClasses';

const props = defineProps({
    visible: { type: Boolean, default: false },
    job: { type: Object, default: null },
    run: { type: Object, default: null }
});

const emit = defineEmits(['update:visible']);

const helpers = useHelpers();

const close = () => emit('update:visible', false);

const statusSeverity = (status) => {
    switch (status) {
        case 'success':
            return 'success';
        case 'failed':
            return 'danger';
        case 'running':
            return 'warn';
        default:
            return 'secondary';
    }
};

const formatDuration = (duration) => {
    if (duration === null || duration === undefined) return '-';
    const n = Number(duration);
    if (!Number.isFinite(n)) return '-';
    if (n < 1) return `${Math.round(n * 1000)} ms`;
    if (n < 60) return `${n.toFixed(2)} s`;
    const m = Math.floor(n / 60);
    const s = Math.round(n - m * 60);
    return `${m}m ${s}s`;
};
</script>

<template>
    <Dialog
        :visible="visible"
        modal
        :draggable="false"
        :header="job ? `Run result: ${job.name}` : 'Run result'"
        :class="DIALOG_CLASS"
        @update:visible="(v) => emit('update:visible', v)"
    >
        <div v-if="run" class="flex flex-col gap-4">
            <div class="flex flex-wrap items-center gap-3 text-sm">
                <div>
                    <span class="text-surface-500">Status:</span>
                    <Tag
                        class="ml-2 !text-xs"
                        :value="(run.status || '-').toUpperCase()"
                        :severity="statusSeverity(run.status)"
                    />
                </div>
                <div>
                    <span class="text-surface-500">Duration:</span>
                    <span class="ml-1 font-medium">{{
                        formatDuration(run.duration)
                    }}</span>
                </div>
                <div v-if="run.started_at">
                    <span class="text-surface-500">Started (UTC):</span>
                    <span class="ml-1">{{
                        helpers.formatDateTimeUtc(run.started_at)
                    }}</span>
                </div>
            </div>

            <div class="rounded bg-surface-50 dark:bg-surface-900 p-3">
                <div
                    class="mb-2 text-xs uppercase tracking-wide font-semibold text-surface-500"
                >
                    Output
                </div>
                <pre
                    class="whitespace-pre-wrap break-words text-xs leading-relaxed m-0 max-h-96 overflow-auto"
                    >{{ run.output || '(no output)' }}</pre
                >
            </div>
        </div>

        <template #footer>
            <div class="flex justify-end">
                <Button label="Close" @click="close" />
            </div>
        </template>
    </Dialog>
</template>
