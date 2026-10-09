<script setup>
import Card from 'primevue/card';
import { EXAMPLE_PAGE_TITLE } from '@/modules/_skeleton/config/example';
import { formatExampleLabel } from '@/modules/_skeleton/utils/example';
import { useExample } from '@/modules/_skeleton/composables';

const { ready, markReady } = useExample();
markReady();
</script>

<template>
    <TitleHeader>
        <template #title>
            <h1 class="text-2xl sm:text-3xl font-bold">
                {{ formatExampleLabel(EXAMPLE_PAGE_TITLE) }}
            </h1>
        </template>
    </TitleHeader>

    <Card class="py-3 px-2">
        <template #content>
            <p class="text-surface-600 dark:text-surface-400">
                Replace this component after copying
                <code class="text-sm">modules/_skeleton</code>
                to a new module folder.
            </p>
            <p v-if="ready" class="mt-2 text-sm text-surface-500">
                Composable, config, utils, services, and stores are wired as
                templates.
            </p>
        </template>
    </Card>
</template>
