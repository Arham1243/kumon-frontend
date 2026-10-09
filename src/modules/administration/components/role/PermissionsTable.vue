<script setup>
import { computed, onBeforeMount, ref } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { isEqual } from 'lodash-es';
import { useUserRoleStore } from '@/modules/administration/stores';
import Confirmation from '@/components/common/Confirmation.vue';
import {
    buildPermissionMatrixRows,
    applyPermissionSectionPreset,
    computeSectionPresetSwitches,
    normalizeAdminMatrixHiddenActions,
    applyPermissionDependencies,
    isApplicableAction,
    isReportsSectionEntity,
    isEntityInPresetSection,
    ENTITY_HIDDEN_MATRIX_ACTIONS
} from '@/modules/administration/utils/permissionMatrix';
import PermissionMatrixTable from '@/modules/administration/components/permission/PermissionMatrixTable.vue';
import useEventsBus from '@/composables/useEventsBus';
import { SYSTEM_MANAGED_LOCK_TOOLTIP } from '@/config';

const GLOBAL_PRESET = {
    key: 'global',
    label: 'All Permissions',
    filter: () => true
};

const PRESET_SECTIONS = [
    GLOBAL_PRESET,
    {
        key: 'core',
        filter: (entity) => isEntityInPresetSection('core', entity)
    },
    {
        key: 'reports',
        filter: isReportsSectionEntity
    },
    {
        key: 'administration',
        filter: (entity) => isEntityInPresetSection('administration', entity)
    }
];

function emptySectionPresets() {
    return {
        global: { viewOnly: false, fullAdmin: false },
        core: { viewOnly: false, fullAdmin: false },
        reports: { viewOnly: false, fullAdmin: false },
        administration: { viewOnly: false, fullAdmin: false }
    };
}

const route = useRoute();
const router = useRouter();
const roleStore = useUserRoleStore();
const { emit: emitEvent } = useEventsBus();

const roleUuid = computed(() => route.params.uuid);
const loading = ref(false);
const loadingPermissions = ref(false);
const busy = ref(false);
const item = ref(null);
const rolePermissions = ref({});
const selectedPermissions = ref({});
const tableData = ref([]);
const sectionPresets = ref(emptySectionPresets());
const showUnsavedDialog = ref(false);
let nextRoute = null;

const permissionsReadOnly = computed(() => {
    const r = item.value;
    if (!r || typeof r !== 'object') {
        return false;
    }
    return !!(r.system && r.is_super_admin);
});

const isDirty = computed(() => {
    return !isEqual(selectedPermissions.value, rolePermissions.value);
});

onBeforeMount(async () => {
    await getItem();
    await getRolePermissions();
});

onBeforeRouteLeave((to, from, next) => {
    if (isDirty.value) {
        showUnsavedDialog.value = true;
        nextRoute = next;
    } else {
        next();
    }
});

const buildTableData = () => {
    tableData.value = buildPermissionMatrixRows(
        rolePermissions.value,
        selectedPermissions.value
    );
};

function syncSectionPresetsFromSelection() {
    for (const row of PRESET_SECTIONS) {
        const next = computeSectionPresetSwitches(
            selectedPermissions.value,
            rolePermissions.value,
            row.filter
        );
        sectionPresets.value[row.key].viewOnly = next.viewOnly;
        sectionPresets.value[row.key].fullAdmin = next.fullAdmin;
    }
}

function onSectionPreset(key, kind, enabled) {
    if (permissionsReadOnly.value) {
        return;
    }
    const row = PRESET_SECTIONS.find((r) => r.key === key);
    if (!row) {
        return;
    }
    if (!enabled) {
        applyPermissionSectionPreset(
            selectedPermissions.value,
            rolePermissions.value,
            row.filter,
            'clear'
        );
    } else if (kind === 'view') {
        applyPermissionSectionPreset(
            selectedPermissions.value,
            rolePermissions.value,
            row.filter,
            'view-only'
        );
    } else {
        applyPermissionSectionPreset(
            selectedPermissions.value,
            rolePermissions.value,
            row.filter,
            'full'
        );
    }
    syncSectionPresetsFromSelection();
    buildTableData();
}

function togglePermission(entity, action, val) {
    if (ENTITY_HIDDEN_MATRIX_ACTIONS[entity]?.includes(action)) {
        return;
    }
    if (!isApplicableAction(entity, action)) {
        return;
    }
    if (!selectedPermissions.value[entity]) {
        selectedPermissions.value[entity] = {};
    }
    if (selectedPermissions.value[entity][action] !== null) {
        selectedPermissions.value[entity][action] = val;
        applyPermissionDependencies(entity, selectedPermissions.value[entity]);
    }
    syncSectionPresetsFromSelection();
    buildTableData();
}

function buildPermissionsForBackend(permissions) {
    const result = [];
    Object.entries(permissions).forEach(([entity, actions]) => {
        Object.entries(actions).forEach(([action, value]) => {
            if (value === true && isApplicableAction(entity, action)) {
                result.push(`${entity}.${action}`);
            }
        });
    });
    return result;
}

function cancel() {
    showUnsavedDialog.value = true;
}

function confirmDiscard() {
    showUnsavedDialog.value = false;
    if (nextRoute) {
        const go = nextRoute;
        nextRoute = null;
        go();
    } else {
        selectedPermissions.value = JSON.parse(
            JSON.stringify(rolePermissions.value)
        );
        sectionPresets.value = emptySectionPresets();
        syncSectionPresetsFromSelection();
        buildTableData();
    }
}

