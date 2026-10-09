import { computed, reactive } from 'vue';

const layoutConfig = reactive({
    preset: 'Aura',
    primary: 'emerald',
    surface: null,
    darkTheme: false,
    menuMode: 'static',
    menuTheme: 'primaryColor'
});

const layoutState = reactive({
    staticMenuDesktopInactive: false,
    overlayMenuActive: false,
    sidebarActive: false,
    anchored: false,
    overlaySubmenuActive: false,
    profileSidebarVisible: false,
    configSidebarVisible: false,
    staticMenuMobileActive: false,
    menuHoverActive: false,
    activeMenuItem: null
});

/** Sync layout + `.app-dark` on `<html>` (same as tenant app). */
export function setDarkTheme(isDark) {
    const on = !!isDark;
    layoutConfig.darkTheme = on;
    document.documentElement.classList.toggle('app-dark', on);
}

export function useLayout() {
    const setActiveMenuItem = (item) => {
        layoutState.activeMenuItem = item.value || item;
    };

    const toggleMenu = () => {
        if (window.innerWidth > 991) {
            layoutState.staticMenuDesktopInactive =
                !layoutState.staticMenuDesktopInactive;
        } else {
            layoutState.staticMenuMobileActive =
                !layoutState.staticMenuMobileActive;
        }
    };

    const toggleConfigSidebar = () => {
        if (isSidebarActive.value) {
            layoutState.staticMenuMobileActive = false;
            layoutState.menuHoverActive = false;
        }

        layoutState.configSidebarVisible = !layoutState.configSidebarVisible;
    };

    const isDarkTheme = computed(() => layoutConfig.darkTheme);
    const isSidebarActive = computed(() => layoutState.staticMenuMobileActive);
    const isDesktop = computed(() => window.innerWidth > 991);

    const getPrimary = computed(() => layoutConfig.primary);
    const getSurface = computed(() => layoutConfig.surface);

    return {
        layoutConfig,
        layoutState,
        getPrimary,
        getSurface,
        toggleMenu,
        isSidebarActive,
        isDarkTheme,
        setActiveMenuItem,
        toggleConfigSidebar,
        isDesktop
    };
}
