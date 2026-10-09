<script setup>
import { ref } from 'vue';

defineProps({
    disabled: {
        type: Boolean,
        default: false
    },
    label: {
        type: String,
        default: 'Export'
    }
});

const emit = defineEmits(['export']);

const exportMenu = ref(null);

const exportMenuItems = [
    {
        icon: 'pi pi-file-excel',
        label: 'To Excel',
        command: () => emit('export', 'excel')
    },
    {
        icon: 'pi pi-file-pdf',
        label: 'To PDF',
        command: () => emit('export', 'pdf')
    }
];

function showExportMenu(event) {
    exportMenu.value?.toggle(event);
}
</script>

<template>
    <div class="inline-flex">
        <Button
            :label="label"
            icon="pi pi-download"
            variant="outlined"
            size="medium"
            :disabled="disabled"
            @click="showExportMenu"
        />
        <Menu ref="exportMenu" :model="exportMenuItems" :popup="true" />
    </div>
</template>