const getItem = async () => {
    try {
        loading.value = true;
        const res = await roleStore.getItem(roleUuid.value);
        item.value = res.data?.data ?? res.data;
        const name = item.value?.name?.trim?.() ?? '';
        if (name) {
            emitEvent('updateDetailsBreadcrumb', name);
        }
    } catch {
        router.push({ name: 'Roles' });
    } finally {
        loading.value = false;
    }
};

const getRolePermissions = async () => {
    try {
        loadingPermissions.value = true;
        const res = await roleStore.getRolePermissions(roleUuid.value);
        const normalized = JSON.parse(JSON.stringify(res));
        normalizeAdminMatrixHiddenActions(normalized);
        rolePermissions.value = normalized;
        selectedPermissions.value = JSON.parse(JSON.stringify(normalized));
        sectionPresets.value = emptySectionPresets();
        syncSectionPresetsFromSelection();
        buildTableData();
    } finally {
        loadingPermissions.value = false;
    }
};

const syncRolePermissions = async () => {
    try {
        busy.value = true;
        await roleStore.syncRolePermissions(roleUuid.value, {
            permissions: buildPermissionsForBackend(selectedPermissions.value)
        });
        await getRolePermissions();
    } finally {
        busy.value = false;
    }
};
</script>

<template>
    <Loader v-if="loading" />
    <template v-else>
        <TitleHeader>
            <template #title>
                <div class="flex items-center gap-5">
                    <Button
                        type="button"
                        variant="outlined"
                        icon="pi pi-chevron-left"
                        size="large"
                        @click="router.push({ name: 'Roles' })"
                        iconClass="!text-sm"
                    />
                    <div class="flex items-center gap-2">
                        <h1 class="text-2xl sm:text-3xl font-bold capitalize">
                            {{ item?.name }}
                        </h1>
                        <i
                            v-if="permissionsReadOnly"
                            class="pi pi-lock text-red-500 !text-xl opacity-90"
                            aria-hidden="true"
                            v-tooltip.top="SYSTEM_MANAGED_LOCK_TOOLTIP"
                        />
                    </div>
                </div>
            </template>
            <template #actions>
                <Button
                    v-if="!permissionsReadOnly"
                    label="Cancel"
                    variant="outlined"
                    class="w-full sm:w-auto"
                    :disabled="busy || !isDirty"
                    @click="cancel"
                />
                <Button
                    v-if="!permissionsReadOnly"
                    label="Save"
                    icon="pi pi-check"
                    iconPos="left"
                    class="w-full sm:w-auto"
                    :loading="busy"
                    :disabled="busy || !isDirty"
                    @click="syncRolePermissions"
                />
            </template>
        </TitleHeader>

        <Card class="py-3 px-2">
            <template #content>
                <div
                    class="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start"
                >
                    <div
                        v-if="!loadingPermissions && !permissionsReadOnly"
                        class="shrink-0 w-full lg:w-56 xl:w-60 space-y-3 lg:sticky lg:top-4 border border-surface-200 dark:border-surface-700 rounded-lg p-4 bg-surface-0 dark:bg-surface-900"
                    >
                        <div class="font-semibold text-sm">
                            {{ GLOBAL_PRESET.label }}
                        </div>
                        <div class="flex flex-col gap-3">
                            <div class="flex items-center gap-2">
                                <ToggleSwitch
                                    inputId="global-view-only"
                                    :modelValue="
                                        sectionPresets[GLOBAL_PRESET.key]
                                            .viewOnly
                                    "
                                    :disabled="busy || loadingPermissions"
                                    @update:modelValue="
                                        (v) =>
                                            onSectionPreset(
                                                GLOBAL_PRESET.key,
                                                'view',
                                                v
                                            )
                                    "
                                />
                                <label
                                    for="global-view-only"
                                    class="cursor-pointer text-sm font-medium mb-0"
                                    >View only</label
                                >
                            </div>
                            <div class="flex items-center gap-2">
                                <ToggleSwitch
                                    inputId="global-full-access"
                                    :modelValue="
                                        sectionPresets[GLOBAL_PRESET.key]
                                            .fullAdmin
                                    "
                                    :disabled="busy || loadingPermissions"
                                    @update:modelValue="
                                        (v) =>
                                            onSectionPreset(
                                                GLOBAL_PRESET.key,
                                                'full',
                                                v
                                            )
                                    "
                                />
                                <label
                                    for="global-full-access"
                                    class="cursor-pointer text-sm font-medium mb-0"
                                    >Full access</label
                                >
                            </div>
                        </div>
                    </div>
                    <div class="min-w-0 flex-1 w-full overflow-x-auto">
                        <PermissionMatrixTable
                            :table-data="tableData"
                            :loading="loadingPermissions"
                            :busy="busy"
                            :disabled="permissionsReadOnly"
                            :show-section-presets="!permissionsReadOnly"
                            :section-presets="sectionPresets"
                            @toggle-permission="togglePermission"
                            @section-preset="onSectionPreset"
                        />
                    </div>
                </div>
            </template>
        </Card>
    </template>

    <Confirmation
        v-model="showUnsavedDialog"
        header="Unsaved changes"
        content="You have unsaved changes. If you continue, those changes will be lost. Do you want to discard them?"
        variant="danger"
        confirmButtonText="Discard changes"
        cancelButtonText="Keep editing"
        @confirm="confirmDiscard"
    />
</template>
