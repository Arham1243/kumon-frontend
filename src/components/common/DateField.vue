<script setup>
import { ref, watch, computed } from 'vue';
import DatePicker from 'vue-datepicker-next';
import { useSessionStore } from '@/stores';

const sessionStore = useSessionStore();

const props = defineProps({
    modelValue: { type: [String, Array] },
    range: { type: Boolean, default: false }
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

const pickerFormat = computed(() => mapToDatePickerFormat(myCompanyDateFormat));

watch(internalDate, (val) => {
    emit('update:modelValue', val || null);
});
</script>

<template>
    <DatePicker
        v-model:value="internalDate"
        type="date"
        class="!w-full"
        :format="pickerFormat"
        value-type="YYYY-MM-DD"
        placeholder="Select Date"
        v-bind="$attrs"
        :range="range"
        :editable="false"
    />
</template>
