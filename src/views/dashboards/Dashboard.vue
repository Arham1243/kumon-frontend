<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { cloneDeep, debounce } from 'lodash-es';
import { useSessionStore } from '@/stores';

const DASHBOARD_PREFS_STORAGE_KEY = 'qms-admin-dashboard-prefs';

const MAIN_BLOCK_IDS = Object.freeze(['quick_actions']);

const QA_IDS = Object.freeze(['qa_admins', 'qa_scheduled_jobs']);

/** @type {Record<string, { permission: string, route: import('vue-router').RouteLocationRaw, title: string, subtitle: string, icon: string, variant: string }>} */
const QUICK_ACTION_META = Object.freeze({
    qa_admins: {
        permission: 'administration.users.view',
        route: { name: 'Users' },
        title: 'User Management',
        subtitle: 'Manage portal users',
        icon: 'pi-user-plus',
        variant: 'user'
    },
    qa_scheduled_jobs: {
        permission: 'reports.scheduled-jobs.view',
        route: { name: 'ScheduledJobs' },
        title: 'Scheduled Jobs',
        subtitle: 'Automated maintenance',
        icon: 'pi-clock',
        variant: 'jobs'
    }
});

const defaultDashboardPreferences = () => ({
    main_order: [...MAIN_BLOCK_IDS],
    main_visible: {},
    qa_order: [...QA_IDS],
    qa_visible: {}
});

/**
 * @template {string} T
 * @param {T[]} preferred
 * @param {readonly T[]} canonical
 * @returns {T[]}
 */
const mergeStableOrder = (preferred, canonical) => {
    const base = [...canonical];
    const head = [...preferred].filter((id) => base.includes(id));
    const tail = base.filter((id) => !head.includes(id));

    return [...head, ...tail];
};

/** @param {unknown} raw */
const normalizeDashboardPreferences = (raw) => {
    const d = defaultDashboardPreferences();
    if (!raw || typeof raw !== 'object') {
        return d;
    }
    const o = /** @type {Record<string, unknown>} */ (raw);

    return {
        ...d,
        main_order: [...MAIN_BLOCK_IDS],
        qa_order: mergeStableOrder(
            Array.isArray(o.qa_order)
                ? o.qa_order.filter((id) => QA_IDS.includes(id))
                : [],
            QA_IDS
        ),
        qa_visible:
            o.qa_visible && typeof o.qa_visible === 'object'
                ? { ...d.qa_visible, ...o.qa_visible }
                : { ...d.qa_visible }
    };
};

const router = useRouter();
const sessionStore = useSessionStore();
const { permissions: userPermissions, user: sessionUser } =
    storeToRefs(sessionStore);

const dashboardReady = computed(() => sessionUser.value != null);

/** Same rule as sidebar menu: user must hold the route view permission. */
const userHasPermission = (requiredPermission) => {
    const list = userPermissions.value || [];

    return list.includes(requiredPermission);
};

const prefs = ref(defaultDashboardPreferences());
const prefsSaveReady = ref(false);
const prefsBeforeManage = ref(
    /** @type {ReturnType<typeof defaultDashboardPreferences>|null} */ (null)
);
const dashboardManageVisible = ref(false);
const dragManageFromIndex = ref(/** @type {number|null} */ (null));
const manageWorkingIds = ref(/** @type {string[]} */ ([]));

const qaPermissionAllows = (id) => {
    const meta = QUICK_ACTION_META[id];

    return meta ? userHasPermission(meta.permission) : false;
};

const orderedVisibleQuickActionIds = computed(() =>
    mergeStableOrder(prefs.value.qa_order, QA_IDS).filter(
        (id) => prefs.value.qa_visible[id] !== false && qaPermissionAllows(id)
    )
);

const quickActionsHasAnyEligibleTile = computed(() =>
    QA_IDS.some((id) => qaPermissionAllows(id))
);

const dashboardQuickActionsGridClass = computed(
    () => 'flex flex-wrap justify-center gap-2.5'
);

const navigateQuickActionClick = (qaId) => {
    if (!qaPermissionAllows(qaId)) return;
    const meta = QUICK_ACTION_META[qaId];
    if (!meta?.route) return;

    router.push(meta.route);
};

const quickActionsRenderable = computed(
    () =>
        prefs.value.main_visible.quick_actions !== false &&
        quickActionsHasAnyEligibleTile.value
);

