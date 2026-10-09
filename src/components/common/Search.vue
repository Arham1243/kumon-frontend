<script setup>
import { debounce } from 'lodash-es';
import { computed } from 'vue';

const emit = defineEmits(['search', 'update:modelValue']);

const props = defineProps({
    modelValue: {
        type: String,
        default: ''
    },
    label: {
        type: String,
        default: ''
    },
    placeholder: {
        type: String,
        default: ''
    }
});

const inputValue = computed({
    get() {
        return props.modelValue;
    },
    set(value) {
        handleSearch(value);
        emit('update:modelValue', value ? value.trim() : '');
    }
});

const handleSearch = debounce(() => {
    emit('search', inputValue.value);
}, 600);
</script>

<template>
    <IconField>
        <InputIcon class="pi pi-search" />
        <InputText
            v-model="inputValue"
            class="w-full pr-8"
            :placeholder="placeholder || 'Search'"
            @input="handleSearch"
        />
        <i
            v-if="inputValue"
            class="pi pi-times absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
            @click="inputValue = ''"
        ></i>
    </IconField>
</template>

<style lang="scss" scoped></style>
