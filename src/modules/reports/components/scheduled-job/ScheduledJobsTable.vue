<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import Card from 'primevue/card';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import { useToast } from 'primevue/usetoast';
import BaseTable from '@/components/common/BaseTable.vue';
import TitleHeader from '@/components/common/TitleHeader.vue';
import TableColumnFilter from '@/components/common/table-filters/TableColumnFilter.vue';
import ScheduledJobFrequencyDialog from './ScheduledJobFrequencyDialog.vue';
import ScheduledJobLogsDialog from './ScheduledJobLogsDialog.vue';
import Confirmation from '@/components/common/Confirmation.vue';
import ScheduledJobRunResultDialog from './ScheduledJobRunResultDialog.vue';
import { useScheduledJobStore } from '@/modules/reports/stores';
import { PaginationOptions, SortFilterOptions } from '@/config';
import { useHelpers, useTableColumnFilters } from '@/composables';
import {
    SCHEDULED_JOB_STATUS_FILTER,
    TEXT_COLUMN_FILTER
} from '@/utils/tableFilters';
import { describeCronExpression } from '@/modules/reports/utils/cronDescribe';
import { formatTimezoneDisplay } from '@/config/timezoneOptions';

const columnConfigs = [
    { field: 'name', filter: TEXT_COLUMN_FILTER },
    { field: 'frequency', filter: TEXT_COLUMN_FILTER },
    { field: 'last_run_status', filter: SCHEDULED_JOB_STATUS_FILTER }
];

const helpers = useHelpers();
const toast = useToast();
const scheduledJobStore = useScheduledJobStore();

const pagination = new PaginationOptions(1, 60);
const sortFilters = new SortFilterOptions();
const loading = ref(false);
const items = ref([]);
const totalRecords = ref(0);

const editDialogVisible = ref(false);
const logsDialogVisible = ref(false);
const runConfirmVisible = ref(false);
const runResultVisible = ref(false);
const activeJob = ref(null);

const runConfirmHeader = computed(() =>
    activeJob.value?.name
        ? `Run now: ${activeJob.value.name}`
        : 'Run scheduled job'
);
const lastManualRun = ref(null);
const saving = ref(false);
const runningJobUuid = ref(null);

async function getItems() {
    loading.value = true;
    try {
        const params = { ...pagination.getPageParams() };
        const payload = { ...sortFilters.getSortFilters() };
        if (!payload.sort || payload.sort.length === 0) {
            payload.sort = [{ field: 'name', direction: 'asc' }];
        }
        const res = await scheduledJobStore.search(payload, params);
        items.value = res.data ?? [];
        totalRecords.value = res.meta?.total ?? items.value.length;
    } finally {
        loading.value = false;
    }
}

const { primeFilters, onColumnFilter } = useTableColumnFilters({
    columnConfigs,
    sortFilters,
    pagination,
    refetch: getItems
});

onBeforeMount(async () => {
    await getItems();
});

const onSortChange = (event) => {
    pagination.resetPageParams();
    sortFilters.updateSortFilters(event);
    getItems();
};

const onPageChange = (event) => {
    pagination.updatePageParams(event);
    getItems();
};

const openEdit = (row) => {
    activeJob.value = row;
    editDialogVisible.value = true;
};

const openLogs = (row) => {
    activeJob.value = row;
    logsDialogVisible.value = true;
};

const openRunConfirm = (row) => {
    activeJob.value = row;
    runConfirmVisible.value = true;
};

const applyJobSummary = (job) => {
    if (!job || typeof job !== 'object') return;
    const idx = items.value.findIndex(
        (item) => item.id === job.id || item.uuid === job.uuid
    );
    if (idx !== -1) {
        items.value[idx] = { ...items.value[idx], ...job };
    }
};

