<script setup>
import {
    permissionLabel,
    permissionMatrixRowClass
} from '@/modules/administration/utils/permissionMatrix';

const props = defineProps({
    tableData: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false },
    busy: { type: Boolean, default: false },
    actions: {
        type: Array,
        default: () => ['view', 'create', 'edit', 'delete']
    },
    inputClass: { type: String, default: '' },
    showSectionPresets: { type: Boolean, default: false },
    sectionPresets: { type: Object, default: null }
});

const emit = defineEmits(['togglePermission', 'sectionPreset']);

function isLastAction(action) {
    const list = props.actions;
    return list.length > 0 && action === list[list.length - 1];
}
</script>

<template>
    <DataTable
        :value="tableData"
        :loading="loading"
        :rowClass="permissionMatrixRowClass"
    >
        <Column field="entity" header="Permission">
            <template #body="{ data }">
                <span
                    v-if="data.isGroupHeader"
                    class="font-semibold text-base"
                    >{{ data.groupTitle }}</span
                >
                <span v-else :class="data.indent ? 'inline-block pl-4' : ''">{{
                    permissionLabel(data.entity)
                }}</span>
            </template>
        </Column>

        <Column
            v-for="a in actions"
            :key="a"
            :field="a"
            :header="a.charAt(0).toUpperCase() + a.slice(1)"
        >
            <template #body="{ data }">
                <div
                    v-if="
                        data.isGroupHeader &&
                        data.presetSectionKey &&
                        showSectionPresets &&
                        sectionPresets &&
                        isLastAction(a)
                    "
                    class="flex justify-end items-end gap-8 pr-3 min-h-[2.5rem]"
                    @click.stop
                >
                    <div class="flex flex-col gap-2">
                        <label
                            :for="`sec-${data.presetSectionKey}-view`"
                            class="cursor-pointer text-sm font-medium mb-0 whitespace-nowrap"
                            >View only</label
                        >
                        <ToggleSwitch
                            :inputId="`sec-${data.presetSectionKey}-view`"
                            :modelValue="
                                sectionPresets[data.presetSectionKey]?.viewOnly
                            "
                            :disabled="disabled || busy"
                            @update:modelValue="
                                (v) =>
                                    emit(
                                        'sectionPreset',
                                        data.presetSectionKey,
                                        'view',
                                        v
                                    )
                            "
                        />
                    </div>
                    <div class="flex flex-col gap-2">
                        <label
                            :for="`sec-${data.presetSectionKey}-full`"
                            class="cursor-pointer text-sm font-medium mb-0 whitespace-nowrap"
                            >Full access</label
                        >
                        <ToggleSwitch
                            :inputId="`sec-${data.presetSectionKey}-full`"
                            :modelValue="
                                sectionPresets[data.presetSectionKey]?.fullAdmin
                            "
                            :disabled="disabled || busy"
                            @update:modelValue="
                                (v) =>
                                    emit(
                                        'sectionPreset',
                                        data.presetSectionKey,
                                        'full',
                                        v
                                    )
                            "
                        />
                    </div>
                </div>
                <div
                    v-else-if="
                        !data.isGroupHeader &&
                        data[a] !== null &&
                        !(data.hiddenActions && data.hiddenActions.includes(a))
                    "
                    class="pl-3"
                >
                    <InputField
                        :disabled="
                            disabled ||
                            busy ||
                            (a === 'view' && data.viewLocked)
                        "
                        variant="checkbox"
                        binary
                        :class="inputClass"
                        :modelValue="data[a]"
                        @update:modelValue="
                            (val) =>
                                emit('togglePermission', data.entity, a, val)
                        "
                    />
                </div>
            </template>
        </Column>
    </DataTable>
</template>
