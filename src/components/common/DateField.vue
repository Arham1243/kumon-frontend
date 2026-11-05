<script setup>
import { ref, watch, computed } from 'vue';
import DatePicker from 'vue-datepicker-next';
import { useSessionStore } from '@/stores';

const sessionStore = useSessionStore();

const props = defineProps({
    modelValue: { type: [String, Array] },
    range: { type: Boolean, default: false },
    placeholder: { type: String, default: 'Select' },
    /** Render calendar popup on document.body (required inside modals). */
    appendToBody: { type: Boolean, default: true },
    /** Month shown when the field has no value. */
    defaultCalendarDate: { type: [String, Date], default: null },
    /** Allow typing and pasting dates into the input. */
    editable: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const myCompanyDateFormat = computed(
    () => sessionStore.myCompany?.date_format || 'mm/dd/yy'
);

const internalDate = ref(props.modelValue);

watch(
    () => props.modelValue,
    (val) => {
        internalDate.value = val;
    }
);

function mapToDatePickerFormat(fmt) {
    switch (fmt) {
        case 'mm/dd/yy':
            return 'MM/DD/YYYY';
        case 'dd/mm/yy':
            return 'DD/MM/YYYY';
        case 'yy-mm-dd':
            return 'YYYY-MM-DD';
        default:
            return 'MM/DD/YYYY';
    }
}

const pickerFormat = computed(() =>
    mapToDatePickerFormat(myCompanyDateFormat.value)
);

watch(internalDate, (val) => {
    emit('update:modelValue', val || null);
});

function syncPopupZIndex() {
    let maxZ = 0;
    document.querySelectorAll('.p-overlay-mask').forEach((el) => {
        const z = Number.parseInt(window.getComputedStyle(el).zIndex, 10);
        if (Number.isFinite(z) && z > maxZ) {
            maxZ = z;
        }
    });
    document.documentElement.style.setProperty(
        '--mx-datepicker-z',
        String(maxZ + 2)
    );
}
</script>

<template>
    <DatePicker
        v-model:value="internalDate"
        type="date"
        class="!w-full"
        :format="pickerFormat"
        value-type="YYYY-MM-DD"
        :placeholder="placeholder"
        v-bind="$attrs"
        :range="range"
        :separator="range ? ' - ' : undefined"
        :editable="editable"
        :append-to-body="appendToBody"
        :default-value="defaultCalendarDate || undefined"
        @mousedown="syncPopupZIndex"
        @open="syncPopupZIndex"
    />
</template>