const confirmRun = async () => {
    if (!activeJob.value?.uuid) return;
    const uuid = activeJob.value.uuid;
    runningJobUuid.value = uuid;
    try {
        const res = await scheduledJobStore.run(uuid);
        const payload = res?.data ?? res;
        const job = payload?.job ?? null;
        const run = payload?.run ?? null;
        if (job) {
            applyJobSummary(job);
            activeJob.value = { ...activeJob.value, ...job };
        }
        lastManualRun.value = run;
        runConfirmVisible.value = false;
        runResultVisible.value = true;
        toast.add({
            severity: run?.status === 'success' ? 'success' : 'warn',
            summary:
                run?.status === 'success'
                    ? 'Job finished'
                    : 'Job completed with issues',
            detail: `${activeJob.value?.name ?? 'Job'} ran on demand.`,
            life: 5000
        });
    } catch (err) {
        const status = err?.response?.status;
        const message =
            err?.response?.data?.message ??
            (status === 409
                ? 'This job is already running.'
                : 'Could not run this job.');
        toast.add({
            severity: 'error',
            summary: 'Run failed',
            detail: message,
            life: 6000
        });
    } finally {
        runningJobUuid.value = null;
    }
};

const saveFrequency = async (expression) => {
    if (!activeJob.value) return;
    saving.value = true;
    try {
        const res = await scheduledJobStore.update(activeJob.value.uuid, {
            frequency: expression
        });
        const updated = res?.data?.data ?? res?.data ?? res;
        if (updated && typeof updated === 'object') {
            const idx = items.value.findIndex((item) => item.id === updated.id);
            if (idx !== -1) {
                items.value[idx] = { ...items.value[idx], ...updated };
            }
        }
        toast.add({
            severity: 'success',
            summary: 'Frequency updated',
            detail: `${activeJob.value.name} will now run on "${expression}".`,
            life: 4000
        });
        editDialogVisible.value = false;
    } catch (err) {
        const message =
            err?.response?.data?.errors?.frequency?.[0] ??
            err?.response?.data?.message ??
            'Could not update frequency.';
        toast.add({
            severity: 'error',
            summary: 'Update failed',
            detail: message,
            life: 6000
        });
    } finally {
        saving.value = false;
    }
};

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
    <TitleHeader>
        <template #title>
            <div>
                <h1 class="text-2xl sm:text-3xl font-bold">Scheduled Jobs</h1>
            </div>
        </template>
    </TitleHeader>

    <Card>
        <template #content>
            <BaseTable
                :value="items"
                :page="pagination.page"
                :rows="pagination.limit"
                :rows-per-page-options="pagination.rowsPerPageOptions"
                :total-records="totalRecords"
                :loading="loading"
                :column-filters="true"
                v-model:filters="primeFilters"
                @filter="onColumnFilter"
                @sort="onSortChange"
                @page="onPageChange"
            >
                <template #empty>No scheduled jobs found.</template>

                <Column
                    columnKey="name"
                    :sortable="true"
                    field="name"
                    header="Job"
                    :showFilterMenu="false"
                    filterField="name"
                >
                    <template #filter="{ filterModel, filterCallback }">
                        <TableColumnFilter
                            v-model="filterModel.value"
                            :config="TEXT_COLUMN_FILTER"
                            @apply="filterCallback()"
                        />
                    </template>
                    <template #body="{ data }">
                        <div
                            class="font-medium text-surface-900 dark:text-surface-0"
                        >
                            {{ data.name }}
                        </div>
                        <div
                            v-if="data.description"
                            class="text-sm text-surface-500 mt-0.5"
                        >
                            {{ data.description }}
                        </div>
                    </template>
                </Column>

                <Column
                    columnKey="frequency"
                    header="Frequency"
                    class="min-w-[14rem]"
                    :showFilterMenu="false"
                    filterField="frequency"
                >
                    <template #filter="{ filterModel, filterCallback }">
                        <TableColumnFilter
                            v-model="filterModel.value"
                            :config="TEXT_COLUMN_FILTER"
                            @apply="filterCallback()"
                        />
                    </template>
                    <template #body="{ data }">
                        <div class="text-surface-900 dark:text-surface-0">
                            {{ describeCronExpression(data.frequency) }}
                        </div>
                        <code
                            class="mt-1 inline-block rounded bg-surface-100 dark:bg-surface-800 px-2 py-0.5 text-xs text-surface-500 dark:text-surface-400"
                            >{{ data.frequency }}</code
                        >
                        <div
                            v-if="data.timezone"
                            class="text-sm text-surface-500 dark:text-surface-400 mt-1"
                        >
                            Schedule timezone:
                            {{ formatTimezoneDisplay(data.timezone) }}
                        </div>
                    </template>
                </Column>

                <Column
                    columnKey="last_run_at"
                    :sortable="true"
                    field="last_run_at"
                    header="Last run (UTC)"
                    class="min-w-[12rem]"
                >
                    <template #body="{ data }">
                        <div>
                            {{
                                data.last_run_at
                                    ? helpers.formatDateTimeUtc(
                                          data.last_run_at
                                      )
                                    : 'Never'
                            }}
                        </div>
                        <div
                            v-if="
                                data.last_run_duration !== null &&
                                data.last_run_duration !== undefined
                            "
                            class="text-xs text-surface-500"
                        >
                            took {{ formatDuration(data.last_run_duration) }}
                        </div>
                    </template>
                </Column>

                <Column
                    columnKey="last_run_status"
                    :sortable="true"
                    field="last_run_status"
                    header="Status"
                    class="w-32"
                    :showFilterMenu="false"
                    filterField="last_run_status"
                >
                    <template #filter="{ filterModel, filterCallback }">
                        <TableColumnFilter
                            v-model="filterModel.value"
                            :config="SCHEDULED_JOB_STATUS_FILTER"
                            @apply="filterCallback()"
                        />
                    </template>
                    <template #body="{ data }">
                        <Tag
                            v-if="data.last_run_status"
                            class="!text-xs"
                            :value="data.last_run_status.toUpperCase()"
                            :severity="statusSeverity(data.last_run_status)"
                        />
                        <span v-else class="text-surface-400">-</span>
                    </template>
                </Column>

                <Column
                    columnKey="actions"
                    header="Actions"
                    :exportable="false"
                    class="w-56"
                >
                    <template #body="{ data }">
                        <div class="flex gap-2">
                            <Button
                                v-tooltip.top="'View logs'"
                                rounded
                                severity="warn"
                                icon="pi pi-history"
                                @click="openLogs(data)"
                            />
                            <Button
                                v-if="
                                    $ability.can('reports.scheduled-jobs.edit')
                                "
                                v-tooltip.top="'Edit frequency'"
                                rounded
                                severity="primary"
                                icon="pi pi-pencil"
                                @click="openEdit(data)"
                            />
                            <Button
                                v-if="
                                    $ability.can('reports.scheduled-jobs.edit')
                                "
                                v-tooltip.top="'Run now'"
                                rounded
                                severity="success"
                                icon="pi pi-play"
                                :loading="runningJobUuid === data.uuid"
                                :disabled="
                                    runningJobUuid !== null &&
                                    runningJobUuid !== data.uuid
                                "
                                @click="openRunConfirm(data)"
                            />
                        </div>
                    </template>
                </Column>
            </BaseTable>
        </template>
    </Card>

    <ScheduledJobFrequencyDialog
        v-model:visible="editDialogVisible"
        :job="activeJob"
        :saving="saving"
        @save="saveFrequency"
    />

    <ScheduledJobLogsDialog
        v-model:visible="logsDialogVisible"
        :job="activeJob"
    />

    <Confirmation
        v-model="runConfirmVisible"
        :header="runConfirmHeader"
        content="Run this job immediately? Its cron schedule is unchanged and future runs will still occur on time."
        variant="success"
        confirm-button-text="Run now"
        :loading="runningJobUuid === activeJob?.uuid"
        :close-on-confirm="false"
        @confirm="confirmRun"
    />

    <ScheduledJobRunResultDialog
        v-model:visible="runResultVisible"
        :job="activeJob"
        :run="lastManualRun"
    />
</template>
