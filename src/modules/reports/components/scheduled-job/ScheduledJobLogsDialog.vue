<script setup>
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Column from 'primevue/column';
import Button from 'primevue/button';
import BaseTable from '@/components/common/BaseTable.vue';
import DateRangePresetPicker from '@/components/common/DateRangePresetPicker.vue';
import { useScheduledJobStore } from '@/modules/reports/stores';
import { useHelpers } from '@/composables/useHelpers';
import { describeCronExpression } from '@/modules/reports/utils/cronDescribe';
import { isCompleteDateRange } from '@/utils/dateRangePresets';
import { DIALOG_CLASS_WIDE } from '@/config/dialogClasses';

const props = defineProps({
    visible: { type: Boolean, default: false },
    job: { type: Object, default: null }
});

const emit = defineEmits(['update:visible']);

const helpers = useHelpers();
const scheduledJobStore = useScheduledJobStore();

const loading = ref(false);
const items = ref([]);
const totalRecords = ref(0);
const page = ref(1);
const rows = ref(60);

const expandedRows = ref({});

const periodPreset = ref('all');
const dateRangeForRun = ref([null, null]);
const appliedDateRange = ref([]);

const resetDateFilter = () => {
    periodPreset.value = 'all';
    dateRangeForRun.value = [null, null];
    appliedDateRange.value = [];
};

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

const fetchRuns = async () => {
    if (!props.job?.uuid) return;
    loading.value = true;
    try {
        // store.runs already returns axios response body, which is the Orion
        // paginated envelope: { data: [...], meta: { total, ... } }
        const params = {
            page: page.value,
            limit: rows.value
        };
        if (isCompleteDateRange(appliedDateRange.value)) {
            params.started_after = appliedDateRange.value[0];
            params.started_before = appliedDateRange.value[1];
        }
        const res = await scheduledJobStore.runs(props.job.uuid, params);
        items.value = res?.data ?? [];
        totalRecords.value = res?.meta?.total ?? items.value.length;
    } catch {
        items.value = [];
        totalRecords.value = 0;
    } finally {
        loading.value = false;
    }
};

const onPageChange = (event) => {
    page.value = (event.page ?? 0) + 1;
    rows.value = event.rows ?? rows.value;
    fetchRuns();
};

async function applyDateFilter() {
    appliedDateRange.value = isCompleteDateRange(dateRangeForRun.value)
        ? [...dateRangeForRun.value]
        : [];
    page.value = 1;
    await fetchRuns();
}

watch(
    () => [props.visible, props.job?.uuid],
    ([isOpen, uuid]) => {
        if (isOpen && uuid) {
            page.value = 1;
            expandedRows.value = {};
            resetDateFilter();
            fetchRuns();
        } else if (!isOpen) {
            items.value = [];
            totalRecords.value = 0;
            resetDateFilter();
        }
    }
);

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
        :header="job ? `Execution history: ${job.name}` : 'Execution history'"
        :class="DIALOG_CLASS_WIDE"
        @update:visible="(v) => emit('update:visible', v)"
    >
        <div class="flex flex-col gap-4">
            <div
                v-if="job"
                class="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-surface-600 dark:text-surface-400"
            >
                <div>
                    <span class="font-medium">Frequency:</span>
                    <span class="ml-1">{{
                        describeCronExpression(job.frequency)
                    }}</span>
                    <code
                        class="ml-2 rounded bg-surface-100 dark:bg-surface-800 px-2 text-xs text-surface-500"
                        >{{ job.frequency }}</code
                    >
                </div>
            </div>

            <div class="flex flex-nowrap items-end justify-end gap-2 shrink-0">
                <DateRangePresetPicker
                    v-model:date-range="dateRangeForRun"
                    v-model:preset="periodPreset"
                    default-preset="all"
                    :disabled="loading"
                />
                <Button
                    label="Apply"
                    icon="pi pi-play"
                    class="shrink-0"
                    :disabled="loading"
                    :loading="loading"
                    @click="applyDateFilter"
                />
            </div>

            <BaseTable
                :value="items"
                :page="page"
                :rows="rows"
                :total-records="totalRecords"
                :loading="loading"
                v-model:expandedRows="expandedRows"
                dataKey="id"
                @page="onPageChange"
            >
                <template #empty>
                    <span class="text-surface-500"
                        >No runs recorded yet for this job.</span
                    >
                </template>

                <Column expander style="width: 3rem" />

                <Column header="Started (UTC)" field="started_at">
                    <template #body="{ data }">
                        {{ helpers.formatDateTimeUtc(data.started_at) }}
                    </template>
                </Column>

                <Column header="Finished (UTC)" field="finished_at">
                    <template #body="{ data }">
                        {{ helpers.formatDateTimeUtc(data.finished_at) }}
                    </template>
                </Column>

                <Column header="Duration" field="duration">
                    <template #body="{ data }">
                        {{ formatDuration(data.duration) }}
                    </template>
                </Column>

                <Column header="Status" field="status">
                    <template #body="{ data }">
                        <Tag
                            class="!text-xs"
                            :value="(data.status || '-').toUpperCase()"
                            :severity="statusSeverity(data.status)"
                        />
                    </template>
                </Column>

                <Column header="Trigger" field="trigger" class="w-28">
                    <template #body="{ data }">
                        <Tag
                            class="!text-xs"
                            :value="
                                data.trigger === 'manual'
                                    ? 'MANUAL'
                                    : 'SCHEDULE'
                            "
                            :severity="
                                data.trigger === 'manual' ? 'info' : 'secondary'
                            "
                        />
                    </template>
                </Column>

                <template #expansion="{ data }">
                    <div class="rounded bg-surface-50 dark:bg-surface-900 p-3">
                        <div
                            class="mb-2 text-xs uppercase tracking-wide font-semibold text-surface-500"
                        >
                            Output
                        </div>
                        <pre
                            class="whitespace-pre-wrap break-words text-xs leading-relaxed m-0 max-h-80 overflow-auto"
                            >{{ data.output || '(no output)' }}</pre
                        >
                    </div>
                </template>
            </BaseTable>
        </div>

        <template #footer>
            <div class="flex justify-end">
                <Button label="Close" @click="close" />
            </div>
        </template>
    </Dialog>
</template>