const loadDashboardPreferences = () => {
    try {
        const stored = localStorage.getItem(DASHBOARD_PREFS_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        prefs.value = normalizeDashboardPreferences(parsed);
    } catch (e) {
        console.error('Failed to load dashboard preferences', e);
        prefs.value = defaultDashboardPreferences();
    }
};

const persistDashboardPrefs = () => {
    try {
        localStorage.setItem(
            DASHBOARD_PREFS_STORAGE_KEY,
            JSON.stringify({ ...prefs.value })
        );
    } catch (e) {
        console.error('Failed to save dashboard preferences', e);
    }
};

const debouncedPersistDashboardPrefs = debounce(persistDashboardPrefs, 500);

watch(
    prefs,
    () => {
        if (!prefsSaveReady.value) return;
        debouncedPersistDashboardPrefs();
    },
    { deep: true }
);

const manageRowLabel = (id) => {
    const meta = QUICK_ACTION_META[id];
    if (meta?.title) {
        return meta.title;
    }

    return id;
};

const initManageWorkingList = () => {
    const eligible = QA_IDS.filter((id) => qaPermissionAllows(id));
    const merged = mergeStableOrder(prefs.value.qa_order, QA_IDS);
    manageWorkingIds.value = merged.filter((id) => eligible.includes(id));
};

const openDashboardManage = () => {
    prefsBeforeManage.value = cloneDeep(prefs.value);
    initManageWorkingList();
    dashboardManageVisible.value = true;
};

const commitWorkingOrderToPrefs = () => {
    const head = [...manageWorkingIds.value];
    const tail = QA_IDS.filter((id) => !head.includes(id));

    prefs.value = {
        ...prefs.value,
        qa_order: [...head, ...tail]
    };
};

const dashboardManageConfirm = () => {
    commitWorkingOrderToPrefs();
    prefsBeforeManage.value = null;
    dashboardManageVisible.value = false;
    manageWorkingIds.value = [];
    dragManageFromIndex.value = null;
};

const dashboardManageCancel = () => {
    if (prefsBeforeManage.value) {
        prefs.value = cloneDeep(prefsBeforeManage.value);
    }
    prefsBeforeManage.value = null;
    dashboardManageVisible.value = false;
    manageWorkingIds.value = [];
    dragManageFromIndex.value = null;
};

const onDashboardManageHide = () => {
    if (prefsBeforeManage.value != null) {
        prefs.value = cloneDeep(prefsBeforeManage.value);
        prefsBeforeManage.value = null;
    }
    manageWorkingIds.value = [];
    dragManageFromIndex.value = null;
};

const toggleManageVisibility = (id, checked) => {
    prefs.value = {
        ...prefs.value,
        qa_visible: { ...prefs.value.qa_visible, [id]: !!checked }
    };
};

const isManageToggleChecked = (id) => prefs.value.qa_visible[id] !== false;

const dragStartManageRow = (_event, index) => {
    dragManageFromIndex.value = index;
};

const dropManageRow = (_event, dropIndex) => {
    const from = dragManageFromIndex.value;
    if (from == null || from === dropIndex) {
        dragManageFromIndex.value = null;
        return;
    }

    const list = [...manageWorkingIds.value];
    const item = list.splice(from, 1)[0];
    list.splice(dropIndex, 0, item);
    manageWorkingIds.value = list;
    dragManageFromIndex.value = null;
};

onMounted(async () => {
    loadDashboardPreferences();
    if (!sessionUser.value) {
        try {
            await sessionStore.me();
        } catch {
            /* auth guard / login flow */
        }
    }
    prefsSaveReady.value = true;
});

onBeforeUnmount(() => {
    debouncedPersistDashboardPrefs.flush();
});
</script>

<template>
    <div class="dashboard-page grid grid-cols-12 gap-5">
        <template v-if="dashboardReady">
            <div v-if="quickActionsRenderable" class="col-span-12">
                <div
                    class="flex w-full flex-wrap justify-end items-start gap-2 mb-2"
                >
                    <Button
                        icon="pi pi-bars"
                        severity="secondary"
                        text
                        rounded
                        size="small"
                        class="shrink-0"
                        aria-label="Manage quick actions"
                        @click="openDashboardManage()"
                    />
                </div>
                <div
                    v-if="orderedVisibleQuickActionIds.length > 0"
                    :class="dashboardQuickActionsGridClass"
                >
                    <button
                        v-for="qaId in orderedVisibleQuickActionIds"
                        :key="qaId"
                        type="button"
                        class="dashboard-quick-action-tile dashboard-quick-action-tile--interactive w-[220px] shrink-0 min-w-0 flex flex-row items-center gap-3 border px-3 py-2.5 rounded-xl text-left"
                        :class="`dashboard-quick-action-tile--${QUICK_ACTION_META[qaId]?.variant ?? 'default'}`"
                        @click="navigateQuickActionClick(qaId)"
                    >
                        <span class="dashboard-qa-glyph">
                            <i
                                :class="[
                                    'pi',
                                    QUICK_ACTION_META[qaId]?.icon,
                                    'qa-glyph-icon',
                                    `qa-glyph-icon--${QUICK_ACTION_META[qaId]?.variant ?? 'default'}`
                                ]"
                            ></i>
                        </span>
                        <div
                            class="min-w-0 flex flex-col gap-0.5 justify-center flex-1"
                        >
                            <span
                                class="font-semibold text-surface-900 dark:text-surface-0 text-sm leading-tight"
                            >
                                {{ QUICK_ACTION_META[qaId]?.title }}
                            </span>
                            <span
                                class="text-xs text-surface-700 dark:text-surface-300/90 leading-snug truncate"
                            >
                                {{ QUICK_ACTION_META[qaId]?.subtitle }}
                            </span>
                        </div>
                    </button>
                </div>
            </div>
            <div v-else class="col-span-12">
                <p
                    class="text-sm text-surface-600 dark:text-surface-400 mb-0 text-center"
                >
                    No quick actions are available for your account.
                </p>
            </div>
        </template>

        <Dialog
            v-model:visible="dashboardManageVisible"
            modal
            header="Quick links"
            class="w-full max-w-md"
            @hide="onDashboardManageHide"
        >
            <div class="flex flex-col gap-2">
                <div
                    v-for="(rowId, index) in manageWorkingIds"
                    :key="`quick_actions-${rowId}`"
                    class="flex items-center gap-3 rounded-lg border border-surface-200 dark:border-surface-700 px-3 py-2"
                    draggable="true"
                    @dragstart="dragStartManageRow($event, index)"
                    @dragover.prevent
                    @drop="dropManageRow($event, index)"
                >
                    <span
                        class="pi pi-bars text-surface-400 shrink-0 cursor-grab"
                    ></span>
                    <Checkbox
                        binary
                        class="shrink-0"
                        :inputId="`dashboard-manage-quick_actions-${rowId}`"
                        :modelValue="isManageToggleChecked(rowId)"
                        @update:modelValue="
                            toggleManageVisibility(rowId, !!$event)
                        "
                    />
                    <label
                        :for="`dashboard-manage-quick_actions-${rowId}`"
                        class="text-sm text-surface-900 dark:text-surface-0 flex-1 min-w-0 cursor-pointer select-none"
                    >
                        {{ manageRowLabel(rowId) }}
                    </label>
                </div>
            </div>
            <template #footer>
                <Button
                    label="Cancel"
                    severity="secondary"
                    text
                    @click="dashboardManageCancel"
                />
                <Button label="Done" @click="dashboardManageConfirm" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.dashboard-quick-action-tile {
    transition:
        transform 0.18s ease,
        box-shadow 0.18s ease,
        border-color 0.18s ease,
        filter 0.18s ease;
}

