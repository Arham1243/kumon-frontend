<script setup>
import { computed } from 'vue';
import AppMenu from './AppMenu.vue';
import defaultLogo from '@/assets/images/logo.png';
import { useSessionStore } from '@/stores';

const sessionStore = useSessionStore();

const sidebarLogo = computed(() => {
    const company = sessionStore.myCompany;
    const logo = company?.logo_url || company?.logo;
    return logo || defaultLogo;
});
</script>

<template>
    <div class="layout-sidebar">
        <div class="sidebar-header">
            <router-link :to="{ name: 'Students' }" class="app-logo">
                <img
                    :src="sidebarLogo"
                    alt="Company Logo"
                    class="app-logo-normal object-contain !h-[6rem] !w-[11rem]"
                />
            </router-link>
        </div>
        <div class="layout-menu-container">
            <AppMenu />
        </div>
    </div>
</template>
