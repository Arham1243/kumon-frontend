<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import useEventsBus from '@/composables/useEventsBus';

const route = useRoute();
const items = ref([]);

const home = {
    icon: 'pi pi-home',
    route: '/'
};

const { bus } = useEventsBus();

function setBreadcrumbRoutes() {
    if (route.meta.breadcrumb) {
        items.value = [...route.meta.breadcrumb];
    }
}

watch(
    () => [route.path, route.meta.breadcrumb],
    () => {
        setBreadcrumbRoutes();
    },
    { immediate: true }
);

watch(
    () => bus.value.get('updateDetailsBreadcrumb'),
    (val) => {
        if (!val || val[0] == null || String(val[0]).trim() === '') return;

        setBreadcrumbRoutes();
        const label = typeof val[0] === 'string' ? val[0] : String(val[0]);

        const i = items.value.length - 1;
        if (i >= 0) {
            items.value[i] = {
                ...items.value[i],
                label
            };
        } else {
            items.value.push({ label });
        }
    }
);
</script>

<template>
    <div class="global-breadcrumbs">
        <Breadcrumb :home="home" :model="items">
            <template #item="{ item, props }">
                <router-link
                    v-if="item.route"
                    v-slot="{ href, navigate }"
                    :to="item.route"
                    custom
                >
                    <a :href="href" v-bind="props.action" @click="navigate">
                        <span
                            v-if="item.icon"
                            :class="[item.icon, 'text-color']"
                        />
                        <span class="">{{ item.label }}</span>
                    </a>
                </router-link>
                <a
                    v-else
                    :href="item.url"
                    :target="item.target"
                    v-bind="props.action"
                >
                    <span class="">{{ item.label }}</span>
                </a>
            </template>
        </Breadcrumb>
    </div>
</template>
