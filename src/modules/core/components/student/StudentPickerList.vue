<script setup>
import {
    computed,
    nextTick,
    onBeforeMount,
    onBeforeUnmount,
    ref,
    watch
} from 'vue';
import { useStudentStore } from '@/modules/core/stores';
import Search from '@/components/common/Search.vue';
import StatusTag from '@/components/common/StatusTag.vue';
import ProgressSpinner from 'primevue/progressspinner';

const props = defineProps({
    selectedUuid: {
        type: String,
        default: ''
    },
    /** When present and search is empty, row is prepended if missing from the first page. */
    currentRecord: {
        type: Object,
        default: null
    },
    /** Patch name/status on an existing row after save or status change. */
    patchRow: {
        type: Object,
        default: null
    },
    disabled: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['select']);

const studentStore = useStudentStore();

const searchQuery = ref('');
const items = ref([]);
const page = ref(1);
const totalRecords = ref(0);
/** When we prepend current student not on page 1, skip that uuid on later appends. */
const skipUuidOnAppend = ref('');
const loadingInitial = ref(false);
const loadingMore = ref(false);
const scrollHostRef = ref(null);
const loadSentinelRef = ref(null);

let loadObserver = null;

const PAGE_SIZE = 25;

/** Name A–Z first, then active before inactive (boolean desc). */
const defaultSortPayload = () => [
    { field: 'name', direction: 'asc' },
    { field: 'status', direction: 'desc' }
];

const hasMore = computed(() => {
    if (totalRecords.value <= 0) {
        return false;
    }
    const extra = skipUuidOnAppend.value ? 1 : 0;
    return items.value.length - extra < totalRecords.value;
});

const tableSelection = ref(null);

const trimmedSearch = computed(() =>
    String(searchQuery.value ?? '').trim()
);

function rowForList(record) {
    if (!record?.uuid) {
        return null;
    }
    return {
        uuid: record.uuid,
        name: record.name ?? '',
        student_id: record.student_id ?? '',
        status: !!record.status
    };
}

function mergeFirstPageWithCurrent(rows, searchTerm) {
    const list = [...rows];
    skipUuidOnAppend.value = '';
    if (
        searchTerm !== '' ||
        !props.currentRecord?.uuid ||
        props.currentRecord.uuid !== props.selectedUuid
    ) {
        return list;
    }
    const cu = props.currentRecord.uuid;
    const exists = list.some((r) => r.uuid === cu);
    if (exists) {
        return list;
    }
    const pinned = rowForList(props.currentRecord);
    if (pinned) {
        list.unshift(pinned);
        skipUuidOnAppend.value = cu;
    }
    return list;
}

async function fetchPage({ append = false } = {}) {
    const term = trimmedSearch.value;

    if (append) {
        if (
            !hasMore.value ||
            loadingInitial.value ||
            loadingMore.value
        ) {
            return;
        }
        loadingMore.value = true;
    } else {
        loadingInitial.value = true;
    }

    const nextPage = append ? page.value + 1 : 1;

    const payload = {
        search: { value: term },
        sort: defaultSortPayload(),
        filters: []
    };

    try {
        const res = await studentStore.search(payload, {
            page: nextPage,
            limit: PAGE_SIZE
        });
        let rows = (res?.data ?? []).map((r) => ({
            uuid: r.uuid,
            name: r.name ?? '',
            student_id: r.student_id ?? '',
            status: !!r.status
        }));
        if (append && skipUuidOnAppend.value) {
            const skip = skipUuidOnAppend.value;
            rows = rows.filter((r) => r.uuid !== skip);
        }
        const total = Number(res?.meta?.total ?? 0);
        totalRecords.value = Number.isFinite(total) ? total : 0;

        if (append) {
            items.value = mergeAppend(rows);
        } else {
            items.value = mergeFirstPageWithCurrent(rows, term);
        }
        page.value = nextPage;
    } catch (error) {
        console.error(error);
        if (!append) {
            items.value = [];
            totalRecords.value = 0;
            page.value = 1;
        }
    } finally {
        loadingInitial.value = false;
        loadingMore.value = false;
    }
}

function mergeAppend(rows) {
    const existingIds = new Set(items.value.map((r) => r.uuid));
    const merged = rows.filter((r) => !existingIds.has(r.uuid));
    return [...items.value, ...merged];
}

function onSearch() {
    page.value = 1;
    totalRecords.value = 0;
    skipUuidOnAppend.value = '';
    void fetchPage({ append: false });
}

function disconnectObserver() {
    if (loadObserver) {
        loadObserver.disconnect();
        loadObserver = null;
    }
}

function connectObserver() {
    disconnectObserver();
    const root = scrollHostRef.value;
    const sentinel = loadSentinelRef.value;
    if (
        !root ||
        !sentinel ||
        !hasMore.value ||
        loadingInitial.value ||
        loadingMore.value
    ) {
        return;
    }
    loadObserver = new IntersectionObserver(
        (entries) => {
            if (!entries.some((e) => e.isIntersecting)) {
                return;
            }
            void fetchPage({ append: true });
        },
        { root, rootMargin: '64px', threshold: 0 }
    );
    loadObserver.observe(sentinel);
}

watch(
    () => [
        items.value.length,
        hasMore.value,
        loadingInitial.value,
        loadingMore.value
    ],
    () => {
        nextTick(() => connectObserver());
    }
);

watch(loadSentinelRef, () => {
    nextTick(() => connectObserver());
});

watch(
    () => [props.selectedUuid, items.value],
    () => {
        const uuid = props.selectedUuid;
        tableSelection.value = uuid
            ? items.value.find((r) => r.uuid === uuid) ?? null
            : null;
    },
    { deep: true, immediate: true }
);

watch(
    () => props.patchRow,
    (patch) => {
        if (!patch?.uuid) {
            return;
        }
        const idx = items.value.findIndex((r) => r.uuid === patch.uuid);
        if (idx === -1) {
            return;
        }
        const row = { ...items.value[idx] };
        if (patch.name !== undefined) {
            row.name = patch.name ?? '';
        }
        if (patch.status !== undefined) {
            row.status = !!patch.status;
        }
        if (patch.student_id !== undefined) {
            row.student_id = patch.student_id ?? '';
        }
        items.value.splice(idx, 1, row);
    },
    { deep: true }
);

watch(
    () => props.currentRecord?.uuid,
    () => {
        if (trimmedSearch.value !== '') {
            return;
        }
        void fetchPage({ append: false });
    }
);

onBeforeMount(() => {
    void fetchPage({ append: false });
});

onBeforeUnmount(() => {
    disconnectObserver();
});

function onRowClick(event) {
    if (props.disabled) {
        return;
    }
    const row = event?.data;
    if (!row?.uuid || row.uuid === props.selectedUuid) {
        return;
    }
    emit('select', row.uuid);
}

function onRowUnselect(event) {
    const row = event?.data;
    if (!row?.uuid || row.uuid !== props.selectedUuid) {
        return;
    }
    nextTick(() => {
        tableSelection.value =
            items.value.find((r) => r.uuid === props.selectedUuid) ?? null;
    });
}

</script>

<template>
    <div class="student-picker-list">
        <div
            class="student-picker-list__heading mb-2 flex min-w-0 flex-wrap items-center gap-3"
        >
            <slot name="headingBefore" />
            <h2
                class="m-0 max-w-[min(100%,40rem)] truncate text-2xl font-bold capitalize sm:text-3xl"
            >
                Students
            </h2>
        </div>
        <Search
            id="student_picker_search"
            v-model="searchQuery"
            placeholder="Search"
            :disabled="disabled"
            @search="onSearch"
        />
        <div class="student-picker-list__table-host">
            <div
                ref="scrollHostRef"
                class="student-picker-list__table-scroll"
            >
                <DataTable
                    v-model:selection="tableSelection"
                    class="student-picker-list__table compact-datatable"
                    :value="items"
                    data-key="uuid"
                    selection-mode="single"
                    :meta-key-selection="false"
                    :paginator="false"
                    :loading="loadingInitial"
                    :scrollable="false"
                    :resizable-columns="false"
                    :striped-rows="true"
                    @row-click="onRowClick"
                    @row-unselect="onRowUnselect"
                >
                    <template #empty>
                        <div
                            v-if="!loadingInitial"
                            class="student-picker-list__empty"
                        >
                            <i
                                class="pi pi-search student-picker-list__empty-icon"
                                aria-hidden="true"
                            />
                            <p class="student-picker-list__empty-text">
                                {{
                                    trimmedSearch.length > 0
                                        ? 'No students match your search.'
                                        : 'No students found.'
                                }}
                            </p>
                        </div>
                    </template>
                    <Column
                        selection-mode="single"
                        header=""
                        header-style="width: 2rem; padding: 0"
                        body-style="width: 2rem; padding: 0.35rem 0.35rem 0.35rem 0.5rem"
                    />
                    <Column header="">
                        <template #body="{ data }">
                            <div class="student-picker-list__cell">
                                <div class="student-picker-list__name-row">
                                    <span class="student-picker-list__name">{{
                                        data.name || 'Student'
                                    }}</span>
                                    <StatusTag
                                        class="student-picker-list__status-tag shrink-0"
                                        :status="
                                            data.status ? 'active' : 'inactive'
                                        "
                                    />
                                </div>
                                <span
                                    v-if="data.student_id"
                                    class="student-picker-list__meta"
                                    >{{ data.student_id }}</span
                                >
                            </div>
                        </template>
                    </Column>
                </DataTable>
                <div
                    v-if="loadingMore"
                    class="student-picker-list__more"
                    aria-busy="true"
                    aria-label="Loading more students"
                >
                    <ProgressSpinner
                        class="student-picker-list__more-spinner"
                        strokeWidth="3"
                    />
                </div>
                <div
                    v-else-if="hasMore && items.length > 0"
                    ref="loadSentinelRef"
                    class="student-picker-list__sentinel"
                    aria-hidden="true"
                />
            </div>
        </div>
    </div>
</template>

<style scoped>
.student-picker-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 0;
    flex: 1 1 0;
}

