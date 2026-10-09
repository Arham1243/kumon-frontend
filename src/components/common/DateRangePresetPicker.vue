<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import InputField from '@/components/common/InputField.vue';
import {
    PERIOD_OPTIONS,
    rangeForPreset,
    normalizeDateRange,
    areDateRangesEqual,
    dateRangeMatchesPreset
} from '@/utils/dateRangePresets';

const props = defineProps({
    dateRange: {
        type: Array,
        default: () => [null, null]
    },
    preset: {
        type: String,
        default: 'current_month'
    },
    defaultPreset: {
        type: String,
        default: null
    },
    disabled: {
        type: Boolean,
        default: false
    },
    showLabels: {
        type: Boolean,
        default: true
    },
    includeAll: {
        type: Boolean,
        default: true
    },
    periodPlaceholder: {
        type: String,
        default: 'Period'
    },
    datePlaceholder: {
        type: String,
        default: 'Select'
    },
    periodWidth: {
        type: String,
        default: '200px'
    },
    dateWidth: {
        type: String,
        default: '250px'
    },
    editable: {
        type: Boolean,
        default: true
    },
    clearable: {
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['update:dateRange', 'update:preset']);

const syncingFromPreset = ref(false);

const periodOptions = computed(() =>
    props.includeAll
        ? PERIOD_OPTIONS
        : PERIOD_OPTIONS.filter((o) => o.value !== 'all')
);

function applyPresetSync(preset) {
    if (preset === 'custom') {
        return;
    }
    const nextRange = normalizeDateRange(
        rangeForPreset(preset, props.dateRange)
    );
    if (areDateRangesEqual(nextRange, props.dateRange)) {
        return;
    }
    syncingFromPreset.value = true;
    emit('update:dateRange', nextRange);
    nextTick(() => {
        syncingFromPreset.value = false;
    });
}

function onPresetChange(value) {
    if (value === props.preset) {
        return;
    }
    emit('update:preset', value);
    applyPresetSync(value);
}

const localDateRange = computed({
    get: () => props.dateRange,
    set: (value) => {
        const nextRange = normalizeDateRange(value);
        if (areDateRangesEqual(nextRange, props.dateRange)) {
            return;
        }
        emit('update:dateRange', nextRange);
    }
});

watch(
    () => props.dateRange,
    (range) => {
        if (syncingFromPreset.value) {
            return;
        }
        const a = range?.[0];
        const b = range?.[1];
        if (!a && !b) {
            if (props.includeAll && props.preset !== 'all') {
                emit('update:preset', 'all');
            } else if (!props.includeAll && props.preset !== 'custom') {
                emit('update:preset', 'custom');
            }
            return;
        }
        if (a && b && props.preset !== 'custom') {
            if (dateRangeMatchesPreset(range, props.preset)) {
                return;
            }
            emit('update:preset', 'custom');
        }
    },
    { deep: true }
);

onMounted(() => {
    const hasRange = props.dateRange?.[0] && props.dateRange?.[1];
    if (hasRange) {
        return;
    }
    const initialPreset = props.defaultPreset ?? props.preset;
    if (!initialPreset || initialPreset === 'custom') {
        return;
    }
    if (props.preset !== initialPreset) {
        emit('update:preset', initialPreset);
    }
    applyPresetSync(initialPreset);
});
</script>

<template>
    <div class="flex flex-nowrap items-end gap-2 sm:gap-3">
        <div class="shrink-0">
            <label
                v-if="showLabels"
                class="block text-sm mb-1 text-surface-700 dark:text-surface-200"
                >Period</label
            >
            <InputField
                variant="dropdown"
                :model-value="preset"
                :options="periodOptions"
                optionLabel="label"
                optionValue="value"
                :placeholder="periodPlaceholder"
                class="shrink-0"
                :style="{ width: periodWidth }"
                :disabled="disabled"
                @update:model-value="onPresetChange"
            />
        </div>
        <div class="shrink-0">
            <label
                v-if="showLabels"
                class="block text-sm mb-1 text-surface-700 dark:text-surface-200"
                >Date</label
            >
            <InputField
                :placeholder="datePlaceholder"
                v-model="localDateRange"
                :clearable="clearable"
                :range="true"
                variant="date"
                :editable="editable"
                :disabled="disabled"
                :style="{ width: dateWidth }"
            />
        </div>
    </div>
</template>
