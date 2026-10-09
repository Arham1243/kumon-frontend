<script setup>
import AppMenu from './AppMenu.vue';
import Logo from '@/assets/images/logo.png';
</script>

<template>
    <div class="layout-sidebar">
        <div class="sidebar-header">
            <router-link :to="{ name: 'Dashboard' }" class="app-logo">
                <img
                    :src="Logo"
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