.student-picker-list__heading {
    flex-shrink: 0;
}

.student-picker-list__table-host {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-height: 0;
    background: var(--p-content-background, #fff);
    border: 1px solid var(--p-content-border-color, rgb(226 232 240));
    border-radius: var(--p-content-border-radius, 6px);
    overflow: hidden;
}

.student-picker-list__table-scroll {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    min-height: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
}

.student-picker-list__empty {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 12rem;
    padding: 2rem 1.25rem;
    text-align: center;
}

.student-picker-list__empty-icon {
    font-size: 2.75rem;
    line-height: 1;
    color: var(--p-text-muted-color, rgb(148 163 184));
    margin-bottom: 1rem;
}

.student-picker-list__empty-text {
    margin: 0;
    max-width: 14rem;
    font-size: 0.9375rem;
    line-height: 1.45;
    color: var(--p-text-muted-color, rgb(100 116 139));
}

.student-picker-list__more {
    flex-shrink: 0;
    border-top: 1px solid var(--p-content-border-color, rgb(226 232 240));
    padding: 0.5rem;
    display: flex;
    justify-content: center;
    align-items: center;
}

.student-picker-list__more-spinner {
    width: 2.25rem;
    height: 2.25rem;
}

.student-picker-list__sentinel {
    flex-shrink: 0;
    width: 100%;
    height: 1px;
    pointer-events: none;
}

.student-picker-list__cell {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
    line-height: 1.25;
}

.student-picker-list__name-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.375rem;
    min-width: 0;
}

