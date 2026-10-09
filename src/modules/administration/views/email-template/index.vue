<script setup>
import EmailTemplateTable from '@/modules/administration/components/email-template/EmailTemplateTable.vue';
</script>

<template>
    <TitleHeader>
        <template #title>
            <div>
                <h1 class="text-2xl sm:text-3xl font-bold">Email Templates</h1>
            </div>
        </template>
    </TitleHeader>

    <Card>
        <template #content>
            <EmailTemplateTable />
        </template>
    </Card>
</template>