.dashboard-quick-action-tile--interactive {
    cursor: pointer;
}

.dashboard-quick-action-tile--interactive:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 28px rgba(15, 23, 42, 0.12);
    filter: saturate(1.08) brightness(1.02);
}

html.app-dark .dashboard-quick-action-tile--interactive:hover {
    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.45);
    filter: brightness(1.1) saturate(1.05);
}

.dashboard-qa-glyph {
    width: 2.35rem;
    height: 2.35rem;
    flex-shrink: 0;
    border-radius: 9999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.92);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.85),
        0 1px 2px rgba(15, 23, 42, 0.08),
        0 0 0 1px rgba(255, 255, 255, 0.6);
}

html.app-dark .dashboard-qa-glyph {
    background: rgba(15, 23, 42, 0.78);
    box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.08),
        0 1px 2px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.06);
}

.dashboard-qa-glyph .qa-glyph-icon {
    font-size: 1.08rem;
    line-height: 1;
}

.dashboard-quick-action-tile--user {
    border-color: rgba(139, 92, 246, 0.35);
    background: linear-gradient(
        135deg,
        rgba(245, 243, 255, 0.95) 0%,
        rgba(237, 233, 254, 0.85) 100%
    );
}

html.app-dark .dashboard-quick-action-tile--user {
    border-color: rgba(167, 139, 250, 0.35);
    background: linear-gradient(
        135deg,
        rgba(76, 29, 149, 0.35) 0%,
        rgba(91, 33, 182, 0.25) 100%
    );
}

.qa-glyph-icon--user {
    color: #6d28d9;
}

html.app-dark .qa-glyph-icon--user {
    color: #c4b5fd;
}

.dashboard-quick-action-tile--jobs {
    border-color: rgba(249, 115, 22, 0.35);
    background: linear-gradient(
        135deg,
        rgba(255, 247, 237, 0.95) 0%,
        rgba(255, 237, 213, 0.85) 100%
    );
}

html.app-dark .dashboard-quick-action-tile--jobs {
    border-color: rgba(251, 146, 60, 0.35);
    background: linear-gradient(
        135deg,
        rgba(124, 45, 18, 0.35) 0%,
        rgba(154, 52, 18, 0.25) 100%
    );
}

.qa-glyph-icon--jobs {
    color: #c2410c;
}

html.app-dark .qa-glyph-icon--jobs {
    color: #fdba74;
}
</style>