.student-picker-list__name {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--p-text-color);
    word-break: break-word;
    min-width: 0;
}

.student-picker-list__status-tag :deep(.p-tag) {
    font-size: 0.6875rem;
    line-height: 1.2;
    padding: 0.125rem 0.4rem;
}

.student-picker-list__meta {
    font-size: 0.85rem;
    line-height: 1.2;
    color: var(--p-text-muted-color, rgb(100 116 139));
    word-break: break-word;
}

.student-picker-list__table :deep(.p-datatable) {
    border: none;
}

.student-picker-list__table-scroll :deep(.p-datatable-thead),
.student-picker-list__table-scroll :deep(thead) {
    display: none !important;
}

.student-picker-list__table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.35rem 0.5rem;
    vertical-align: middle;
}

.student-picker-list__table-scroll :deep(.p-datatable-empty-message > td) {
    border: none;
    padding: 0;
    vertical-align: middle;
    background: var(--p-content-background, #fff);
}

.student-picker-list__table-scroll :deep(.p-datatable-tbody > tr:hover > td) {
    background: color-mix(
        in srgb,
        var(--primary-color, #3b82f6) 8%,
        var(--p-content-background, #fff)
    );
}

html.app-dark .student-picker-list__table-scroll :deep(.p-datatable-tbody > tr:hover > td) {
    background: color-mix(
        in srgb,
        var(--primary-color, #3b82f6) 12%,
        var(--p-content-background, #0f172a)
    );
}
</style>
