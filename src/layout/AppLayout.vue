<script setup>
import { useRoute } from 'vue-router';
import { useLayout } from '@/layout/composables/layout';
import { computed, onBeforeMount, onBeforeUnmount, ref, watch } from 'vue';
import AppBreadCrumb from './AppBreadcrumb.vue';
import AppConfig from './AppConfig.vue';
import AppProfileSidebar from './AppProfileSidebar.vue';
import AppSidebar from './AppSidebar.vue';
import AppTopbar from './AppTopbar.vue';
import Forbidden from '@/views/errors/Forbidden.vue';
import { useSessionStore, useGlobalStore } from '@/stores';

const { layoutConfig, layoutState, isSidebarActive } = useLayout();

const outsideClickListener = ref(null);
const loading = ref(true);
const currentUser = ref(null);
const sessionStore = useSessionStore();
const globalStore = useGlobalStore();
const route = useRoute();

const layoutContentClass = computed(() => ({
    'layout-content--full-width': Boolean(route.meta.fullWidthContent)
}));

function bindOutsideClickListener() {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                layoutState.staticMenuMobileActive = false;
                layoutState.menuHoverActive = false;
                layoutState.configSidebarVisible = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
}

function unbindOutsideClickListener() {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener.value);
        outsideClickListener.value = null;
    }
}

function isOutsideClicked(event) {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const topbarButtonEl = document.querySelector('.topbar-menubutton');

    return !(
        sidebarEl?.isSameNode(event.target) ||
        sidebarEl?.contains(event.target) ||
        topbarButtonEl?.isSameNode(event.target) ||
        topbarButtonEl?.contains(event.target)
    );
}

watch(isSidebarActive, (newVal) => {
    if (newVal) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

onBeforeMount(async () => {
    try {
        if (!sessionStore.user) {
            await sessionStore.me();
        }
        currentUser.value = sessionStore.user;
    } catch {
        /* invalid session or API unreachable; router/auth flow handles redirect */
    } finally {
        loading.value = false;
    }
});

onBeforeUnmount(() => {
    unbindOutsideClickListener();
});

const containerClass = computed(() => ({
    'layout-light': !layoutConfig.darkTheme,
    'layout-dark': layoutConfig.darkTheme,
    'layout-primarycolor-menu': true,
    'layout-static': true,
    'layout-static-inactive': layoutState.staticMenuDesktopInactive,
    'layout-mobile-active': layoutState.staticMenuMobileActive
}));
</script>

<template>
    <Forbidden v-if="globalStore.routeForbidden" />
    <div
        :class="['layout-container', { ...containerClass }]"
        v-else
    >
        <div
            class="w-screen h-screen flex justify-center items-center"
            v-if="loading"
        >
            <Loader />
        </div>
        <div v-else-if="!loading">
            <AppSidebar />
            <div class="layout-content-wrapper">
                <AppTopbar />
                <AppBreadCrumb class="content-breadcrumb"></AppBreadCrumb>
                <div class="layout-content" :class="layoutContentClass">
                    <router-view></router-view>
                </div>
            </div>
            <AppProfileSidebar />
            <AppConfig />
        </div>
        <Toast></Toast>
        <div class="layout-mask"></div>
    </div>
</template>
